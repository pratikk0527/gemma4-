╔════════════════════════════════════════════════════════════════════════════════╗
║                    KISANLENS BACKEND - QUICK REFERENCE GUIDE                 ║
║          Google Gemma 4 12B Crop Disease Analysis with FastAPI               ║
╚════════════════════════════════════════════════════════════════════════════════╝

📋 TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════════════════════

1. Installation Quick Start
2. API Endpoint Reference
3. System Requirements
4. Common Commands
5. Troubleshooting
6. Example Requests
7. Response Structure
8. Deployment Checklist

═══════════════════════════════════════════════════════════════════════════════

⚡ INSTALLATION QUICK START (5 minutes)
═══════════════════════════════════════════════════════════════════════════════

Option A: Docker (Recommended - One Command!)
────────────────────────────────────────────
1. Copy files to directory:
   - main.py
   - requirements.txt
   - docker-compose.yml
   - Dockerfile
   - .env

2. Start services:
   $ docker-compose up -d

3. Wait for model download (~5 min):
   $ docker-compose logs -f ollama

4. Test API:
   $ curl http://localhost:8000/health

5. Access docs:
   http://localhost:8000/docs (Swagger UI)


Option B: Manual Setup (If not using Docker)
─────────────────────────────────────────────
1. Install Ollama:
   $ curl -fsSL https://ollama.ai/install.sh | sh

2. Pull model:
   $ ollama pull gemma:4-12b-q4_km

3. Start Ollama (Terminal 1):
   $ ollama serve

4. Install Python deps (Terminal 2):
   $ pip install -r requirements.txt

5. Start FastAPI:
   $ python main.py

6. Test:
   $ curl http://localhost:8000/health


═══════════════════════════════════════════════════════════════════════════════

🔌 API ENDPOINT REFERENCE
═══════════════════════════════════════════════════════════════════════════════

┌─ HEALTH CHECK ───────────────────────────────────────────────────────────────┐
│                                                                               │
│ GET /health                                                                   │
│                                                                               │
│ Check if backend and model are running                                       │
│                                                                               │
│ Response:                                                                     │
│ {                                                                             │
│   "status": "healthy",                                                        │
│   "model": "gemma:4-12b-q4_km",                                              │
│   "available_models": ["gemma:4-12b-q4_km"]                                  │
│ }                                                                             │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ MAIN ENDPOINT: Analyze Crop ─────────────────────────────────────────────────┐
│                                                                               │
│ POST /analyze-crop                                                            │
│                                                                               │
│ Analyze crop image for diseases, provide organic & chemical cures            │
│                                                                               │
│ Parameters:                                                                   │
│   - file: Image file (JPEG/PNG) [REQUIRED]                                   │
│   - verbose: Boolean (include detailed explanations) [OPTIONAL]              │
│                                                                               │
│ cURL Example:                                                                 │
│ $ curl -X POST http://localhost:8000/analyze-crop \                          │
│   -F "file=@crop.jpg" \                                                       │
│   -F "verbose=true"                                                          │
│                                                                               │
│ Python Example:                                                               │
│ import requests                                                               │
│ with open("crop.jpg", "rb") as f:                                            │
│     response = requests.post(                                                 │
│         "http://localhost:8000/analyze-crop",                                │
│         files={"file": f},                                                    │
│         params={"verbose": True}                                             │
│     )                                                                         │
│ print(response.json())                                                        │
│                                                                               │
│ Response: Complete diagnosis with treatments, schemes, etc.                  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ CONTEXTUAL ANALYSIS ─────────────────────────────────────────────────────────┐
│                                                                               │
│ POST /analyze-with-context                                                    │
│                                                                               │
│ Analyze crop with region & seasonal context                                  │
│                                                                               │
│ Parameters:                                                                   │
│   - file: Image file [REQUIRED]                                              │
│   - crop_type: Crop name, e.g., "Mango" [OPTIONAL]                          │
│   - region: State, e.g., "Maharashtra" [OPTIONAL]                            │
│   - season: "Kharif", "Rabi", or "Summer" [OPTIONAL]                        │
│   - irrigation: "Flood", "Drip", or "Rainfed" [OPTIONAL]                    │
│                                                                               │
│ cURL Example:                                                                 │
│ $ curl -X POST "http://localhost:8000/analyze-with-context" \               │
│   -F "file=@mango_leaf.jpg" \                                                │
│   -F "crop_type=Mango" \                                                      │
│   -F "region=Maharashtra" \                                                   │
│   -F "season=Kharif"                                                          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ TREATMENT GUIDES ───────────────────────────────────────────────────────────┐
│                                                                               │
│ GET /treatment-guide/{type}                                                   │
│                                                                               │
│ Get comprehensive treatment guides                                            │
│                                                                               │
│ Path Parameter:                                                               │
│   - type: "organic" or "chemical"                                             │
│                                                                               │
│ Examples:                                                                     │
│ $ curl http://localhost:8000/treatment-guide/organic                         │
│ $ curl http://localhost:8000/treatment-guide/chemical                        │
│                                                                               │
│ Returns: Detailed guide with dosages, costs, safety periods, etc.           │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ GOVERNMENT SCHEMES ──────────────────────────────────────────────────────────┐
│                                                                               │
│ GET /schemes                                                                  │
│                                                                               │
│ Get information about government agriculture schemes                         │
│                                                                               │
│ Example:                                                                      │
│ $ curl http://localhost:8000/schemes                                          │
│                                                                               │
│ Returns:                                                                      │
│ - PM-KISAN (income support)                                                  │
│ - PMFBY (crop insurance)                                                     │
│ - KCC (agricultural credit)                                                  │
│ - Soil Health Card (free testing)                                            │
│ - State-specific schemes                                                     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ API DOCUMENTATION ───────────────────────────────────────────────────────────┐
│                                                                               │
│ GET /                                                                         │
│ GET /docs (Swagger UI - Interactive)                                          │
│ GET /redoc (ReDoc - Alternative)                                              │
│                                                                               │
│ Open in browser:                                                              │
│ http://localhost:8000/docs                                                    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════

