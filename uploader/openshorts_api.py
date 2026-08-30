"""OpenShorts API client: resolve a job's finished clips into postable data."""

import json
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from .config import ROOT


@dataclass
class Clip:
    index: int
    score: str
    hook: str
    yt_title: str
    tiktok_desc: str
    ig_desc: str
    video_url: str  # relative, e.g. /videos/<job>/<file>.mp4
    duration: float
    local_path: Path


@dataclass
class Job:
    job_id: str
    status: str
    clips: list


class ApiError(Exception):
    pass


def fetch_job(cfg, job_id: str) -> Job:
    url = f"{cfg.api_base}/api/status/{job_id}"
    req = urllib.request.Request(url, headers={"X-Gemini-Key": cfg.gemini_key})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ApiError(f"API {exc.code} for {url}: {exc.read().decode('utf-8', 'replace')[:300]}") from exc
    except urllib.error.URLError as exc:
        raise ApiError(
            f"Cannot reach the OpenShorts backend at {cfg.api_base} ({exc.reason}). "
            "Start it with start.bat, then retry."
        ) from exc

    status = data.get("status", "?")
    if status != "completed":
        raise ApiError(f"Job status is '{status}' - only completed jobs can be posted.")
    raw_clips = (data.get("result") or {}).get("clips") or []
    if not raw_clips:
        raise ApiError("Job has no clips.")

    clips = []
    for i, c in enumerate(raw_clips):
        video_url = c.get("video_url") or ""
        filename = video_url.split("/")[-1]
        local_path = ROOT / "openshorts" / "output" / job_id / filename
        try:
            duration = float(c.get("end", 0)) - float(c.get("start", 0))
        except (TypeError, ValueError):
            duration = 0.0
        clips.append(
            Clip(
                index=i,
                score=str(c.get("predicted_score", "?")),
                hook=c.get("viral_hook_text", ""),
                yt_title=c.get("video_title_for_youtube_short", ""),
                tiktok_desc=c.get("video_description_for_tiktok", ""),
                ig_desc=c.get("video_description_for_instagram", ""),
                video_url=video_url,
                duration=round(duration, 1),
                local_path=local_path,
            )
        )
    return Job(job_id=job_id, status=status, clips=clips)
