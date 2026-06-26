#!/usr/bin/env python3
"""Quick end-to-end test of the v3 job queue flow."""
import time, json, sys
import urllib.request, urllib.parse

BASE = "http://localhost:8000"

# 1 — submit
print("⬆ Submitting job...")
with open("/tmp/kl_test.jpg","rb") as f:
    img_data = f.read()

boundary = "----KisanLensBoundary"
body = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="kl_test.jpg"\r\n'
    f"Content-Type: image/jpeg\r\n\r\n"
).encode() + img_data + f"\r\n--{boundary}--\r\n".encode()

req = urllib.request.Request(
    f"{BASE}/analyze-crop",
    data=body,
    method="POST",
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)
resp = urllib.request.urlopen(req, timeout=10)
submit = json.loads(resp.read())
print(f"✅ Job submitted: {submit['job_id'][:8]}...  position={submit['position']}")
print(f"   Message: {submit['message']}\n")

# 2 — poll
job_id = submit["job_id"]
for i in range(30):
    time.sleep(5)
    r = urllib.request.urlopen(f"{BASE}/job/{job_id}", timeout=5)
    d = json.loads(r.read())
    status = d["status"]
    elapsed = d.get("elapsed_seconds", "?")
    msg = d.get("message","")
    print(f"  Poll {i+1:2d} ({(i+1)*5:3d}s): {status:12s} | {msg[:65]}")

    if status == "done":
        result = d["result"]
        print(f"\n{'='*60}")
        print(f"🌾 Crop     : {result.get('crop_type')}")
        print(f"🦠 Disease  : {result.get('disease_name')}")
        print(f"📊 Severity : {result.get('severity')}  | Confidence: {result.get('confidence_score')}")
        print(f"⚡ Urgency  : {result.get('urgency','')[:80]}")
        print(f"💊 Organic  : {len(result.get('organic_treatments',[]))} treatments")
        print(f"⚗️  Chemical : {len(result.get('chemical_treatments',[]))} treatments")
        print(f"⏱  Duration : {result.get('_metadata',{}).get('analysis_duration_seconds')}s")
        print(f"🧠 Passes   : {result.get('_metadata',{}).get('reasoning_passes')}")
        sys.exit(0)
    elif status == "error":
        print(f"❌ Error: {d.get('error')}")
        sys.exit(1)

print("⏱ Timeout after 150s")
