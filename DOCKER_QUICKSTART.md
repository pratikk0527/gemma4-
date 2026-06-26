"""
KisanLens Docker Configuration
Ready-to-use Docker Compose setup for Ollama + FastAPI backend
"""

# ============================================================================
# docker-compose.yml
# ============================================================================

version: '3.8'

services:
  # Ollama Service: Model inference server
  ollama:
    image: ollama/ollama:latest
    container_name: kisanlens-ollama
    ports:
      - "11434:11434"  # Ollama API port
    environment:
      - OLLAMA_HOST=0.0.0.0:11434
      - OLLAMA_MODELS=/root/.ollama/models  # Model storage path
    volumes:
      - ollama-data:/root/.ollama  # Persistent model storage
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - kisanlens-network

  # FastAPI Backend Service
  kisanlens-api:
    build: .
    container_name: kisanlens-api
    ports:
      - "8000:8000"  # API port
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - MODEL_NAME=gemma:4-12b-q4_km
      - MAX_TOKENS=1200
      - TEMPERATURE=0.3
      - IMAGE_MAX_SIZE=4000
      - TIMEOUT_SECONDS=120
    depends_on:
      ollama:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - kisanlens-network
    volumes:
      - ./logs:/app/logs  # Optional: logging

volumes:
  ollama-data:
    driver: local

networks:
  kisanlens-network:
    driver: bridge


# ============================================================================
# Dockerfile
# ============================================================================

FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .
COPY system_prompt.py . 2>/dev/null || true
COPY config.py . 2>/dev/null || true

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]


# ============================================================================
# requirements.txt
# ============================================================================

fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pillow==10.1.0
requests==2.31.0
python-dotenv==1.0.0
pydantic==2.5.0
python-magic==0.4.27


# ============================================================================
# .env (Environment Configuration)
# ============================================================================

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
MODEL_NAME=gemma:4-12b-q4_km

# Model Parameters
MAX_TOKENS=1200
TEMPERATURE=0.3
IMAGE_MAX_SIZE=4000
TIMEOUT_SECONDS=120

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=1


# ============================================================================
# .gitignore
# ============================================================================

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
logs/
*.log

# Cache
analysis_cache/
*.cache

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# Data
*.jpg
*.jpeg
*.png
*.gif


# ============================================================================
# QUICK START GUIDE
# ============================================================================

QUICK START: KisanLens Backend with Docker
==========================================

## Prerequisites
- Docker and Docker Compose installed
- 16GB RAM (minimum 8GB for Q4 quantization)
- 20GB disk space for model
- GPU (optional but recommended)

## Option 1: Quick Start (Easiest) ⚡

1. Create project directory:
   mkdir kisanlens-backend
   cd kisanlens-backend

2. Copy files:
   - Copy main.py to directory
   - Copy requirements.txt to directory
   - Copy docker-compose.yml to directory
   - Copy Dockerfile to directory
   - Copy .env to directory (optional)

3. Start services:
   docker-compose up -d

4. Wait for Ollama to download model (3-10 minutes):
   docker-compose logs -f ollama

5. Test API:
   curl http://localhost:8000/health

6. Interactive docs:
   Open: http://localhost:8000/docs

7. Analyze a crop:
   curl -X POST http://localhost:8000/analyze-crop \
     -F "file=@path/to/crop.jpg"


## Option 2: Manual Setup (More Control)

### Step 1: Install Ollama
- Download: https://ollama.ai
- Or: curl -fsSL https://ollama.ai/install.sh | sh

### Step 2: Pull Model
ollama pull gemma:4-12b-q4_km

### Step 3: Start Ollama
ollama serve

### Step 4: In another terminal, setup FastAPI
pip install -r requirements.txt
python main.py

### Step 5: Test
curl http://localhost:8000/health


## Option 3: GPU Acceleration

### For NVIDIA GPU:
docker-compose up -d ollama-gpu
# In docker-compose.yml, add:
# runtime: nvidia
# environment:
#   - CUDA_VISIBLE_DEVICES=0

### For AMD GPU (ROCm):
# Download ollama/ollama:rocm
# Set: OLLAMA_HOST environment variable

### For Apple Silicon (MPS):
# Ollama automatically uses Metal Performance Shaders
# Just run normally, it will use GPU automatically


## Testing the API

### Test 1: Health Check
curl -X GET http://localhost:8000/health

Response:
{
  "status": "healthy",
  "model": "gemma:4-12b-q4_km",
  "available_models": [...]
}


### Test 2: Analyze Crop (Basic)
curl -X POST http://localhost:8000/analyze-crop \
  -F "file=@tomato_leaf_blight.jpg"

Response:
{
  "crop_type": "Tomato",
  "disease_name": "Late Blight",
  "confidence": "High",
  "organic_treatments": [...],
  "chemical_treatments": [...],
  "schemes": [...]
}


### Test 3: Contextual Analysis
curl -X POST http://localhost:8000/analyze-with-context \
  -F "file=@mango_leaf_spot.jpg" \
  -F "crop_type=Mango" \
  -F "region=Maharashtra" \
  -F "season=Kharif"

Response includes region-specific schemes and treatments


### Test 4: Get Treatment Guide
curl http://localhost:8000/treatment-guide/organic
curl http://localhost:8000/treatment-guide/chemical

Response: Detailed treatment information with dosages, costs, safety periods


### Test 5: Government Schemes
curl http://localhost:8000/schemes

Response: All available government agriculture schemes


## Docker Management