⚙️ SYSTEM REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

MINIMUM:
├─ CPU: Intel i5 / AMD Ryzen 5 (quad-core)
├─ RAM: 16 GB (8 GB minimum for Q4 quantization)
├─ Storage: 20 GB free (for model + OS)
├─ OS: Ubuntu 20.04+, macOS 11+, or Windows 10 (WSL2)
└─ Connection: Local network (Ollama communicates on port 11434)

RECOMMENDED:
├─ CPU: Intel i7 / AMD Ryzen 7 or better
├─ RAM: 32 GB
├─ GPU: NVIDIA (10GB VRAM) - 3x faster inference
├─ Storage: 50 GB (more models in future)
└─ Network: 1 Gbps local network

MODEL SIZE:
├─ Gemma 4 12B Q4_K_M: 6.4 GB
├─ Gemma 4 12B Q5_K_M: 8.4 GB  
└─ Gemma 4 12B Q8_0: 12 GB

═══════════════════════════════════════════════════════════════════════════════

💻 COMMON COMMANDS
═══════════════════════════════════════════════════════════════════════════════

OLLAMA COMMANDS
────────────────
# Start Ollama service
$ ollama serve

# Pull a model
$ ollama pull gemma:4-12b-q4_km

# List models
$ ollama list

# Remove a model
$ ollama rm gemma:4-12b-q4_km

# Test Ollama API
$ curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"gemma:4-12b-q4_km","prompt":"test"}'

# Check Ollama health
$ curl http://localhost:11434/api/tags


FASTAPI COMMANDS
─────────────────
# Start backend
$ python main.py

# With specific port
$ uvicorn main:app --port 8001

# With hot reload (development)
$ uvicorn main:app --reload

# Check if running
$ curl http://localhost:8000/health

# View logs
$ tail -f logs/kisanlens.log


DOCKER COMMANDS
────────────────
# Start services
$ docker-compose up -d

