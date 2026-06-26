"""
KisanLens Backend API
Crop Disease Analysis using Google Gemma 4 12B Quantized Model
FastAPI + Ollama
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import json
import base64
import io
import logging
from PIL import Image
import requests
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
from dotenv import load_dotenv
import hashlib
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app initialization
app = FastAPI(
    title="KisanLens Backend API",
    description="Crop Disease Analysis with Google Gemma 4 12B Quantized Model",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        # Add your production domain here
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Configuration from environment
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "gemma4:e4b")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "800"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.3"))
IMAGE_MAX_SIZE = int(os.getenv("IMAGE_MAX_SIZE", "800"))   # smaller = faster inference
TIMEOUT_SECONDS = int(os.getenv("TIMEOUT_SECONDS", "300"))  # 5 min for local Gemma 4

# Analysis cache directory (optional)
CACHE_DIR = Path("./analysis_cache")
CACHE_DIR.mkdir(exist_ok=True)

logger.info(f"Starting KisanLens Backend")
logger.info(f"Ollama URL: {OLLAMA_BASE_URL}")
logger.info(f"Model: {MODEL_NAME}")

# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = """You are KisanLens, an expert crop disease AI for Indian farmers.
Analyse the crop image and return ONLY a valid JSON object — no markdown, no extra text.

JSON schema (fill every field):
{
  "crop_type": "Crop name, e.g. Tomato",
  "disease_name": "Common disease name, or 'Healthy Crop' if healthy",
  "scientific_name": "Scientific name or empty string",
  "confidence": "High|Medium|Low",
  "confidence_score": 0.85,
  "severity": "Mild|Moderate|Severe",
  "urgency": "One sentence: most important action for the farmer right now",
  "description": "2-3 sentences describing visible symptoms and what they mean",
  "root_cause": "Why this condition developed",
  "differential_diagnoses": ["alt disease 1", "alt disease 2"],
  "organic_treatments": [
    {"rank": 1, "name": "Treatment name", "active_ingredient": "ingredient", "dosage": "dose", "how_to_prepare": "steps", "application_method": "spray|drench"},
    {"rank": 2, "name": "Treatment name", "active_ingredient": "ingredient", "dosage": "dose", "how_to_prepare": "steps", "application_method": "spray|drench"},
    {"rank": 3, "name": "Treatment name", "active_ingredient": "ingredient", "dosage": "dose", "how_to_prepare": "steps", "application_method": "spray|drench"}
  ],
  "prevention_strategies": [
    {"strategy": "strategy name", "description": "explanation"},
    {"strategy": "strategy name", "description": "explanation"},
    {"strategy": "strategy name", "description": "explanation"}
  ],
  "government_schemes": [
    {"scheme_name": "PM-KISAN", "benefit_amount": "Rs 6000/year", "how_to_apply": "pmkisan.gov.in"},
    {"scheme_name": "PMFBY", "benefit_amount": "Crop insurance", "how_to_apply": "pmfby.gov.in"}
  ],
  "immediate_actions": ["action 1", "action 2"],
  "notes": "Short farmer-friendly advice"
}

