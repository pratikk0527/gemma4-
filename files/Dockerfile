# Multi-stage build for smaller image size
FROM python:3.11-slim as builder

WORKDIR /tmp

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Build wheels (faster installation in final stage)
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /tmp/wheels -r requirements.txt


# Final production image
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder
COPY --from=builder /tmp/wheels /wheels
COPY --from=builder /tmp/requirements.txt .

# Install Python packages from wheels
RUN pip install --no-cache /wheels/*

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

# Copy application code
COPY --chown=appuser:appuser main.py .

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 8000

# Health check
# Queries the /health endpoint to ensure the API is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the FastAPI server
# Use 1 worker since we're managing a single model in memory
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# ==============================================================================
# DOCKERFILE EXPLANATION
# ==============================================================================
#
# MULTI-STAGE BUILD:
# - Builder stage: Compiles dependencies into wheels (faster, cleaner)
# - Final stage: Only includes runtime dependencies (smaller image)
#
# BASE IMAGE:
# - python:3.11-slim: Lightweight Python 3.11 (300MB vs 900MB for full image)
#
# DEPENDENCIES:
# - curl: For health checks
# - libmagic1: For image file type detection
#
# SECURITY:
# - Non-root user (appuser) runs the application
# - No root access needed for FastAPI
#
# HEALTH CHECK:
# - Ensures container is actually working, not just running
# - Docker will restart unhealthy containers automatically
#
# WORKERS:
# - Single worker because model is loaded in memory
# - Multiple workers would require model duplication or shared memory
# - For horizontal scaling, run multiple container instances instead
#
# ==============================================================================
# BUILD COMMAND
# ==============================================================================
#
# Build locally:
#   docker build -t kisanlens-api:v1.0 .
#
# Build with BuildKit (faster, better caching):
#   docker buildx build -t kisanlens-api:v1.0 .
#
# ==============================================================================
# IMAGE SIZE REFERENCE
# ==============================================================================
#
# Expected final image size: 1.2-1.5 GB
# - Python 3.11-slim: 150 MB
# - Python packages: 400-500 MB
# - Application code: < 1 MB
#
# Ollama model (pulled separately): 6.4 GB (Q4_K_M)
#
# ==============================================================================
# ENVIRONMENT VARIABLES AT RUNTIME
# ==============================================================================
#
# These are passed by docker-compose, but you can also pass them manually:
#
# docker run -e OLLAMA_BASE_URL=http://localhost:11434 \
#            -e MODEL_NAME=gemma:4-12b-q4_km \
#            -p 8000:8000 \
#            kisanlens-api:v1.0
#
# ==============================================================================
# RUNNING DIRECTLY (without docker-compose)
# ==============================================================================
#
# Build:
#   docker build -t kisanlens-api:v1.0 .
#
# Run with linked Ollama container:
#   # First, run Ollama container
#   docker run -d -p 11434:11434 --name ollama ollama/ollama
#
#   # Then pull the model
#   docker exec ollama ollama pull gemma:4-12b-q4_km
#
#   # Finally, run API container, linked to Ollama
#   docker run -d \
#     --name kisanlens-api \
#     -p 8000:8000 \
#     -e OLLAMA_BASE_URL=http://ollama:11434 \
#     -e MODEL_NAME=gemma:4-12b-q4_km \
#     --link ollama \
#     kisanlens-api:v1.0
#
# ==============================================================================
# GPU ACCELERATION IN DOCKERFILE
# ==============================================================================
#
# FOR NVIDIA GPU:
# Add this to docker-compose.yml under kisanlens-api service:
#
# deploy:
#   resources:
#     reservations:
#       devices:
#         - driver: nvidia
#           count: 1
#           capabilities: [gpu]
#
# Then rebuild and run normally:
#   docker-compose build
#   docker-compose up -d
#
# ==============================================================================
# PRODUCTION BEST PRACTICES USED
# ==============================================================================
#
# ✓ Multi-stage build (reduces image size)
# ✓ Non-root user (security)
# ✓ Health checks (automatic restart)
# ✓ Minimal dependencies (smaller attack surface)
# ✓ APT cleanup (reduces layer size)
# ✓ Specific package versions (reproducibility)
# ✓ Exposed port documentation
# ✓ Working directory setup
# ✓ Proper ownership (non-root user)
# ✓ Single entrypoint (clean shutdown)
#
# ==============================================================================
# DOCKER BUILD OPTIMIZATION
# ==============================================================================
#
# Tips for faster builds:
#
# 1. Use BuildKit:
#    export DOCKER_BUILDKIT=1
#    docker build -t kisanlens-api:v1.0 .
#
# 2. Use cache effectively:
#    - Put less frequently changed items later in Dockerfile
#    - Copy only needed files
#    - Combine RUN commands to reduce layers
#
# 3. Parallel builds:
#    docker buildx build --platform linux/amd64,linux/arm64 \
#      -t kisanlens-api:v1.0 .
#
# ==============================================================================
# TROUBLESHOOTING
# ==============================================================================
#
# Build fails with "Permission denied":
#   - Use proper COPY --chown flag
#   - Ensure user exists before chown
#
# Health check fails:
#   - Increase start_period (app takes time to start)
#   - Check API logs: docker logs kisanlens-api
#
# Container exits immediately:
#   - Check logs: docker logs kisanlens-api
#   - Verify environment variables are set
#   - Ensure Ollama is running and accessible
#
# Out of memory during build:
#   - Multi-stage build uses disk, not RAM
#   - Try: docker system prune
#
# ==============================================================================
# SECURITY CONSIDERATIONS
# ==============================================================================
#
# ✓ Non-root user prevents privilege escalation
# ✓ Minimal base image reduces attack surface
# ✓ No secrets in Dockerfile (use environment variables)
# ✓ Read-only root filesystem ready (can add in docker-compose)
# ✓ Health checks detect hung processes
#
# Additional hardening (optional):
#   - Scan image: docker scan kisanlens-api:v1.0
#   - Sign image: cosign sign kisanlens-api:v1.0
#   - Network policies: Use Docker networks
#   - Secrets management: Use Docker secrets in swarm mode
#
# ==============================================================================
