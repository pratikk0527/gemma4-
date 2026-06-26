# 🌾 KisanLens Backend Setup - Complete Package

## Project Overview

**KisanLens** is an AI-powered crop disease analysis and treatment recommendation system for Indian farmers using Google Gemma 4 12B quantized model running locally with Ollama and FastAPI.

### Key Features
- ✅ Local inference (no cloud dependency, 100% private)
- ✅ Multimodal (image + text understanding)
- ✅ Bilingual support (English + local languages)
- ✅ Organic + Chemical treatment recommendations
- ✅ Government scheme integration
- ✅ Farmer-friendly guidance
- ✅ Cost-effective and open-source

### Tech Stack
- **Model**: Google Gemma 4 12B (Quantized Q4_K_M, 6.4 GB)
- **Inference Engine**: Ollama
- **Backend**: FastAPI + Python 3.11
- **Deployment**: Docker & Docker Compose
- **Database**: Optional (for history storage)

---

## 📦 Files Included in This Package

### Core Backend Files

1. **`main.py`** (⭐ MAIN FILE)
   - Complete FastAPI application
   - All API endpoints
   - Image handling and validation
   - Ollama integration
   - Health checks and error handling
   - Production-ready code
   - **Size**: ~600 lines, fully documented
   - **Use**: `python main.py` or `docker-compose up`

2. **`SYSTEM_PROMPT.py`**
   - Complete system prompt for Gemma 4 12B
   - Detailed instructions for crop analysis
   - JSON output format specification
   - Treatment recommendation framework
   - ~800 lines of prompt engineering
   - **Use**: Reference for understanding model behavior

3. **`requirements.txt`**
   - Python package dependencies
   - All FastAPI, Ollama, and image processing libraries
   - Optional development and monitoring tools
   - **Use**: `pip install -r requirements.txt`

### Configuration & Setup Files

4. **`docker-compose.yml`**
   - Complete Docker Compose setup
   - Ollama service configuration
   - FastAPI service configuration
   - Health checks
   - Persistent model storage
   - Network configuration
   - **Use**: `docker-compose up -d`

5. **`Dockerfile`**
   - FastAPI container image
   - Python 3.11-slim base
   - Non-root user security
   - Health check configuration
   - **Use**: Automatically used by docker-compose

6. **`.env`** (Example)
   - Environment variables
   - Ollama configuration
   - Model parameters
   - Server settings
   - **Use**: Copy and customize for your setup

### Documentation Files

7. **`KisanLens-Backend-Setup-Guide.md`** (📖 MAIN GUIDE)
   - Comprehensive 80+ page setup guide
   - Step-by-step installation instructions
   - Multiple setup options (Ollama, llama.cpp, Hugging Face)
   - Complete system prompt explanation
   - FastAPI implementation details
   - Docker deployment guide
   - Troubleshooting section
   - Production checklist
   - **Read This First**: Start here for understanding

8. **`DOCKER_QUICKSTART.md`**
   - Quick Docker setup guide
   - docker-compose.yml fully explained
   - Dockerfile explained
   - Common Docker commands
   - Docker troubleshooting
   - Production deployment tips
   - Monitoring and logging setup
   - Integration examples (Python, JS, React, Flutter)

9. **`QUICK_REFERENCE.md`** (🚀 HANDY GUIDE)
   - Quick lookup guide (1-2 pages each section)
   - API endpoint checklists
   - Common commands
   - Troubleshooting quick fixes
   - Example requests/responses
   - Performance benchmarks
   - Deployment checklist
   - **Use**: Quick lookup during development

### Optional Files

10. **`.gitignore`**
    - Git ignore patterns
    - Python, IDE, OS specific
    - Model and log directories

---

## 🚀 Quick Start (Choose One)

### Option A: Docker (Recommended - Easiest)
```bash
# 1. Copy all files to a directory
cd kisanlens-backend

# 2. Start services (pulls ~6.4 GB model on first run)
docker-compose up -d

# 3. Wait for Ollama to load (~5 minutes first time)
docker-compose logs -f ollama

# 4. Test API
curl http://localhost:8000/health

# 5. Open API docs
# Go to: http://localhost:8000/docs
```

