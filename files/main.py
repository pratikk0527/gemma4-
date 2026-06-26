"""
KisanLens Backend API  v4.0  —  True Concurrent Processing
Crop Disease Analysis — Google Gemma 4 e4b via LM Studio

ROOT CAUSE FIX (v3 → v4):
  v3 used asyncio.Queue + a single background worker, which serialised ALL
  requests BEFORE they even reached LM Studio.  This meant Device 2 waited
  for Device 1 to FULLY finish — even though LM Studio can accept multiple
  connections and queue them internally.

v4 Architecture:
  • NO application-level queue.
  • Each POST /analyze-crop runs its own async coroutine concurrently.
  • FastAPI (single uvicorn event-loop) handles all connections in parallel.
  • httpx async sends each request to LM Studio independently.
  • LM Studio manages its own GPU queue — each caller gets its own response
    as soon as the GPU finishes their inference, not everyone else's.
  • A soft Semaphore(MAX_CONCURRENT) prevents LM Studio from being
    completely overloaded (e.g. 20 devices at once), while still allowing
    TRUE parallel handling of several requests.

Result:
  Device 1 → POST → awaits LM Studio  → result in ~90s
  Device 2 → POST → awaits LM Studio  → result in ~90-180s   (independently)
  Device 3 → POST → awaits LM Studio  → result in ~90-270s   (independently)
  No device blocks another at the FastAPI level.
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from contextlib import asynccontextmanager
import uvicorn
import json
import base64
import io
import asyncio
import logging
from PIL import Image
import httpx
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
LM_STUDIO_URL   = os.getenv("LM_STUDIO_URL",    "http://localhost:1234")
MODEL_NAME      = os.getenv("MODEL_NAME",        "google/gemma-4-e4b")
MAX_TOKENS      = int(os.getenv("MAX_TOKENS",    "4000"))
TEMPERATURE     = float(os.getenv("TEMPERATURE", "0.2"))
IMAGE_MAX_PX    = int(os.getenv("IMAGE_MAX_PX",  "800"))
TIMEOUT_SECONDS = int(os.getenv("TIMEOUT_SECONDS", "600"))  # 10 min — covers queuing in LM Studio

# Max requests allowed IN FLIGHT simultaneously.
# LM Studio processes them one by one on the GPU, but all sit in its queue
# independently — so device 1 and device 2 each get a response as their
# inference completes, not as a batch.
MAX_CONCURRENT  = int(os.getenv("MAX_CONCURRENT", "5"))

logger.info(f"LM Studio    : {LM_STUDIO_URL}")
logger.info(f"Model        : {MODEL_NAME}")
logger.info(f"Max tokens   : {MAX_TOKENS}  |  Temp: {TEMPERATURE}  |  Timeout: {TIMEOUT_SECONDS}s")
logger.info(f"Max concurrent: {MAX_CONCURRENT}")

# ── Concurrency: soft gate (NOT a serial queue) ───────────────────────────────
# This only prevents > MAX_CONCURRENT simultaneous calls to LM Studio.
# It does NOT make them serial — multiple can be in-flight at once.
_concurrency_gate = asyncio.Semaphore(MAX_CONCURRENT)

# Live counter — for status endpoint only
_active_requests: int = 0


# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 62)
    logger.info("🌾  KisanLens Backend  v4  (True Concurrent — No Queue)")
    logger.info(f"    LM Studio  : {LM_STUDIO_URL}")
    logger.info(f"    Model      : {MODEL_NAME}")
    logger.info(f"    Concurrent : up to {MAX_CONCURRENT} simultaneous requests")
    logger.info(f"    Reasoning  : 2-pass chain-of-thought per request")
    logger.info("=" * 62)
    yield
    logger.info("KisanLens Backend shutting down.")


# ── FastAPI app ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="KisanLens API",
    description="Crop disease analysis — Gemma 4 e4b via LM Studio  |  v4 True Concurrent",
    version="4.0.0",
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Single-Pass System Prompt ─────────────────────────────────────────────────
# One call per request = true concurrency without overloading LM Studio.
# Chain-of-thought is embedded in the prompt (think-then-answer pattern).
SYSTEM_PROMPT = """You are KisanLens, India's most accurate AI crop doctor.

STEP 1 — OBSERVE the image carefully first (think internally):
• What crop/plant is this? Identify from leaf shape, stem, fruit.
• What exact symptoms are visible? Describe colors, patterns, lesion shapes.
• Is this diseased or healthy?

STEP 2 — DIAGNOSE based on what you observed, then output ONLY this JSON:

{
  "crop_type": "exact crop name e.g. Tomato, Paddy, Cotton",
  "disease_name": "specific disease name, or 'Healthy Crop' if healthy",
  "scientific_name": "pathogen scientific name or empty string",
  "confidence": "High|Medium|Low",
  "confidence_score": 0.90,
  "severity": "None|Mild|Moderate|Severe",
  "urgency": "Single most critical action for farmer RIGHT NOW",
  "description": "3-4 sentences: exact visual symptoms seen and consequence if untreated",
  "root_cause": "specific environmental or cultural reason this disease developed",
  "organic_treatments": [
    {"rank": 1, "name": "Neem Oil Spray", "dosage": "5 ml/L water", "how_to_prepare": "Mix 5ml neem oil + 1ml liquid soap in 1L water", "application_method": "Foliar spray on both leaf sides, early morning"},
    {"rank": 2, "name": "Bordeaux Mixture", "dosage": "10g copper sulphate + 10g lime per litre", "how_to_prepare": "Dissolve separately then mix", "application_method": "Foliar spray, repeat in 10 days"},
    {"rank": 3, "name": "Trichoderma viride", "dosage": "5g/L water", "how_to_prepare": "Mix powder in water just before use", "application_method": "Soil drench around root zone"}
  ],
  "chemical_treatments": [
    {"rank": 1, "name": "Mancozeb 75% WP", "active_ingredient": "Mancozeb", "dosage": "2.5g/L water", "safety_interval_days": 7, "application_method": "Foliar spray every 10-14 days"},
    {"rank": 2, "name": "Carbendazim 50% WP", "active_ingredient": "Carbendazim", "dosage": "1g/L water", "safety_interval_days": 14, "application_method": "Foliar spray or soil drench"}
  ],
  "prevention_strategies": [
    {"strategy": "Crop Rotation", "description": "Rotate with non-host crops for 2-3 seasons"},
    {"strategy": "Seed Treatment", "description": "Treat seeds with Thiram 2g/kg before sowing"},
    {"strategy": "Field Sanitation", "description": "Remove and burn infected debris immediately"},
    {"strategy": "Water Management", "description": "Use drip irrigation; avoid wetting foliage"}
  ],
  "government_schemes": [
    {"scheme_name": "PM-KISAN", "benefit_amount": "Rs 6,000/year in 3 instalments", "how_to_apply": "pmkisan.gov.in or nearest CSC"},
    {"scheme_name": "PMFBY (Crop Insurance)", "benefit_amount": "Full crop loss coverage at 2% premium", "how_to_apply": "pmfby.gov.in or nearest bank"},
    {"scheme_name": "Kisan Credit Card", "benefit_amount": "Up to Rs 3 lakh at 4% interest", "how_to_apply": "Nearest bank with land records"}
  ],
  "immediate_actions": [
    "Remove heavily infected leaves and destroy them",
    "Apply first treatment within 24 hours",
    "Improve air circulation by pruning dense growth"
  ],
  "notes": "One simple practical tip any farmer can act on immediately"
}