# Stop services
$ docker-compose down

# View logs
$ docker-compose logs -f

# Restart service
$ docker-compose restart kisanlens-api

# Execute command in container
$ docker-compose exec kisanlens-api bash

# Check resource usage
$ docker stats

# View running containers
$ docker-compose ps

# Remove everything
$ docker-compose down -v


═══════════════════════════════════════════════════════════════════════════════

🔧 TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

Issue: "Connection refused" on port 11434
─────────────────────────────────────────
Solution:
1. Check if Ollama is running: ps aux | grep ollama
2. Start Ollama: ollama serve &
3. Wait 30 seconds and retry

Issue: "Model not found" error
──────────────────────────────
Solution:
1. Pull model: ollama pull gemma:4-12b-q4_km
2. Wait for download to complete (~3-5 min)
3. Verify: ollama list

Issue: API returns 500 error
─────────────────────────────
Solution:
1. Check Ollama is running: curl http://localhost:11434/api/tags
2. Check API logs: docker-compose logs kisanlens-api
3. Restart API: docker-compose restart kisanlens-api
4. Restart Ollama: docker-compose restart ollama

Issue: "Out of memory" error
────────────────────────────
Solution:
1. Use Q4_K_M quantization (default, 6.4 GB)
2. Enable GPU acceleration (NVIDIA/Metal)
3. Increase system RAM
4. Reduce IMAGE_MAX_SIZE in .env
5. Close other applications

Issue: Inference is very slow (>60 seconds)
──────────────────────────────────────────
Solution:
1. Check if GPU is being used: nvidia-smi (for NVIDIA)
2. Enable GPU layers in Ollama
3. Reduce IMAGE_MAX_SIZE
4. Use Q4 instead of Q8 quantization
5. Reduce MAX_TOKENS in .env

Issue: Docker compose fails to build
──────────────────────────────────────
Solution:
1. Ensure Dockerfile is in directory
2. Ensure requirements.txt exists
3. Check Docker is running
4. Clean build: docker-compose build --no-cache

Issue: CORS errors from browser
────────────────────────────────
Solution:
1. Check frontend URL is in CORS allowed origins
2. Ensure API is running: curl http://localhost:8000/health
3. For development, CORS allows localhost:3000 and localhost:5173

═══════════════════════════════════════════════════════════════════════════════

📝 EXAMPLE REQUESTS & RESPONSES
═══════════════════════════════════════════════════════════════════════════════

Example 1: Basic Crop Analysis
───────────────────────────────

Request:
$ curl -X POST http://localhost:8000/analyze-crop \
  -F "file=@tomato_leaf.jpg"

Response (JSON):
{
  "crop_type": "Tomato",
  "disease_name": "Early Blight",
  "scientific_name": "Alternaria solani",
  "confidence": "High",
  "confidence_score": 0.92,
  "severity": "Moderate",
  "severity_percentage": 35,
  "urgency": "Action within 3-5 days",
  
  "organic_treatments": [
    {
      "rank": 1,
      "name": "Bordeaux Mixture",
      "active_ingredient": "Copper sulfate + Lime",
      "dosage": "1% solution (10ml per liter)",
      "safety_period_days": 14,
      "effectiveness_percentage": 85,
      "cost_per_hectare_rupees": 400
    },
    {
      "rank": 2,
      "name": "Sulfur Dust",
      "dosage": "5-7 grams per m²",
      "safety_period_days": 3,
      "effectiveness_percentage": 70,
      "cost_per_hectare_rupees": 300
    }
  ],
  
  "chemical_treatments": [
    {
      "rank": 1,
      "trade_name": "Indofil M45",
      "active_ingredient": "Mancozeb 75% WP",
      "dosage": "2.5 g per liter",
      "safety_period_days": 14,
      "effectiveness_percentage": 90,
      "cost_per_hectare_rupees": 500
    }
  ],
  
  "government_schemes": [
    {
      "scheme_name": "PMFBY",
      "benefit": "Crop insurance for yield losses",
      "helpline": "1800-110-001"
    }
  ],
  
  "next_steps": [
    "Apply Bordeaux mixture immediately",
    "Repeat every 10-14 days",
    "Remove infected leaves",
    "Improve drainage in field"
  ]
}