### Option B: Manual Setup
```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull model (in one terminal)
ollama pull gemma:4-12b-q4_km
ollama serve

# 3. Setup backend (in another terminal)
pip install -r requirements.txt
python main.py

# 4. Test
curl http://localhost:8000/health
```

---

## 📊 API Endpoints Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check system status |
| `/analyze-crop` | POST | **Main**: Analyze crop image |
| `/analyze-with-context` | POST | Analyze with crop type/region/season |
| `/treatment-guide/organic` | GET | Organic treatment reference |
| `/treatment-guide/chemical` | GET | Chemical treatment reference |
| `/schemes` | GET | Government agriculture schemes |
| `/docs` | GET | Interactive API documentation (Swagger) |
| `/redoc` | GET | Alternative API docs |

---

## 🔧 System Requirements

### Minimum
- 16 GB RAM
- 20 GB disk space
- Intel i5 / AMD Ryzen 5 (quad-core)
- Ubuntu 20.04+, macOS 11+, or Windows 10 (WSL2)

### Recommended
- 32 GB RAM
- NVIDIA GPU with 10GB VRAM (3x faster)
- Intel i7 / AMD Ryzen 7
- 50 GB disk space

### Model Size
- **Q4_K_M** (default): 6.4 GB ← Best balance
- **Q5_K_M**: 8.4 GB ← Better quality
- **Q8_0**: 12 GB ← Near-original quality

---

## 📖 How to Use These Files

### For Learning (First Time)
1. Read: `KisanLens-Backend-Setup-Guide.md` (pages 1-20)
2. Read: System prompt section (pages 25-40)
3. Run: Option A (Docker) or Option B (Manual)
4. Test: Use `/docs` endpoint for interactive testing

### For Quick Lookup
1. Check: `QUICK_REFERENCE.md`
2. Find: Your issue/question
3. Copy: Example code/command
4. Adjust: For your setup

### For Troubleshooting
1. Search: `QUICK_REFERENCE.md` → "Troubleshooting"
2. Or: `KisanLens-Backend-Setup-Guide.md` → "Troubleshooting"
3. Run: Suggested command
4. If still stuck: Check logs with `docker-compose logs`

### For Deployment
1. Read: `DOCKER_QUICKSTART.md` → "Production Deployment"
2. Follow: Deployment checklist
3. Review: Security section
4. Test: Load test your setup

---

## 🎯 Integration Examples

### Python Client
```python
import requests

with open("crop.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/analyze-crop",
        files={"file": f}
    )
    diagnosis = response.json()
    print(diagnosis)
```

### JavaScript/React
```javascript
const formData = new FormData();
formData.append('file', cropImage);

const response = await fetch('/api/analyze-crop', {
    method: 'POST',
    body: formData
});
const diagnosis = await response.json();
```

### Flutter Mobile
```dart
var request = http.MultipartRequest('POST',
    Uri.parse('http://api.server/analyze-crop'));
request.files.add(await http.MultipartFile.fromPath(
    'file', imagePath));
var response = await request.send();
```

---

## 🔒 Security Checklist

- [ ] Change CORS from "*" to your domain
- [ ] Add rate limiting for public APIs
- [ ] Implement API key authentication
- [ ] Setup HTTPS/SSL
- [ ] Don't expose .env file
- [ ] Regular dependency updates
- [ ] Monitor API usage
- [ ] Backup model directory

---

## 📈 Performance Tips

### Faster Inference
1. Enable GPU acceleration (3-10x faster)
2. Use Q4_K_M quantization (default)
3. Reduce IMAGE_MAX_SIZE if not needed

### Better Results
1. Provide crop type with contextual endpoint
2. Ensure clear, well-lit crop images
3. Include region/season for better schemes

### Higher Throughput
1. Horizontal scaling (multiple instances)
2. Load balancing
3. Request queuing for peak loads

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Connection refused" | Start Ollama: `ollama serve` |
| "Model not found" | Pull it: `ollama pull gemma:4-12b-q4_km` |
| "Out of memory" | Use Q4_K_M, enable GPU, close apps |
| "Slow inference" | Enable GPU, reduce image size |
| API returns 500 | Check logs: `docker-compose logs` |