RULES:
- Use SPECIFIC disease names from your knowledge — not generic 'Fungal Disease'
- Real Indian-market product names only
- Return ONLY the JSON — no text before or after
- Close ALL brackets perfectly"""


# ── Image Helpers ───────────────────────────────────────────────────────────────

def resize_image(image: Image.Image) -> Image.Image:
    w, h = image.size
    if w < 50 or h < 50:
        raise HTTPException(status_code=400, detail=f"Image too small ({w}×{h} px). Please use a clearer photo.")
    if w > IMAGE_MAX_PX or h > IMAGE_MAX_PX:
        image = image.copy()
        image.thumbnail((IMAGE_MAX_PX, IMAGE_MAX_PX), Image.Resampling.LANCZOS)
        logger.debug(f"Resized to {image.size}")
    return image


def pil_to_base64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=85, optimize=True)
    return base64.b64encode(buf.getvalue()).decode()


def extract_json(text: str) -> dict:
    """Robustly extract JSON from model output — handles markdown fences."""
    text = text.strip()
    # Strip ```json ... ``` or ``` ... ``` fences
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            part = part.strip()
            if part.startswith("json"):
                part = part[4:].strip()
            if part.startswith("{"):
                text = part
                break
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        s = text.find("{")
        e = text.rfind("}") + 1
        if s != -1 and e > s:
            try:
                return json.loads(text[s:e])
            except Exception:
                pass
    logger.error(f"JSON parse failed. First 800 chars:\n{text[:800]}")
    raise HTTPException(status_code=500, detail="Model returned invalid JSON — please retry.")


# ── LM Studio HTTP Call ────────────────────────────────────────────────────────

async def call_lm_studio(
    messages: list[dict],
    max_tokens: int = MAX_TOKENS,
    temperature: float = TEMPERATURE,
    request_id: str = "?",
) -> str:
    """
    Async call to LM Studio /v1/chat/completions.
    Uses explicit read timeout (not total) so the connection
    stays alive for the full inference duration.
    """
    payload = {
        "model":       MODEL_NAME,
        "temperature": temperature,
        "max_tokens":  max_tokens,
        "messages":    messages,
    }
    url = f"{LM_STUDIO_URL}/v1/chat/completions"

    # Explicit per-phase timeout — read must be long (full inference)
    timeout = httpx.Timeout(
        connect=10.0,
        write=30.0,
        read=float(TIMEOUT_SECONDS),   # wait this long for model to respond
        pool=5.0,
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=payload)

        if resp.status_code != 200:
            logger.error(f"[{request_id}] LM Studio {resp.status_code}: {resp.text[:300]}")
            raise HTTPException(
                status_code=502,
                detail=f"LM Studio returned HTTP {resp.status_code}. Check LM Studio is running with model loaded."
            )

        raw = resp.json()["choices"][0]["message"]["content"]
        logger.info(f"[{request_id}] ← LM Studio OK  ({len(raw)} chars)")

        # Guard against empty responses (LM Studio occasionally returns blank)
        if len(raw.strip()) < 10:
            raise HTTPException(
                status_code=502,
                detail="LM Studio returned an empty response. Model may be overloaded — please retry."
            )
        return raw

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to LM Studio at {LM_STUDIO_URL}. "
                   "Ensure LM Studio is open and Server is started (port 1234)."
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail=f"LM Studio timed out after {TIMEOUT_SECONDS}s. "
                   "Server is under heavy load. Please wait 30 seconds and retry."
        )
    except (KeyError, IndexError):
        raise HTTPException(status_code=500, detail="Unexpected response structure from LM Studio.")


# ── Single-Pass Inference ──────────────────────────────────────────────────────

async def run_inference(img_b64: str, request_id: str) -> dict:
    """
    Single-pass inference — ONE LM Studio call per request.

    The system prompt embeds a think-then-answer chain-of-thought pattern
    so the model reasons before producing JSON, without needing a separate
    vision pass that doubles the call count and causes 504s under load.

    Auto-retries ONCE if LM Studio returns empty or invalid JSON.
    """
    img_url  = f"data:image/jpeg;base64,{img_b64}"
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": img_url}},
                {"type": "text", "text": (
                    "Analyse this crop image carefully. "
                    "Identify the crop, describe all visible symptoms, "
                    "then return the complete JSON diagnosis."
                )}
            ]
        }
    ]

    for attempt in (1, 2):   # retry once on failure
        try:
            logger.info(f"[{request_id}] → LM Studio  attempt={attempt}")
            raw    = await call_lm_studio(messages, request_id=request_id)
            result = extract_json(raw)
            logger.info(
                f"[{request_id}] ✓ Inference OK  "
                f"crop={result.get('crop_type','?')}  "
                f"disease={result.get('disease_name','?')}"
            )
            return result
        except HTTPException as exc:
            if attempt == 2 or exc.status_code not in (500, 502, 504):
                raise
            logger.warning(f"[{request_id}] Attempt {attempt} failed ({exc.status_code}) — retrying in 3s…")
            await asyncio.sleep(3)


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service":         "KisanLens API v4.2",
        "status":          "running",
        "architecture":    "SSE streaming — devtunnel-safe",
        "active_requests": _active_requests,
        "frontend":        "http://localhost:5173",
        "docs":            "http://localhost:8000/docs",
    }


@app.get("/health")
async def health():
    lm_ok, models = False, []
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{LM_STUDIO_URL}/v1/models")
        if r.status_code == 200:
            lm_ok  = True
            models = [m["id"] for m in r.json().get("data", [])]
    except Exception:
        pass

    return {
        "status":            "healthy" if lm_ok else "lm_studio_unreachable",
        "timestamp":         datetime.utcnow().isoformat(),
        "lm_studio_online":  lm_ok,
        "model":             MODEL_NAME,
        "available_models":  models,
        "active_requests":   _active_requests,
        "concurrency_limit": MAX_CONCURRENT,
        "config": {
            "max_tokens":       MAX_TOKENS,
            "temperature":      TEMPERATURE,
            "image_max_px":     IMAGE_MAX_PX,
            "timeout_seconds":  TIMEOUT_SECONDS,
            "architecture":     "SSE streaming with heartbeat",
        }
    }


@app.get("/status")
async def status():
    """Lightweight status — no LM Studio ping."""
    return {
        "active_requests":   _active_requests,
        "available_slots":   max(0, MAX_CONCURRENT - _active_requests),
        "concurrency_limit": MAX_CONCURRENT,
        "message": (
            f"{_active_requests} request(s) processing concurrently"
            if _active_requests > 0 else
            "Server idle — ready for requests"
        )
    }


# ── SSE helpers ────────────────────────────────────────────────────────────────

def sse_event(event_type: str, data: dict) -> str:
    """Format a Server-Sent Event line."""
    return f"data: {json.dumps({'type': event_type, **data})}\n\n"


# ── Main endpoint — SSE streaming ──────────────────────────────────────────────

@app.post("/analyze-crop")
async def analyze_crop(
    file: UploadFile = File(..., description="Crop image (JPEG/PNG/WebP)"),
):
    """
    🌾 Analyse a crop image via Server-Sent Events (SSE).

    WHY SSE:  DevTunnel (and most reverse proxies) close HTTP connections that
              are idle for > 60 seconds.  LM Studio takes 120-180s per request.
              SSE solves this by streaming heartbeat pings every 5s so the tunnel
              sees continuous traffic and stays alive until the result arrives.

    Protocol:
      → POST /analyze-crop  (multipart/form-data image)
      ← text/event-stream
          data: {"type":"status", "message":"...", "elapsed":N}  (every 5s)
          data: {"type":"result", "data":{...full JSON...}}
          data: {"type":"error",  "message":"..."}
    """
    global _active_requests

    # ── Capacity check ────────────────────────────────────────────────────────
    if _active_requests >= MAX_CONCURRENT:
        # Return SSE-format even for capacity errors so frontend handles uniformly
        async def capacity_error():
            yield sse_event("error", {
                "message": f"Server at capacity ({_active_requests}/{MAX_CONCURRENT} requests). Please retry in 30 seconds."
            })
        return StreamingResponse(capacity_error(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    # ── Read & validate image ─────────────────────────────────────────────────
    contents = await file.read()
    if not contents:
        async def empty_error():
            yield sse_event("error", {"message": "Empty file received."})
        return StreamingResponse(empty_error(), media_type="text/event-stream")

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        async def img_error():
            yield sse_event("error", {"message": f"Cannot read image: {e}"})
        return StreamingResponse(img_error(), media_type="text/event-stream")

    image   = resize_image(image)
    img_b64 = pil_to_base64(image)

    import uuid
    request_id = str(uuid.uuid4())[:8]
    start      = datetime.utcnow()

    logger.info(
        f"[{request_id}] ▶ SSE request  "
        f"file={file.filename}  size={image.size}  "
        f"active={_active_requests + 1}/{MAX_CONCURRENT}"
    )

    # ── SSE generator — heartbeat + result ───────────────────────────────────
    async def event_stream():
        global _active_requests
        _active_requests += 1

        # Launch inference as a background task
        inference_task = asyncio.create_task(run_inference(img_b64, request_id))

        try:
            # Send status pings every 5s while inference runs
            while not inference_task.done():
                elapsed = int((datetime.utcnow() - start).total_seconds())

                if elapsed < 10:
                    msg = "🌱 Uploading and reading image…"
                elif elapsed < 60:
                    msg = f"🔍 Analysing crop symptoms… ({elapsed}s)"
                elif elapsed < 120:
                    msg = f"🧠 Building diagnosis… ({elapsed}s)"
                else:
                    msg = f"⏳ Almost done — model finishing… ({elapsed}s)"

                yield sse_event("status", {"message": msg, "elapsed": elapsed})
                await asyncio.sleep(5)

            # Get the result (will re-raise any exception from the task)
            result = await inference_task

            duration = (datetime.utcnow() - start).total_seconds()
            result["_metadata"] = {
                "model":                     MODEL_NAME,
                "analysis_duration_seconds": round(duration, 2),
                "image_size":                list(image.size),
                "request_id":                request_id,
                "timestamp":                 datetime.utcnow().isoformat(),
            }

            logger.info(
                f"[{request_id}] ✅ SSE done  "
                f"duration={duration:.1f}s  "
                f"disease={result.get('disease_name', '?')}"
            )
            yield sse_event("result", {"data": result})

        except HTTPException as exc:
            logger.error(f"[{request_id}] ❌ {exc.detail}")
            yield sse_event("error", {"message": exc.detail})
        except Exception as exc:
            logger.error(f"[{request_id}] ❌ {exc}", exc_info=True)
            yield sse_event("error", {"message": f"Analysis failed: {str(exc)[:200]}"})
        finally:
            _active_requests -= 1
            inference_task.cancel()   # no-op if already done

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":     "no-cache",
            "X-Accel-Buffering": "no",      # disable nginx/proxy buffering
            "Connection":        "keep-alive",
        }
    )


# ── Error handler ──────────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_error(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": True, "message": str(exc), "timestamp": datetime.utcnow().isoformat()}
    )


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
        workers=1,
        loop="asyncio",
    )