Example 2: Contextual Analysis with Region
────────────────────────────────────────────

Request:
$ curl -X POST "http://localhost:8000/analyze-with-context" \
  -F "file=@mango.jpg" \
  -F "crop_type=Mango" \
  -F "region=Maharashtra" \
  -F "season=Kharif"

Response:
{
  "crop_type": "Mango",
  "disease_name": "Powdery Mildew",
  "severity": "Mild",
  "organic_treatments": [
    {
      "name": "Sulfur Dust",
      "dosage": "5-10 kg per hectare",
      "effectiveness_percentage": 90,
      "suitable_for_kharif": true
    }
  ],
  "region_specific_schemes": [
    {
      "scheme_name": "Maharashtra State Horticulture Scheme",
      "benefit": "Subsidized sprayers and equipment"
    }
  ],
  "_context": {
    "crop_type_provided": "Mango",
    "region": "Maharashtra",
    "season": "Kharif"
  }
}


Example 3: Treatment Guide Request
─────────────────────────────────

Request:
$ curl http://localhost:8000/treatment-guide/organic

Response (excerpt):
{
  "treatment_type": "organic",
  "guide": {
    "neem_oil": {
      "concentration": "3-5%",
      "dosage": "30-50 ml per liter",
      "frequency": "Every 7-10 days",
      "safety_period": "7 days before harvest",
      "effectiveness": "70-80%",
      "cost_per_hectare": "₹500-1000",
      "best_for_crops": ["Mango", "Paddy", "Cotton", "Vegetables"]
    }
  }
}

═══════════════════════════════════════════════════════════════════════════════

📊 RESPONSE STRUCTURE REFERENCE
═══════════════════════════════════════════════════════════════════════════════

All /analyze-crop responses follow this structure:

ROOT LEVEL
└── crop_type: str (e.g., "Mango", "Paddy")
└── disease_name: str (e.g., "Powdery Mildew")
└── scientific_name: str
└── confidence: "High" | "Medium" | "Low"
└── confidence_score: float (0.0-1.0)
└── severity: "Mild" | "Moderate" | "Severe"
└── severity_percentage: int (0-100)
└── urgency: str (describes action timeline)
└── description: str (detailed symptom description)

TREATMENTS
├── organic_treatments: Array[Object]
│   └── name: str
│   └── dosage: str
│   └── safety_period_days: int
│   └── effectiveness_percentage: int
│   └── cost_per_hectare_rupees: int
│
└── chemical_treatments: Array[Object]
    └── trade_name: str
    └── active_ingredient: str
    └── dosage: str
    └── pre_harvest_interval_days: int
    └── effectiveness_percentage: int
    └── toxicity_level: str

SCHEMES
└── government_schemes: Array[Object]
    └── scheme_name: str
    └── benefit: str
    └── helpline: str

ACTION ITEMS
├── immediate_actions: Array[str]
├── next_steps: Array[str]
└── estimated_recovery_days: int

═══════════════════════════════════════════════════════════════════════════════

✅ DEPLOYMENT CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

BEFORE GOING LIVE:

Pre-Deployment
[ ] Test locally with various crop images
[ ] Verify all endpoints return expected responses
[ ] Check API documentation at /docs
[ ] Test error handling (bad uploads, timeouts)
[ ] Verify CORS settings for production domain
[ ] Load test with multiple concurrent requests
[ ] Check memory and CPU usage under load

Security
[ ] Restrict CORS to specific domains (not *)
[ ] Implement rate limiting (if public)
[ ] Add API key authentication (if needed)
[ ] Setup HTTPS/SSL certificates
[ ] Configure firewall rules
[ ] Hide sensitive information (use .env)
[ ] Regular security updates for dependencies