---

## 📞 Getting Help

### Self-Help Resources
1. **QUICK_REFERENCE.md** - Fastest lookup
2. **KisanLens-Backend-Setup-Guide.md** - Detailed guide
3. **DOCKER_QUICKSTART.md** - Docker specific
4. **main.py comments** - Code documentation

### Online Resources
- Ollama: https://ollama.ai
- FastAPI: https://fastapi.tiangolo.com
- Google Gemma: https://ai.google.dev/gemma
- Docker: https://docs.docker.com

### Testing Tools
- Swagger UI: http://localhost:8000/docs
- Postman: Import OpenAPI schema
- cURL: For command-line testing

---

## 🎓 Learning Path

### Week 1: Setup & Basics
- [ ] Read setup guide (pages 1-20)
- [ ] Run Docker version
- [ ] Test all API endpoints
- [ ] Understand system prompt

### Week 2: Customization
- [ ] Modify system prompt
- [ ] Add more crops/diseases
- [ ] Test with local images
- [ ] Integrate with frontend

### Week 3: Deployment
- [ ] Setup production server
- [ ] Configure security
- [ ] Setup monitoring
- [ ] Test load handling

### Week 4: Optimization
- [ ] Enable GPU acceleration
- [ ] Add caching
- [ ] Optimize prompts
- [ ] Fine-tune model (optional)

---

## 📋 File-by-File Checklist

Before starting, ensure you have:

- [ ] `main.py` - FastAPI application
- [ ] `requirements.txt` - Python dependencies
- [ ] `docker-compose.yml` - Docker configuration
- [ ] `Dockerfile` - Container image
- [ ] `.env` - Environment variables (copy and customize)
- [ ] `SYSTEM_PROMPT.py` - Model system prompt
- [ ] All documentation files (.md)

---

## 🚀 Next Steps After Setup

1. **Test the API**: Visit http://localhost:8000/docs
2. **Integrate Frontend**: Connect your React/Flutter app
3. **Add Database**: Store analysis history
4. **Setup Monitoring**: Monitor API usage
5. **Deploy**: Put on production server
6. **Iterate**: Get feedback, improve prompts

---

## 💡 Pro Tips

1. **Use contextual analysis** for better results: 
   ```bash
   /analyze-with-context?crop_type=Mango&region=Maharashtra
   ```

2. **Cache images** to avoid re-analysis

3. **Batch process** similar crops for efficiency

4. **Monitor health** regularly:
   ```bash
   watch -n 30 'curl http://localhost:8000/health'
   ```

5. **Log all requests** for debugging and improvement

---

## 📅 Maintenance Schedule

- **Daily**: Monitor health checks
- **Weekly**: Review API usage and errors
- **Monthly**: Update dependencies
- **Quarterly**: Fine-tune system prompt
- **Yearly**: Major version updates

---

## 🎯 Success Metrics

Track these to measure success:

- **API Response Time**: Target < 15 seconds
- **Model Accuracy**: Test with known diseases
- **User Satisfaction**: Collect farmer feedback
- **Uptime**: Target 99.5%
- **API Throughput**: Requests/minute capacity
- **Cost Efficiency**: ₹ per analysis

---

## 📞 Support Channels

- GitHub Issues: Report bugs
- Stack Overflow: Ask questions (tag: fastapi, ollama)
- Email: Contact development team
- Community: Join Ollama Discord

---

## 📜 License & Attribution

This implementation uses:
- **Google Gemma 4**: Google's open-source model
- **Ollama**: Local model serving
- **FastAPI**: Modern Python web framework

All code is provided as-is for educational and agricultural support purposes.

---

## 🎉 Ready to Start?

1. **Copy all files to a directory**
2. **Follow Quick Start (Option A or B)**
3. **Test with `/docs` endpoint**
4. **Read documentation as needed**
5. **Integrate with your frontend**
6. **Deploy to production**

**Good luck with KisanLens! Happy farming! 🌾**

---

**Version**: 1.0.0  
**Last Updated**: June 2024  
**Model**: Google Gemma 4 12B Quantized  
**Framework**: FastAPI + Ollama  
**Deployment**: Docker & Docker Compose

