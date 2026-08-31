"""submit_jobs.py - submit one or more YouTube URLs through the viral-format
pipeline without going through bash -> cmd -> PowerShell quoting.

Reads URLs from argv (one per arg) and submits each via POST /api/process,
then polls /api/status/<job_id> until completed. Prints a summary table.

Usage: .venv/Scripts/python submit_jobs.py <url1> [url2 ...]
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ENV = ROOT / ".env"

# Load GEMINI_API_KEY from the root .env
key = None
for line in ENV.read_text(encoding="utf-8-sig").splitlines():
    line = line.strip()
    if line.startswith("GEMINI_API_KEY="):
        key = line.split("=", 1)[1].strip().strip('"').strip("'")
        break

if not key:
    sys.exit("ERROR: GEMINI_API_KEY not found in root .env")

API = "http://localhost:8000"
HEADERS = {"X-Gemini-Key": key, "Content-Type": "application/json"}

BODY = {
    "url": None,
    "acknowledged": True,
    "auto_hook": True,
    "auto_hook_style": "outline",
    "layouts": "auto,punch_in,speaker_cut,split",
    "target_clips": 5,
    "clip_min_seconds": 15,
    "clip_max_seconds": 34,
    "force_low_quality": False,
}


def post(url: str) -> dict:
    body = dict(BODY)
    body["url"] = url
    req = urllib.request.Request(
        f"{API}/api/process",
        data=json.dumps(body).encode("utf-8"),
        headers=HEADERS,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_status(job_id: str) -> dict:
    req = urllib.request.Request(f"{API}/api/status/{job_id}", headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def submit_and_wait(url: str, timeout_min: int = 60) -> tuple[str, dict]:
    print(f"\n>>> Submitting: {url}")
    resp = post(url)
    if resp.get("needs_confirmation"):
        qc = resp["quality_check"]
        print(f"  QUALITY GATE: source max resolution {qc['max_height']}p (min {qc['min_height']}p)")
        return (url, {"error": "needs_confirmation", "quality_check": qc})
    job_id = resp.get("job_id")
    if not job_id:
        return (url, {"error": "no_job_id", "response": resp})
    print(f"  Job queued: {job_id}")

    deadline = time.time() + timeout_min * 60
    last_log_count = 0
    while True:
        if time.time() > deadline:
            return (url, {"error": "timeout", "job_id": job_id})
        time.sleep(15)
        try:
            st = get_status(job_id)
        except Exception as exc:  # noqa: BLE001
            print(f"  (status poll failed: {exc} - retrying)")
            continue
        for line in st.get("logs", [])[last_log_count:]:
            line = (line or "").strip()
            if line:
                print(f"  | {line}")
        last_log_count = len(st.get("logs", []))
        status = st.get("status")
        if status == "completed":
            return (url, {"job_id": job_id, "status": "completed", "result": st.get("result", {})})
        if status == "failed":
            return (url, {"job_id": job_id, "status": "failed", "logs": st.get("logs", [])})


def main() -> int:
    urls = sys.argv[1:]
    if not urls:
        print("Usage: submit_jobs.py <url1> [url2 ...]")
        return 1
    results: list[tuple[str, dict]] = []
    for u in urls:
        results.append(submit_and_wait(u))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for url, r in results:
        if r.get("status") == "completed":
            clips = r.get("result", {}).get("clips", [])
            print(f"  OK   {url} -> {r['job_id']} ({len(clips)} clips)")
            for i, c in enumerate(clips):
                dur = ""
                if "start" in c and "end" in c:
                    dur = f"{c['end'] - c['start']:.1f}s"
                print(
                    f"       [{i}] {dur} score={c.get('predicted_score', '?')} hook='{c.get('viral_hook_text', '')}'"
                )
        else:
            print(f"  FAIL {url} -> {r.get('error')} {r.get('job_id', '')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())