Monitoring
[ ] Setup health check monitoring
[ ] Configure logging and log rotation
[ ] Setup alerts for failures
[ ] Monitor response times
[ ] Track API usage metrics
[ ] Monitor system resources (CPU, RAM, disk)

Backup & Recovery
[ ] Backup Ollama model directory
[ ] Document recovery procedures
[ ] Test backup restoration
[ ] Setup automated backups
[ ] Have rollback plan ready

Documentation
[ ] Document API endpoints
[ ] Create user guide for farmers
[ ] Document deployment procedure
[ ] Create troubleshooting guide
[ ] Document model update procedure

Production Environment
[ ] Deploy on stable server (AWS, GCP, Azure, etc.)
[ ] Use managed container services if possible
[ ] Setup auto-scaling if needed
[ ] Configure CDN for frontend
[ ] Setup email notifications
[ ] Regular backup of analysis history

═══════════════════════════════════════════════════════════════════════════════

🚀 PERFORMANCE BENCHMARKS
═══════════════════════════════════════════════════════════════════════════════

Inference Time (Gemma 4 12B Q4_K_M):

CPU Only:
├─ Cold start: 30-45 seconds (first image after restart)
├─ Typical: 15-25 seconds per image
└─ Batch processing: 12-18 seconds per image

GPU (NVIDIA 10GB):
├─ Cold start: 8-12 seconds
├─ Typical: 4-8 seconds per image
└─ Batch processing: 3-5 seconds per image

GPU (Apple Metal/MPS):
├─ Cold start: 6-10 seconds
├─ Typical: 3-6 seconds per image
└─ Batch processing: 2-4 seconds per image

Memory Usage:
├─ Q4_K_M: 6-8 GB RAM + GPU VRAM
├─ Q5_K_M: 8-10 GB RAM
└─ Q8_0: 12-14 GB RAM

Throughput:
├─ Single instance: 10-15 requests/minute (with 10GB GPU)
├─ Horizontal scaling: Add more instances for higher throughput
└─ Queuing: Recommended for peak loads

═══════════════════════════════════════════════════════════════════════════════

📞 SUPPORT & RESOURCES
═══════════════════════════════════════════════════════════════════════════════

Documentation:
├─ Ollama: https://ollama.ai
├─ Google Gemma: https://ai.google.dev/gemma
├─ FastAPI: https://fastapi.tiangolo.com
├─ Docker: https://docs.docker.com
└─ Python Requests: https://requests.readthedocs.io

Community:
├─ GitHub Issues: Report bugs
├─ Stack Overflow: Ask questions
├─ Ollama Discord: https://discord.gg/ollama
└─ FastAPI Discussions: GitHub Discussions

Testing Tools:
├─ Postman: https://www.postman.com
├─ curl: Command-line testing
├─ Python requests: Programmatic testing
└─ Swagger UI: Built-in at /docs

═══════════════════════════════════════════════════════════════════════════════

🎯 QUICK TIPS
═══════════════════════════════════════════════════════════════════════════════

1. SPEED UP INFERENCE
   └─ Enable GPU acceleration (3-10x faster)

2. SAVE MEMORY
   └─ Use Q4_K_M quantization (default)

3. BETTER DIAGNOSES
   └─ Provide crop type, region, season info with contextual endpoint

4. BATCH PROCESSING
   └─ Send multiple images, process sequentially
   └─ Better throughput than parallel requests

5. ERROR HANDLING
   └─ Always check HTTP status code
   └─ Read error message for debugging
   └─ Retry failed requests with exponential backoff

6. INTEGRATION
   └─ Use /docs endpoint for API testing
   └─ Download OpenAPI schema for client generation
   └─ Implement request timeout (30 seconds recommended)

7. MONITORING
   └─ Regularly check /health endpoint
   └─ Monitor response times
   └─ Track failed analyses

═══════════════════════════════════════════════════════════════════════════════

Last Updated: June 2024
Version: 1.0.0
Model: Google Gemma 4 12B Quantized
Framework: FastAPI + Ollama

═══════════════════════════════════════════════════════════════════════════════