Return ONLY the JSON. No explanation before or after."""


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    try:
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG", quality=85, optimize=True)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return img_str
    except Exception as e:
        logger.error(f"Error converting image to base64: {e}")
        raise


def validate_image(image: Image.Image, min_size: int = 50) -> bool:
    """Validate image is suitable for analysis"""
    width, height = image.size
    
    if width < min_size or height < min_size:
        raise HTTPException(
            status_code=400,
            detail=f"Image too small. Minimum: {min_size}x{min_size}, Got: {width}x{height}"
        )
    
    if width > IMAGE_MAX_SIZE or height > IMAGE_MAX_SIZE:
        logger.info(f"Resizing large image from {width}x{height}")
        image.thumbnail((IMAGE_MAX_SIZE, IMAGE_MAX_SIZE), Image.Resampling.LANCZOS)
    
    return True


def get_image_hash(image_bytes: bytes) -> str:
    """Generate hash of image for caching"""
    return hashlib.md5(image_bytes).hexdigest()


async def call_ollama_with_vision(image_base64: str, prompt: str) -> dict:
    """
    Call Ollama API with vision capabilities
    Supports multimodal models like Gemma 4
    """
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "temperature": TEMPERATURE,
        "num_predict": MAX_TOKENS,
        "images": [image_base64],
        "system": SYSTEM_PROMPT
    }
    
    try:
        logger.info(f"Calling Ollama model: {MODEL_NAME}")
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=TIMEOUT_SECONDS
        )
        response.raise_for_status()
        
        result = response.json()
        logger.info("Ollama response received successfully")
        return result
        
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error to Ollama: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to Ollama server at {OLLAMA_BASE_URL}. Is it running? (ollama serve)"
        )
    except requests.exceptions.Timeout:
        logger.error("Ollama inference timeout")
        raise HTTPException(
            status_code=504,
            detail=f"Model inference timeout after {TIMEOUT_SECONDS}s. Try smaller image or simpler prompt."
        )
    except Exception as e:
        logger.error(f"Ollama API error: {e}")
        raise HTTPException(status_code=500, detail=f"Model error: {str(e)}")


def extract_json_from_response(response_text: str) -> dict:
    """
    Extract JSON from model response
    Handles cases where model adds extra text
    """
    try:
        # Try direct JSON parsing first
        return json.loads(response_text.strip())
    except json.JSONDecodeError:
        logger.warning("Failed direct JSON parse, searching for JSON block")
        
        # Try to find JSON block in response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            try:
                json_str = response_text[start_idx:end_idx]
                logger.info("Found JSON block in response")
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                logger.error(f"JSON parsing failed: {e}")
                raise HTTPException(
                    status_code=500,
                    detail="Model returned invalid JSON. Please try again with a clearer image."
                )
        
        logger.error("No JSON found in response")
        raise HTTPException(
            status_code=500,
            detail="Model did not return expected JSON format"
        )


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health_check():
    """
    Check if backend and model server are healthy
    Returns: Status, available models, system info
    """
    try:
        response = requests.get(
            f"{OLLAMA_BASE_URL}/api/tags",
            timeout=5
        )
        response.raise_for_status()
        models = response.json().get("models", [])
        
        # Check if required model is loaded
        model_names = [m["name"] for m in models]
        model_available = any(MODEL_NAME in name for name in model_names)
        
        return {
            "status": "healthy" if model_available else "model_not_loaded",
            "timestamp": datetime.utcnow().isoformat(),
            "ollama_url": OLLAMA_BASE_URL,
            "required_model": MODEL_NAME,
            "available_models": model_names,
            "system_info": {
                "max_tokens": MAX_TOKENS,
                "temperature": TEMPERATURE,
                "max_image_size": IMAGE_MAX_SIZE,
                "timeout_seconds": TIMEOUT_SECONDS
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Ollama server not responding at {OLLAMA_BASE_URL}"
        )


# ============================================================================
# MAIN ANALYSIS ENDPOINT
# ============================================================================

@app.post("/analyze-crop")
async def analyze_crop(
    file: UploadFile = File(..., description="Crop image (JPEG/PNG)"),
    verbose: bool = Query(False, description="Include detailed explanations")
):
    """
    🌾 **MAIN ENDPOINT: Analyze crop image for diseases and treatments**
    
    Input:
    - file: Image file (JPEG or PNG format)
    - verbose: Include detailed explanations (default: false)
    
    Output: Comprehensive diagnosis with organic & chemical treatments
    
    Example usage:
    ```python
    import requests
    with open("crop.jpg", "rb") as f:
        response = requests.post(
            "http://localhost:8000/analyze-crop",
            files={"file": f}
        )
    diagnosis = response.json()
    ```
    """
    
    analysis_start = datetime.utcnow()
    
    try:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(
                status_code=400,
                detail="Only JPEG and PNG images are supported"
            )
        
        # Read and validate image
        logger.info(f"Processing image: {file.filename}")
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        validate_image(image)
        
        logger.info(f"Image size: {image.size}")
        
        # Convert to base64 for API
        image_base64 = image_to_base64(image)
        
        # Build analysis prompt (system prompt has the full schema)
        base_prompt = "Analyse this crop image and return the JSON diagnosis."
        
        # Call model
        logger.info("Calling Gemma 4 12B model for analysis")
        ollama_response = await call_ollama_with_vision(image_base64, base_prompt)
        
        # Extract response
        response_text = ollama_response.get("response", "")
        if not response_text:
            raise HTTPException(
                status_code=500,
                detail="Model returned empty response"
            )
        
        logger.info("Parsing model response")
        diagnosis = extract_json_from_response(response_text)
        
        # Add metadata
        analysis_duration = (datetime.utcnow() - analysis_start).total_seconds()
        diagnosis["_metadata"] = {
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "analysis_duration_seconds": analysis_duration,
            "model": MODEL_NAME,
            "image_filename": file.filename,
            "image_size": list(image.size),
            "api_version": "1.0.0"
        }
        
        logger.info(f"Analysis complete. Duration: {analysis_duration:.2f}s")
        
        return JSONResponse(status_code=200, content=diagnosis)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# ============================================================================
# CONTEXTUAL ANALYSIS ENDPOINT
# ============================================================================

@app.post("/analyze-with-context")
async def analyze_with_context(
    file: UploadFile = File(..., description="Crop image"),
    crop_type: Optional[str] = Query(None, description="Crop name (e.g., 'Mango', 'Paddy')"),
    region: Optional[str] = Query(None, description="State/Region (e.g., 'Maharashtra')"),
    season: Optional[str] = Query(None, description="Season (Kharif/Rabi/Summer)"),
    irrigation: Optional[str] = Query(None, description="Irrigation type (Flood/Drip/Rainfed)")
):
    """
    **Analyze crop with additional context for better diagnosis**
    
    Provides location and season-specific treatment recommendations
    
    Query Parameters:
    - crop_type: Crop name (optional)
    - region: Geographic region (optional, for regional schemes)
    - season: Current season (optional)
    - irrigation: Irrigation type (optional)
    
    Returns: Enhanced diagnosis with region-specific recommendations
    """
    
    try:
        # Validate and process image
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Only JPEG and PNG supported")
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        validate_image(image)
        image_base64 = image_to_base64(image)
        
        # Build context-aware prompt
        context_parts = []
        if crop_type:
            context_parts.append(f"Crop: {crop_type}")
        if region:
            context_parts.append(f"Region: {region}")
        if season:
            context_parts.append(f"Season: {season}")
        if irrigation:
            context_parts.append(f"Irrigation: {irrigation}")
        
        context_info = "\n".join(context_parts) if context_parts else ""
        
        prompt = f"""Analyze this crop image for disease:

{context_info}

Provide:
1. Confirm crop type
2. Identify disease with high confidence
3. Suggest organic treatments best suited for {region or 'India'}
4. Suggest chemical treatments available in {region or 'the region'}
5. Prevention specific to {season or 'the'} season
6. Schemes applicable in {region or 'India'}

Return ONLY valid JSON."""
        
        # Call model
        logger.info(f"Contextual analysis: crop={crop_type}, region={region}, season={season}")
        ollama_response = await call_ollama_with_vision(image_base64, prompt)
        response_text = ollama_response.get("response", "")
        diagnosis = extract_json_from_response(response_text)
        
        # Add context metadata
        diagnosis["_context"] = {
            "crop_type_provided": crop_type,
            "region": region,
            "season": season,
            "irrigation_type": irrigation
        }
        diagnosis["_metadata"] = {
            "analysis_timestamp": datetime.utcnow().isoformat(),
            "model": MODEL_NAME
        }
        
        return JSONResponse(status_code=200, content=diagnosis)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Contextual analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# REFERENCE ENDPOINTS
# ============================================================================

@app.get("/treatment-guide/{treatment_type}")
async def get_treatment_guide(treatment_type: str):
    """
    **Get comprehensive treatment guides**
    
    Parameters:
    - treatment_type: 'organic' or 'chemical'
    
    Returns: Detailed guide with dosages, safety periods, costs, etc.
    """
    
    organic_guide = {
        "category": "Organic Treatments for Indian Crops",
        "neem_oil": {
            "scientific_name": "Azadirachta indica",
            "product_concentration": "3% (commercial) / 3-5% (homemade)",
            "application_rate": "3-5 liters per hectare OR 30-50 ml per liter",
            "frequency": "Every 7-10 days",
            "safety_period": "7-10 days before harvest",
            "preparation": "Mix neem oil with water and add 1 tsp soap per liter as emulsifier",
            "effectiveness": "70-80% against soft-bodied insects, mites, fungal diseases",
            "cost_per_hectare": "₹500-1000",
            "best_for_crops": ["Mango", "Paddy", "Cotton", "Vegetables", "Pulses"],
            "advantages": ["Biodegradable", "Food-safe", "Multi-purpose", "Cheap"],
            "disadvantages": ["Slower acting", "Weather dependent", "Needs repeat sprays"],
            "application_time": "Early morning or evening",
            "storage": "Cool, dark place for max 1 year"
        },
        "sulfur_dust": {
            "active_ingredient": "Elemental sulfur (99% purity)",
            "application_rate": "5-10 kg per hectare OR 5-7 grams per m²",
            "frequency": "Every 7-10 days",
            "safety_period": "3-5 days before harvest",
            "effectiveness": "90% for powdery mildew, rust, mange",
            "cost_per_hectare": "₹300-500",
            "best_for_crops": ["Grape", "Apple", "Chili", "Tobacco", "Cucurbits"],
            "advantages": ["Very effective", "Cheap", "Long shelf life", "Safe"],
            "disadvantages": ["Dust inhalation risk", "No rainy day application"],
            "precautions": "Wear mask during application. Avoid sulfur 30 days before/after oil sprays",
            "storage": "Dry place, protected from moisture"
        },
        "bordeaux_mixture": {
            "composition": "Copper sulfate (1%) + Calcium hydroxide",
            "application_rate": "1% solution = 10g copper sulfate + 10g lime per liter",
            "frequency": "Every 10-15 days",
            "safety_period": "14 days before harvest",
            "effectiveness": "85-90% for leaf spots, late blight, anthracnose",
            "cost_per_hectare": "₹400-700",
            "best_for_crops": ["Mango", "Grape", "Potato", "Tomato"],
            "advantages": ["Proven effective", "Copper acts as fungicide", "Safe for soil"],
            "disadvantages": ["Slightly toxic", "Can burn foliage in high heat"],
            "how_to_prepare": "1. Dissolve copper sulfate in hot water. 2. In separate vessel, dilute lime with water. 3. Mix both slowly. 4. Let settle 2 hours before use.",
            "application_time": "Early morning"
        },
        "pseudomonas_fluorescens": {
            "type": "Bioagent (beneficial bacteria)",
            "application_rate": "Typically 10⁸ CFU/ml, spray 5 liters per hectare",
            "frequency": "Every 7-10 days, 2-3 weeks after disease appearance",
            "safety_period": "0 days (completely safe)",
            "effectiveness": "60-75% for fungal diseases, suppresses pathogens",
            "cost_per_hectare": "₹1500-2500",
            "best_for_crops": ["Cotton", "Chili", "Vegetables"],
            "advantages": ["Completely organic", "No harvest restrictions", "Builds soil health"],
            "disadvantages": ["Slower acting", "Needs warm, moist conditions"],
            "storage": "Refrigerate, use within 3 months",
            "where_to_buy": "State agriculture departments, certified organic suppliers"
        },
        "triphosphate": {
            "product": "Mixture of neem + sulfur + phosphate",
            "application_rate": "500-1000g per hectare",
            "frequency": "Every 7 days",
            "safety_period": "3 days",
            "effectiveness": "70% for general pest/disease suppression",
            "cost": "₹800-1200 per hectare",
            "advantages": ["Multi-purpose", "Homemade option available"],
            "homemade_recipe": "Mix neem powder (200g) + sulfur (300g) + rock phosphate (300g) + soil (500g)"
        }
    }
    
    chemical_guide = {
        "category": "Chemical Treatments for Indian Crops",
        "fungicides": {
            "mancozeb": {
                "trade_names": ["Indofil M45", "Pacha M45", "Mancojet"],
                "type": "Fungicide (75% WP)",
                "dosage": "2-2.5 g per liter OR 2-2.5 kg per hectare",
                "frequency": "Every 10-14 days",
                "pre_harvest_interval": "14 days",
                "re_entry": "24 hours",
                "toxicity": "WHO Class II (Moderately toxic)",
                "effectiveness": "90% for early blight, late blight, leaf spots",
                "cost": "₹400-600 per kg",
                "best_for": ["Potato", "Tomato", "Onion", "Grapes"],
                "compatibility": "Compatible with most insecticides except sulfur-based",
                "precautions": ["Wear gloves and mask", "Avoid inhaling dust", "Wash hands thoroughly"],
                "disposal": "Bury empty packets in pit, never burn"
            },
            "carbendazim": {
                "trade_names": ["Bavistin", "Karbendazim", "Indofil C"],
                "type": "Fungicide (50% WP)",
                "dosage": "1-1.5 g per liter OR 1-1.5 kg per hectare",
                "frequency": "Every 7-10 days (max 3 sprays per season)",
                "pre_harvest_interval": "7 days",
                "re_entry": "24 hours",
                "toxicity": "WHO Class II",
                "effectiveness": "85% for powdery mildew, canker, blight",
                "cost": "₹300-500 per kg",
                "best_for": ["Wheat", "Barley", "Apple", "Mango"],
                "note": "Do not use continuously to avoid resistance",
                "precautions": ["Limit to 3 sprays maximum per season"]
            }
        },
        "insecticides": {
            "imidacloprid": {
                "trade_names": ["Confidor", "Gaucho", "Imida"],
                "type": "Insecticide (17.8% SL)",
                "dosage": "0.5 ml per liter OR 500 ml per hectare",
                "frequency": "Every 7-10 days",
                "pre_harvest_interval": "21 days",
                "re_entry": "48 hours",
                "toxicity": "WHO Class II (Medium)",
                "effectiveness": "95% for aphids, whiteflies, thrips, leaf hoppers",
                "cost": "₹2000-2500 per liter",
                "best_for": ["Cotton", "Vegetables", "Cereals", "Sugarcane"],
                "advantages": ["Systemic action", "Quick knock-down", "Long residual"],
                "precautions": ["Highly toxic to bees - avoid during flowering"]
            },
            "chlorpyrifos": {
                "trade_names": ["Dursban", "Chlor Guard", "Lorsban"],
                "type": "Insecticide (20% EC)",
                "dosage": "2.5 ml per liter OR 2.5 liters per hectare",
                "frequency": "Every 10-14 days",
                "pre_harvest_interval": "21 days",
                "re_entry": "72 hours",
                "toxicity": "WHO Class II",
                "effectiveness": "90% for chewing insects, borers, cutworms",
                "cost": "₹200-400 per liter",
                "best_for": ["Cotton", "Vegetables", "Maize"],
                "precautions": ["Keep away from aquatic sources", "Wear complete PPE"]
            }
        }
    }
    
    guides = {
        "organic": organic_guide,
        "chemical": chemical_guide
    }
    
    if treatment_type.lower() not in guides:
        raise HTTPException(
            status_code=400,
            detail="Invalid treatment type. Use 'organic' or 'chemical'"
        )
    
    return {
        "treatment_type": treatment_type.lower(),
        "guide": guides[treatment_type.lower()],
        "last_updated": "2024-June",
        "note": "Prices and availability vary by region and season. Contact local agricultural supplier for current rates."
    }


@app.get("/schemes")
async def get_government_schemes():
    """
    **Government of India Agriculture Schemes**
    
    Returns: Information about agricultural support schemes
    """
    
    schemes = {
        "direct_income_support": {
            "PM-KISAN": {
                "full_name": "Pradhan Mantri Kisan Samman Nidhi",
                "ministry": "Ministry of Agriculture & Farmers Welfare",
                "benefit": "₹6,000 per year in 3 installments (₹2,000 each)",
                "eligibility": "All landholding farmers (no income limit)",
                "who_gets": "Direct to bank account",
                "apply": "https://pmkisan.gov.in",
                "helpline": "1800-11-5555 (toll-free)",
                "documents_needed": ["Aadhar card", "Bank account", "Land document"],
                "status_check": "Check status on website using name/Aadhaar"
            }
        },
        "insurance": {
            "PMFBY": {
                "full_name": "Pradhan Mantri Fasal Bima Yojana",
                "ministry": "Ministry of Agriculture",
                "benefit": "Crop insurance for yield losses due to weather, pests, disease",
                "premium": "Kharif: 2% of sum insured, Rabi: 1.5%, Summer: 5%",
                "eligibility": "All farmers, covered crops only",
                "claim_amount": "Difference between expected yield and actual yield",
                "apply": "Through bank or online https://pmfby.gov.in",
                "covered_crops": ["Paddy", "Wheat", "Cotton", "Pulses", "Oilseeds", "Spices", "Horticultural crops"],
                "max_sum_insured": "₹1,00,000 to ₹5,00,000 depending on crop",
                "claim_process": "Losses assessed by government, claims paid within 30 days"
            }
        },
        "credit": {
            "KCC": {
                "full_name": "Kisaan Credit Card",
                "ministry": "Ministry of Agriculture",
                "benefit": "Agricultural loans at subsidized interest rate (4-7%)",
                "credit_limit": "Up to ₹3,00,000 per hectare (varies)",
                "tenure": "Seasonal/Short-term (12 months)",
                "eligibility": "Farmers with valid land records, not defaulters",
                "apply": "Nearest bank branch (all banks issue)",
                "documents": ["Aadhar", "Land document", "Bank account", "Income certificate"],
                "processing_time": "15-30 days",
                "repayment": "Flexible based on harvest season"
            }
        },
        "soil_testing": {
            "Soil Health Card": {
                "full_name": "Soil Health Card Scheme",
                "ministry": "Ministry of Agriculture",
                "benefit": "FREE soil testing every 2 years",
                "provides": "Soil nutrient status, crop-wise recommendations",
                "samples_tested": "8 nutrients (N, P, K, S, Zn, Fe, Cu, Mn)",
                "apply": "District agricultural office or online portal",
                "report_time": "15-20 days after sample submission",
                "validity": "Valid for 2 years",
                "recommendations": "Personalized fertilizer prescription for each crop",
                "cost": "FREE for farmers"
            }
        },
        "state_specific": {
            "Maharashtra_schemes": {
                "Maha-e-Kranti": {
                    "benefit": "Modern agricultural technology awareness",
                    "contact": "www.mahaagriculture.com"
                },
                "Jyotiba Phule Loan Scheme": {
                    "benefit": "Crop loans at ₹7 per ₹1000 per annum interest",
                    "apply": "Cooperative banks, district agriculture office"
                }
            },
            "Punjab_schemes": {
                "Cooperative_Credit": {
                    "benefit": "Credit through cooperative societies at 7% interest",
                    "contact": "District cooperative office"
                }
            },
            "Tamil_Nadu_schemes": {
                "Agricultural_Insurance": {
                    "benefit": "State-specific crop insurance schemes",
                    "apply": "TAO (Tamil Nadu Agriculture Officer)"
                }
            }
        }
    }
    
    return {
        "total_schemes": 5,
        "schemes": schemes,
        "important_note": "Scheme details change yearly. Visit official portals for latest information.",
        "contact_help": "Call Kisan Helpline: 1551 (from landline) or 9643000440 (mobile)",
        "last_updated": "June 2024"
    }


# ============================================================================
# API DOCUMENTATION & ROOT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API documentation"""
    return {
        "name": "🌾 KisanLens Backend API",
        "version": "1.0.0",
        "description": "Crop Disease Analysis using Google Gemma 4 12B Quantized Model",
        "status": "Active",
        "model": {
            "name": MODEL_NAME,
            "quantization": "Q4_K_M (6.4 GB)",
            "capabilities": ["Image understanding", "Multi-turn reasoning", "JSON output"],
            "inference_engine": "Ollama"
        },
        "endpoints": {
            "🏥 Analysis": {
                "POST /analyze-crop": "Analyze crop image for diseases (main endpoint)",
                "POST /analyze-with-context": "Analysis with crop type, region, season"
            },
            "📚 Reference": {
                "GET /treatment-guide/{organic|chemical}": "Detailed treatment guides with dosages",
                "GET /schemes": "Government agriculture schemes & support",
                "GET /health": "System health & model status"
            },
            "📖 Docs": {
                "GET /docs": "Interactive API documentation (Swagger UI)",
                "GET /redoc": "Alternative API docs (ReDoc)"
            }
        },
        "quick_start": {
            "curl": "curl -X POST http://localhost:8000/analyze-crop -F 'file=@crop.jpg'",
            "python": "See /docs for Python examples"
        },
        "response_time": "5-30 seconds (depends on image size and model)",
        "supported_formats": ["JPEG", "PNG"],
        "max_image_size": f"{IMAGE_MAX_SIZE}x{IMAGE_MAX_SIZE}px",
        "docker_command": "docker-compose up -d"
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Catch-all exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "status_code": 500,
            "message": "Internal server error. Check logs for details.",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("=" * 60)
    logger.info("🌾 KisanLens Backend Starting")
    logger.info(f"Ollama URL: {OLLAMA_BASE_URL}")
    logger.info(f"Model: {MODEL_NAME}")
    logger.info(f"Max tokens: {MAX_TOKENS}")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("KisanLens Backend Shutting Down")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting FastAPI server...")
    logger.info("Visit http://localhost:8000/docs for interactive API documentation")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
        workers=1  # Single worker for model state consistency
    )
