# KisanLens Backend Setup Guide
## Google Gemma 4 12B Quantized Model for Crop Disease Analysis

---

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Model Setup Options](#model-setup-options)
3. [Recommended Setup: Ollama + FastAPI](#recommended-setup-ollama--fastapi)
4. [Advanced Setup: llama.cpp Server](#advanced-setup-llamacpp-server)
5. [FastAPI Backend Implementation](#fastapi-backend-implementation)
6. [System Prompt for Crop Analysis](#system-prompt-for-crop-analysis)
7. [API Endpoints Documentation](#api-endpoints-documentation)
8. [Testing & Deployment](#testing--deployment)

---

## System Requirements

### Minimum Hardware
- **CPU**: Intel i5 / AMD Ryzen 5 or equivalent
- **RAM**: 16 GB (8 GB minimum for Q4 quantization)
- **Storage**: 20 GB free space for model + dependencies
- **GPU** (Optional but recommended):
  - NVIDIA with CUDA 11.8+ (10GB VRAM) — dramatically faster
  - Apple Silicon (MPS) — excellent on MacBook
  - AMD ROCm support available

### Supported OS
- Ubuntu 20.04+ / Debian 11+
- macOS 11+
- Windows 10/11 (WSL2 recommended)

### Quantization Models Available for Gemma 4 12B
- **Q4_K_M** (6.4 GB) — Recommended for most setups; good speed/quality balance
- **Q5_K_M** (8.4 GB) — Better quality, slightly slower
- **Q8_0** (12 GB) — Near-original quality, slower, more VRAM needed

---

## Model Setup Options

### Option 1: Ollama (Recommended for Buildathon) ✅
**Best for**: Quick setup, easy to use, cross-platform
- **Pros**: One-command setup, automatic quantization, built-in API
- **Cons**: Less customization, slower inference than native llama.cpp
- **Setup time**: < 5 minutes

### Option 2: llama.cpp Server
**Best for**: Performance, fine-grained control
- **Pros**: Fastest inference, direct model control
- **Cons**: More complex setup
- **Setup time**: 15-20 minutes

### Option 3: Hugging Face Transformers (Python)
**Best for**: Fine-tuning, research
- **Pros**: Full framework control, easy to customize
- **Cons**: Requires more VRAM, slower on CPU
- **Setup time**: 10 minutes

---

## Recommended Setup: Ollama + FastAPI

### Step 1: Install Ollama

**macOS / Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from https://ollama.ai/download/windows

**Verify installation:**
```bash
ollama --version
```

### Step 2: Pull Gemma 4 12B Quantized Model

```bash
# Pull the quantized model (auto-downloads Q4_K_M by default)
ollama pull gemma:4-12b-q4_km

# Or pull Q5 for better quality
ollama pull gemma:4-12b-q5_k_m

# Verify the model is loaded
ollama list
```

**Expected output:**
```
NAME                    ID              SIZE     MODIFIED
gemma:4-12b-q4_km      a1234b5c6d7e    6.4 GB   2 seconds ago
```

### Step 3: Start Ollama Server

```bash
# Run in background (macOS/Linux)
ollama serve &

# Or just run in foreground for development
ollama serve
```

**Server runs on**: `http://localhost:11434`

### Step 4: Test Ollama API

```bash
# Test model inference
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemma:4-12b-q4_km",
    "prompt": "What is the best pesticide for mango leaf spot?"
  }'
```

---

## Advanced Setup: llama.cpp Server

### Step 1: Clone and Build llama.cpp

```bash
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp

# Build with GPU acceleration (CUDA)
make LLAMA_CUDA=1

# Or just CPU
make
```

### Step 2: Download Gemma 4 12B Quantized GGUF

```bash
# Option A: From Hugging Face (recommended)
cd models
wget https://huggingface.co/TheBloke/Gemma-4-12b-q4_k_m-gguf/resolve/main/gemma-4-12b-q4_k_m.gguf

# Option B: Using ollama export
ollama export gemma:4-12b-q4_km ./gemma-4-12b-q4_k_m.gguf
```

### Step 3: Start llama.cpp Server

```bash
./server -m ./models/gemma-4-12b-q4_k_m.gguf \
  --host 0.0.0.0 \
  --port 8000 \
  -ngl 33 \
  -c 2048 \
  -n 512
```

**Parameters**:
- `-ngl 33`: Use 33 GPU layers (adjust based on your VRAM)
- `-c 2048`: Context size
- `-n 512`: Max new tokens

---

## FastAPI Backend Implementation

### Step 1: Install Dependencies

```bash
pip install fastapi uvicorn python-multipart pillow python-dotenv requests
```

### Step 2: Create Project Structure

```
kisanlens-backend/
├── main.py                    # FastAPI app
├── models.py                  # Pydantic models
├── config.py                  # Configuration
├── system_prompt.py           # System prompt definitions
├── requirements.txt
└── .env
```

### Step 3: Environment Configuration

**Create `.env`:**
```
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=gemma:4-12b-q4_km
MAX_TOKENS=1000
TEMPERATURE=0.3
```

**Or for llama.cpp:**
```
LLAMACPP_BASE_URL=http://localhost:8000
MODEL_NAME=gemma-4-12b
MAX_TOKENS=1000
```

### Step 4: System Prompt

**See detailed system prompt below in "System Prompt for Crop Analysis" section**

---

## System Prompt for Crop Analysis

### Complete System Prompt for Gemma 4 12B

```
You are an expert agronomist and plant pathologist with 20+ years of experience in crop disease management.

TASK:
Analyze the provided crop/plant image to identify any diseases, pests, or nutritional deficiencies. Provide:
1. Disease/pest identification with confidence level
2. Severity assessment (Mild/Moderate/Severe)
3. Organic treatment methods
4. Chemical treatment methods
5. Prevention strategies
6. Applicable government schemes

ANALYSIS FRAMEWORK:

**Step 1: Image Analysis**
- Identify the crop type (if not already known)
- Examine leaf color, texture, spots, patterns, veins
- Look for discoloration, wilting, necrosis, pustules, lesions
- Check for visible insects or pests
- Assess overall plant health

**Step 2: Diagnosis**
- Identify the disease/pest/deficiency
- Provide scientific name
- Assign confidence level (High/Medium/Low)
- List similar conditions to rule out

**Step 3: Severity Assessment**
- MILD: <10% of plant affected, early stage
- MODERATE: 10-50% affected, active spread
- SEVERE: >50% affected, urgent intervention needed

**Step 4: Organic Treatment (5-7 methods)**
For each method, provide:
- Name and composition
- Application rate (per liter of water)
- Spray frequency (days between applications)
- Safety period (days before harvest)
- How to prepare (if homemade)

Common organic treatments:
- Neem oil (3-5% concentration)
- Cow dung + urine paste
- Triphosphate powder
- Sulfur dust
- Copper sulfate
- Bordeaux mixture (1%)
- Pseudomonas fluorescens
- Trichoderma harzianum

**Step 5: Chemical Treatment (3-5 methods)**
For each method, provide:
- Trade name and active ingredient
- Concentration/dosage (per liter or hectare)
- Spray frequency
- Safety period before harvest
- Re-entry interval for workers
- Toxicity classification
- Compatibility with other pesticides

Common chemical options:
- Mancozeb + Carbendazim (fungal diseases)
- Chlorpyrifos (insect pests)
- Spinosad (organic chemical, safe)
- Profenofos (broad-spectrum)
- Imidacloprid (for sucking insects)
- Sulfur + Azoxystrobin (powdery mildew)

**Step 6: Prevention Strategies**
- Crop rotation recommendations
- Resistant varieties
- Spacing and pruning
- Irrigation practices
- Field sanitation
- Seed treatment methods
- Companion planting

**Step 7: Government Schemes & Resources**
Mention applicable schemes:
- **PM-KISAN**: Direct income support (₹6000/year)
- **PMFBY**: Crop insurance for covered crops
- **KCC**: Kissan Credit Card for agricultural loans
- **Soil Health Card**: Free soil testing
- **State-specific schemes**: Varies by state

OUTPUT FORMAT - MUST BE VALID JSON:

{
  "crop_type": "string (e.g., 'Mango', 'Paddy', 'Wheat')",
  "disease_name": "string (common name)",
  "scientific_name": "string",
  "confidence": "High|Medium|Low",
  "confidence_score": 0.95,
  "severity": "Mild|Moderate|Severe",
  "severity_percentage": 25,
  "description": "detailed description of the disease",
  "root_cause": "string explaining why this happened",
  
  "organic_treatments": [
    {
      "name": "string",
      "active_ingredient": "string",
      "dosage": "per liter or per hectare",
      "application_rate": "5ml per liter",
      "frequency_days": 7,
      "safety_period_days": 7,
      "how_to_prepare": "string",
      "effectiveness_percentage": 70,
      "cost_estimate": "₹ per hectare"
    }
  ],
  
  "chemical_treatments": [
    {
      "trade_name": "string",
      "active_ingredient": "string",
      "concentration": "string",
      "dosage": "per liter or per hectare",
      "frequency_days": 10,
      "safety_period_days": 14,
      "re_entry_hours": 24,
      "toxicity": "Low|Medium|High",
      "compatibility": "string",
      "effectiveness_percentage": 90,
      "cost_estimate": "₹ per hectare"
    }
  ],
  
  "prevention_strategies": [
    {
      "strategy": "string",
      "description": "string",
      "priority": "High|Medium|Low"
    }
  ],
  
  "government_schemes": [
    {
      "scheme_name": "string",
      "benefits": "string",
      "eligibility": "string",
      "application_link": "string"
    }
  ],
  
  "urgency": "Immediate action needed|Action within 3-5 days|Preventive measures",
  "next_steps": "string array with action plan",
  "estimated_loss_if_untreated": "string",
  "notes": "string with additional advice"
}

IMPORTANT GUIDELINES:
1. Always return valid JSON - never break format
2. Be specific with dosages and safety periods
3. Recommend organic first, then chemical as alternative
4. Consider environmental impact
5. Factor in local availability of products
6. Provide cost-benefit analysis
7. Include warnings about toxicity
8. If uncertain, mark confidence as "Medium" or "Low"
9. Never diagnose with <60% confidence
10. Suggest farmer consultation for severe cases

LANGUAGE:
Respond in English. If image context suggests local language preference, acknowledge it in the response.

END OF SYSTEM PROMPT
```

---

## FastAPI Backend Implementation

### `main.py` - Complete Backend

```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import json
import base64
import io
from PIL import Image
import requests
from typing import Optional
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="KisanLens Backend",
    description="Crop Disease Analysis with Gemma 4 12B",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "gemma:4-12b-q4_km")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "1000"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.3"))

# System Prompt
SYSTEM_PROMPT = """You are an expert agronomist and plant pathologist with 20+ years of experience in crop disease management.

TASK: Analyze the provided crop/plant image to identify diseases, pests, or nutritional deficiencies. Provide comprehensive organic and chemical treatment options.

ANALYSIS OUTPUT (VALID JSON ONLY):
{
  "crop_type": "string",
  "disease_name": "string",
  "scientific_name": "string",
  "confidence": "High|Medium|Low",
  "confidence_score": 0.95,
  "severity": "Mild|Moderate|Severe",
  "description": "string",
  "root_cause": "string",
  "organic_treatments": [
    {
      "name": "string",
      "dosage": "string",
      "frequency_days": 7,
      "safety_period_days": 7,
      "effectiveness_percentage": 70,
      "cost_estimate": "₹ per hectare"
    }
  ],
  "chemical_treatments": [
    {
      "trade_name": "string",
      "active_ingredient": "string",
      "dosage": "string",
      "frequency_days": 10,
      "safety_period_days": 14,
      "toxicity": "Low|Medium|High",
      "effectiveness_percentage": 90,
      "cost_estimate": "₹ per hectare"
    }
  ],
  "prevention_strategies": [
    {
      "strategy": "string",
      "description": "string",
      "priority": "High|Medium|Low"
    }
  ],
  "government_schemes": [
    {
      "scheme_name": "string",
      "benefits": "string",
      "eligibility": "string"
    }
  ],
  "urgency": "Immediate action needed|Action within 3-5 days|Preventive measures",
  "next_steps": ["array", "of", "actions"],
  "notes": "string"
}

IMPORTANT: Always return valid JSON only. No markdown, no extra text."""


def image_to_base64(image: Image.Image) -> str:
    """Convert PIL Image to base64 string"""
    buffered = io.BytesIO()
    image.save(buffered, format="JPEG", quality=85)
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return img_str


def validate_image(image: Image.Image) -> bool:
    """Validate image is suitable for analysis"""
    if image.size[0] < 50 or image.size[1] < 50:
        raise HTTPException(status_code=400, detail="Image too small (min 50x50)")
    if image.size[0] > 4000 or image.size[1] > 4000:
        image.thumbnail((2000, 2000))
    return True


async def call_ollama_with_vision(image_base64: str, prompt: str) -> dict:
    """Call Ollama API with vision capabilities"""
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "temperature": TEMPERATURE,
        "num_predict": MAX_TOKENS,
        "images": [image_base64],  # Pass base64 image
        "system": SYSTEM_PROMPT
    }
    
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json=payload,
            timeout=120
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Could not connect to Ollama server. Is it running on localhost:11434?"
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Model inference timeout")


def extract_json_from_response(response_text: str) -> dict:
    """Extract JSON from model response"""
    try:
        # Try direct JSON parsing
        return json.loads(response_text)
    except json.JSONDecodeError:
        # Try to find JSON block in response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            try:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=500,
                    detail="Could not parse model response as JSON"
                )
        raise HTTPException(
            status_code=500,
            detail="Model did not return valid JSON response"
        )


@app.get("/health")
async def health_check():
    """Check if backend and model are running"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        response.raise_for_status()
        models = response.json().get("models", [])
        model_available = any(m["name"].startswith(MODEL_NAME.split(":")[0]) for m in models)
        
        return {
            "status": "healthy" if model_available else "model_not_loaded",
            "ollama_url": OLLAMA_BASE_URL,
            "model": MODEL_NAME,
            "models_available": [m["name"] for m in models]
        }
    except:
        raise HTTPException(status_code=503, detail="Ollama server not responding")


@app.post("/analyze-crop")
async def analyze_crop(file: UploadFile = File(...)):
    """
    Analyze crop image for diseases and provide treatment recommendations
    
    Input: Image file (JPEG, PNG)
    Output: JSON with diagnosis, organic & chemical treatments, prevention, and schemes
    """
    
    try:
        # Read and validate image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        validate_image(image)
        
        # Convert to base64
        image_base64 = image_to_base64(image)
        
        # Prepare prompt
        prompt = """Please analyze this crop image and provide:
1. Crop type identification
2. Disease/pest/deficiency diagnosis with confidence
3. Severity assessment
4. 5-7 organic treatment options
5. 3-5 chemical treatment options
6. Prevention strategies
7. Applicable government schemes in India

Return ONLY valid JSON, no other text."""
        
        # Call Ollama
        ollama_response = await call_ollama_with_vision(image_base64, prompt)
        
        # Extract and parse response
        response_text = ollama_response.get("response", "")
        diagnosis = extract_json_from_response(response_text)
        
        # Add metadata
        diagnosis["analysis_timestamp"] = datetime.utcnow().isoformat()
        diagnosis["model_used"] = MODEL_NAME
        
        return JSONResponse(
            status_code=200,
            content=diagnosis
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-crop-with-context")
async def analyze_crop_with_context(
    file: UploadFile = File(...),
    crop_type: Optional[str] = None,
    region: Optional[str] = None,
    season: Optional[str] = None
):
    """
    Analyze crop with additional context for better diagnosis
    
    Parameters:
    - file: Crop image
    - crop_type: Crop name (e.g., 'Mango', 'Paddy', 'Wheat')
    - region: Geographic region (e.g., 'Punjab', 'Maharashtra')
    - season: Current season (e.g., 'Kharif', 'Rabi')
    """
    
    try:
        # Read and validate image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        validate_image(image)
        image_base64 = image_to_base64(image)
        
        # Build context-aware prompt
        context_info = ""
        if crop_type:
            context_info += f"Crop type: {crop_type}\n"
        if region:
            context_info += f"Region: {region}\n"
        if season:
            context_info += f"Season: {season}\n"
        
        prompt = f"""Analyze this crop image for disease diagnosis:
{context_info}

Provide:
1. Crop type confirmation (if provided)
2. Disease diagnosis with high confidence
3. Organic & chemical treatments suitable for {region or 'India'}
4. Prevention strategies for {season or 'current'} season
5. Relevant government schemes

Return ONLY valid JSON."""
        
        # Call Ollama
        ollama_response = await call_ollama_with_vision(image_base64, prompt)
        response_text = ollama_response.get("response", "")
        diagnosis = extract_json_from_response(response_text)
        
        # Add context
        diagnosis["analysis_timestamp"] = datetime.utcnow().isoformat()
        diagnosis["model_used"] = MODEL_NAME
        if crop_type:
            diagnosis["crop_type_provided"] = crop_type
        if region:
            diagnosis["region"] = region
        if season:
            diagnosis["season"] = season
        
        return JSONResponse(status_code=200, content=diagnosis)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/treatment-guide/{treatment_type}")
async def get_treatment_guide(treatment_type: str):
    """
    Get detailed treatment guide for organic or chemical methods
    
    Parameters:
    - treatment_type: 'organic' or 'chemical'
    """
    
    guides = {
        "organic": {
            "neem_oil": {
                "composition": "Azadirachtin (0.3-3%)",
                "application_rate": "3-5% solution (30-50 ml per liter)",
                "frequency": "Every 7-10 days",
                "safety_period": "7 days before harvest",
                "preparation": "Mix neem oil with water + mild soap as emulsifier",
                "effectiveness": "70-80% against soft-bodied insects and fungal diseases",
                "cost": "₹300-500 per liter",
                "crops": ["Mango", "Paddy", "Wheat", "Vegetables"]
            },
            "bordeaux_mixture": {
                "composition": "Copper sulfate + Calcium hydroxide",
                "application_rate": "1% solution (10ml copper sulfate + lime per liter)",
                "frequency": "Every 10-15 days",
                "safety_period": "14 days before harvest",
                "preparation": "Dissolve copper sulfate in hot water, add lime paste",
                "effectiveness": "85% against leaf spots, powdery mildew",
                "cost": "₹150-250 per kg",
                "crops": ["Mango", "Grape", "Apple"]
            },
            "sulfur_dust": {
                "composition": "Elemental sulfur (99%)",
                "application_rate": "5-10 kg per hectare",
                "frequency": "Every 7-10 days",
                "safety_period": "3 days",
                "preparation": "Mix with talc for even distribution",
                "effectiveness": "90% for powdery mildew, rust",
                "cost": "₹30-50 per kg",
                "crops": ["Grape", "Apple", "Chili"]
            }
        },
        "chemical": {
            "mancozeb": {
                "active_ingredient": "Mancozeb (75% WP)",
                "dosage": "2-2.5 g per liter (2-2.5 kg per hectare)",
                "frequency": "Every 10-14 days",
                "safety_period": "14 days before harvest",
                "re_entry": "24 hours",
                "toxicity": "Low",
                "compatibility": "Compatible with most insecticides",
                "effectiveness": "90% for early blight, late blight",
                "cost": "₹400-600 per kg",
                "crops": ["Potato", "Tomato", "Onion"]
            },
            "imidacloprid": {
                "active_ingredient": "Imidacloprid (17.8% SL)",
                "dosage": "0.5 ml per liter (500 ml per hectare)",
                "frequency": "Every 7-10 days",
                "safety_period": "21 days before harvest",
                "re_entry": "24 hours",
                "toxicity": "Medium",
                "effectiveness": "95% for aphids, whiteflies, thrips",
                "cost": "₹2000-2500 per liter",
                "crops": ["Cotton", "Vegetables", "Cereals"]
            }
        }
    }
    
    if treatment_type.lower() not in guides:
        raise HTTPException(status_code=400, detail="Invalid treatment type. Use 'organic' or 'chemical'")
    
    return {
        "treatment_type": treatment_type.lower(),
        "treatments": guides[treatment_type.lower()],
        "last_updated": "2024"
    }


@app.get("/schemes")
async def get_government_schemes():
    """Get information about government agriculture schemes"""
    
    schemes = {
        "PM-KISAN": {
            "name": "Pradhan Mantri Kisan Samman Nidhi",
            "benefit": "₹6000 per year in 3 installments",
            "eligibility": "All landholding farmers",
            "apply": "https://pmkisan.gov.in",
            "contact": "1800-11-5555"
        },
        "PMFBY": {
            "name": "Pradhan Mantri Fasal Bima Yojana",
            "benefit": "Crop insurance for yield losses",
            "eligibility": "All farmers with insurable crops",
            "apply": "https://pmfby.gov.in",
            "premium": "Varies by crop and state"
        },
        "KCC": {
            "name": "Kissan Credit Card",
            "benefit": "Agricultural loans at 4% interest",
            "eligibility": "Farmers with valid land records",
            "apply": "Nearest bank branch",
            "limit": "Up to ₹3 lakhs per hectare"
        },
        "Soil Health Card": {
            "name": "Soil Health Card Scheme",
            "benefit": "Free soil testing every 2 years",
            "eligibility": "All farmers",
            "apply": "District agriculture office",
            "benefits": "Personalized nutrient recommendations"
        }
    }
    
    return {
        "schemes": schemes,
        "note": "Scheme details may vary by state. Contact your local agriculture office for specific information."
    }


@app.get("/")
async def root():
    """API Documentation"""
    return {
        "name": "KisanLens Backend API",
        "version": "1.0.0",
        "description": "Crop Disease Analysis using Google Gemma 4 12B",
        "endpoints": {
            "GET /health": "Check backend health and model status",
            "POST /analyze-crop": "Analyze crop image (file upload)",
            "POST /analyze-crop-with-context": "Analyze with crop type, region, season",
            "GET /treatment-guide/{organic|chemical}": "Detailed treatment guides",
            "GET /schemes": "Government agriculture schemes"
        },
        "model": MODEL_NAME,
        "inference_engine": "Ollama"
    }


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
```

---

## Requirements File

**`requirements.txt`:**

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pillow==10.1.0
requests==2.31.0
python-dotenv==1.0.0
pydantic==2.5.0
```

---

## Testing & Deployment

### Test Locally

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Start FastAPI
python main.py

# Terminal 3: Test the API
curl -X GET http://localhost:8000/health

# Test with image
curl -X POST http://localhost:8000/analyze-crop \
  -F "file=@path/to/crop-image.jpg"

# With context
curl -X POST http://localhost:8000/analyze-crop-with-context \
  -F "file=@crop.jpg" \
  -F "crop_type=Mango" \
  -F "region=Maharashtra" \
  -F "season=Kharif"
```

### Docker Deployment

**`Dockerfile`:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**`docker-compose.yml`:**

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama-service
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
    volumes:
      - ollama-data:/root/.ollama
    command: ollama serve

  kisanlens-api:
    build: .
    container_name: kisanlens-api
    ports:
      - "8000:8000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - MODEL_NAME=gemma:4-12b-q4_km
      - TEMPERATURE=0.3
      - MAX_TOKENS=1000
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama-data:
```

**Deploy with Docker:**

```bash
# Start both services
docker-compose up -d

# Wait for model to load (~3-5 minutes first time)
docker-compose logs -f ollama

# Check API is running
curl http://localhost:8000/health
```

---

## Performance Optimization Tips

### For Faster Inference
1. **Use Q4_K_M quantization** (best speed/quality balance)
2. **Enable GPU acceleration** (see Ollama/llama.cpp docs)
3. **Reduce context size** if not needed
4. **Batch multiple requests** for throughput

### Memory Management
- Q4_K_M: ~8 GB RAM
- Q5_K_M: ~12 GB RAM
- Reduce batch size if running out of memory

### Production Checklist
- [ ] Use strong CORS restrictions (not `*`)
- [ ] Add rate limiting
- [ ] Implement request validation
- [ ] Add logging and monitoring
- [ ] Use environment variables for secrets
- [ ] Set up health checks
- [ ] Cache model in memory (avoid reload)
- [ ] Add request timeouts
- [ ] Monitor GPU/memory usage

---

## Troubleshooting

### "Connection refused" error
```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve &

# Verify port 11434 is listening
netstat -tuln | grep 11434
```

### Model not found
```bash
# Pull the model
ollama pull gemma:4-12b-q4_km

# List available models
ollama list
```

### Out of memory
- Use Q4_K_M instead of Q8_0
- Reduce context size
- Enable GPU acceleration
- Use smaller model (7B instead of 12B)

### Slow inference
- Enable GPU acceleration
- Check CPU usage (optimize prompt size)
- Use quantized version
- Reduce temperature (faster generation)

---

## Next Steps

1. ✅ Run backend locally with Ollama
2. ✅ Test with sample crop images
3. ✅ Integrate with React frontend (KisanLens UI)
4. ✅ Deploy to production (AWS/GCP/your server)
5. ✅ Add user authentication & database
6. ✅ Implement history & reporting features

---

**Created for KisanLens Buildathon**
**Model**: Google Gemma 4 12B Quantized
**Framework**: Ollama + FastAPI
**Inference**: CPU/GPU Compatible