### View Logs
docker-compose logs -f              # All services
docker-compose logs -f ollama       # Just Ollama
docker-compose logs -f kisanlens-api # Just API

### Stop Services
docker-compose down

### Restart Services
docker-compose restart

### Remove Everything (including volumes)
docker-compose down -v

### Check Service Status
docker-compose ps

### Execute command in container
docker-compose exec kisanlens-api bash

### View resource usage
docker stats


## Performance Tuning

### Faster Inference
1. Use Q4_K_M quantization (already default)
2. Enable GPU acceleration
3. Increase number of GPU layers (-ngl parameter)
4. Reduce token limit if not needed

### Better Quality (slower)
1. Switch to Q5_K_M model:
   OLLAMA_MODEL=gemma:4-12b-q5_k_m

2. Or Q8_0 for near-original quality (requires 12GB+ RAM)

### Memory Optimization
1. Close other applications
2. Reduce other container resource limits
3. Use smaller model (7B instead of 12B)
4. Enable memory swapping (not recommended)

### System Optimization
1. Increase file descriptor limits:
   ulimit -n 65536

2. Optimize Docker memory:
   In Docker Desktop Settings → Resources:
   - Memory: 12-16 GB
   - Swap: 4 GB
   - CPUs: 4-8

3. Network optimization:
   - Use host network for better latency
   - Reduce batch size if processing many images


## Troubleshooting

### Issue: "Cannot connect to Ollama"
Solution:
1. Check if Ollama is running: docker-compose logs ollama
2. Wait for healthcheck to pass (30-60 seconds)
3. Verify port 11434: docker-compose port ollama

### Issue: "Model not found"
Solution:
1. Pull model manually:
   docker-compose exec ollama ollama pull gemma:4-12b-q4_km
2. Or wait for model to auto-download on first request

### Issue: "Out of memory"
Solution:
1. Use smaller quantization (Q4 instead of Q8)
2. Reduce IMAGE_MAX_SIZE environment variable
3. Close other applications
4. Increase Docker memory allocation
5. Enable GPU acceleration

### Issue: "Slow inference (>60 seconds)"
Solution:
1. Check GPU is being used (if available)
2. Reduce prompt complexity
3. Lower IMAGE_MAX_SIZE
4. Increase number of GPU layers
5. Restart Ollama service

### Issue: API returns 500 error
Solution:
1. Check API logs: docker-compose logs kisanlens-api
2. Check Ollama logs: docker-compose logs ollama
3. Test Ollama directly: curl http://localhost:11434/api/tags
4. Restart services: docker-compose restart

### Issue: "Disk space full"
Solution:
1. Check Ollama model directory:
   du -sh ~/.ollama/models/
2. Remove unused models:
   docker-compose exec ollama ollama rm old_model
3. Prune Docker:
   docker system prune


## Production Deployment

### Before going live:
1. [ ] Set strong CORS restrictions (not '*')
2. [ ] Add rate limiting middleware
3. [ ] Setup monitoring & logging
4. [ ] Configure SSL/TLS (HTTPS)
5. [ ] Add authentication (API keys)
6. [ ] Setup database for analysis history
7. [ ] Configure backups
8. [ ] Load test the system
9. [ ] Setup auto-scaling (if cloud)
10. [ ] Add health monitoring

### Example Production CORS:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

### Example Rate Limiting:
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/analyze-crop")
@limiter.limit("5/minute")
async def analyze_crop(...):
    pass

### Deploy to AWS/GCP/Azure:
1. Build and push Docker image:
   docker build -t kisanlens-api:v1.0 .
   docker tag kisanlens-api:v1.0 your-registry/kisanlens-api:v1.0
   docker push your-registry/kisanlens-api:v1.0

2. Use managed container services:
   - AWS ECS/EKS
   - Google Cloud Run/GKE
   - Azure Container Instances
   - DigitalOcean App Platform

3. Configure with proper resources:
   - 2+ CPU cores
   - 8+ GB memory
   - GPU recommended (optional)


## Monitoring & Logging

### Add Prometheus metrics:
pip install prometheus-client

from prometheus_client import Counter, Histogram

analysis_count = Counter('crop_analyses', 'Total analyses')
inference_duration = Histogram('inference_seconds', 'Inference time')

### Setup logging:
Create logs directory and monitor:
tail -f logs/kisanlens.log

### Health monitoring:
- Setup alert for health endpoint failures
- Monitor API response times
- Track analysis duration
- Monitor disk usage (model storage)
- Check Ollama memory usage


## Integration Examples

### Python Client:
import requests

response = requests.post(
    "http://localhost:8000/analyze-crop",
    files={"file": open("crop.jpg", "rb")}
)
diagnosis = response.json()

### JavaScript/Node.js:
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('crop.jpg'));

axios.post('http://localhost:8000/analyze-crop', form)
  .then(res => console.log(res.data));

### React Component:
const [diagnosis, setDiagnosis] = useState(null);

const analyzeCrop = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/analyze-crop', {
    method: 'POST',
    body: formData
  });
  
  setDiagnosis(await response.json());
};

### Flutter Mobile:
final multipartFile = await MultipartFile.fromFile(imagePath);
final formData = FormData.fromMap({
  'file': multipartFile,
});

final response = await dio.post('/analyze-crop', data: formData);


## Support & Resources

Ollama: https://ollama.ai
Google Gemma: https://ai.google.dev/gemma
FastAPI: https://fastapi.tiangolo.com
Docker: https://docs.docker.com


===== END OF GUIDE =====
