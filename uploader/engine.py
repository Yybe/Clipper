"""Orchestrator: resolve clip -> per-platform payloads -> dry-run or real uploads."""

import re
import shutil
import time
from datetime import datetime

from .config import POSTS_DIR, Config
from .ledger import record as ledger_record
from .openshorts_api import ApiError, Clip, fetch_job
from .platforms import ADAPTERS, ClipPayload, SetupError, UploadResult


def slugify(text: str, max_len: int = 40) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "-", text or "").strip("-").lower()
    return slug[:max_len].strip("-") or "clip"


def _yt_hashtags(desc: str) -> list:
    return [h.lstrip("#").lower() for h in re.findall(r"#\w+", desc or "") if h.lstrip("#").lower()]


def build_payloads(cfg: Config, job_id: str, clip: Clip, platforms: list, title: str, desc: str, tags: str) -> dict:
    """Per-platform copy defaults: Gemini's per-platform fields first, overrides win."""
    payloads = {}
    yt_title = title or clip.yt_title or (clip.hook[:80] if clip.hook else "Viral Short")
    body_desc = desc or clip.tiktok_desc or clip.ig_desc or "Check this out!"
    yt_desc = body_desc if desc else (body_desc + ("\n" if not body_desc.endswith("\n") else "") + "#Shorts")
    ig_caption = desc or clip.ig_desc or clip.tiktok_desc or body_desc
    bili_title = (title or clip.yt_title or (clip.hook[:70] if clip.hook else "Viral Short")).strip()
    bili_desc = desc or clip.tiktok_desc or clip.ig_desc or ""

    cli_tags = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    yt_tags = cli_tags or _yt_hashtags(body_desc) or ["shorts"]
    bili_tags = cli_tags or [t.strip() for t in cfg.bili_tags.split(",") if t.strip()] or ["daily"]

    for name in platforms:
        common = dict(
            video_path=clip.local_path,
            video_public_url=clip.video_url,
            hook=clip.hook,
            score=clip.score,
            job_id=job_id,
            clip_index=clip.index,
        )
        if name == "youtube":
            payloads[name] = dict(platform=name, title=yt_title, description=yt_desc, tags=yt_tags, **common)
        elif name == "instagram":
            payloads[name] = dict(platform=name, title="", description=ig_caption, tags=[], **common)
        elif name == "bilibili":
            payloads[name] = dict(platform=name, title=bili_title, description=bili_desc, tags=bili_tags, **common)
    return payloads


def run_list(cfg: Config, job_id: str) -> int:
    job = fetch_job(cfg, job_id)
    print(f"Clips for job {job.job_id} ({len(job.clips)}):")
    for c in job.clips:
        exists = "file OK" if c.local_path.exists() else "FILE MISSING"
        size_mb = c.local_path.stat().st_size / 1_048_576 if c.local_path.exists() else 0
        print(f"  [{c.index}] {c.duration}s  score={c.score}  {exists} ({size_mb:.1f} MB)")
        print(f"      hook:   {c.hook}")
        print(f"      YT:     {c.yt_title}")
        print(f"      IG:     {c.ig_desc}")
        print(f"      file:   {c.video_url}")
        print("")
    print("DRY-RUN LIST ONLY. To post clip N to all configured platforms:")
    print(f"  uploader.bat post --job {job_id} --clip <N> --post")
    print("(default posts to youtube + instagram + bilibili; add --platforms to narrow)")
    return 0


def run_check(cfg: Config, platforms: list) -> int:
    failures = 0
    for name in platforms:
        adapter = ADAPTERS[name](cfg)
        print(f"--- {name} ---")
        try:
            for line in adapter.check():
                mark = "OK " if line.ok else "!! "
                print(f"  {mark}{line.text}")
                if not line.ok:
                    failures += 1
        except SetupError as exc:
            failures += 1
            for i, line in enumerate(str(exc).splitlines()):
                print(f"  !! {line}" if i == 0 else f"     {line}")
    print("")
    print("All checks passed." if failures == 0 else f"{failures} setup item(s) need attention.")
    return 0 if failures == 0 else 1


def run_doctor(cfg: Config) -> int:
    print("Clipper Uploader doctor")
    print(f"  api_base: {cfg.api_base}")

    import importlib

    deps = {
        "googleapiclient": "youtube",
        "google_auth_oauthlib": "youtube",
        "requests": "instagram",
        "bilibili_api": "bilibili",
    }
    for module, needed_by in deps.items():
        try:
            importlib.import_module(module)
            print(f"  OK   python dep: {module} (for {needed_by})")
        except ImportError:
            print(f"  MISS python dep: {module} (needed by {needed_by}) -> run uploader\\setup-deps.bat")

    try:
        import urllib.request

        with urllib.request.urlopen(f"{cfg.api_base}/openapi.json", timeout=10):
            print("  OK   OpenShorts backend reachable")
    except Exception as exc:  # noqa: BLE001
        print(f"  MISS OpenShorts backend ({exc}) -> start.bat")

    for tool, why in (("ffmpeg", "bilibili auto-cover"), ("cloudflared", "instagram quick-tunnel")):
        found = shutil.which(tool)
        print(f"  {'OK  ' if found else 'MISS'} tool: {tool} ({why})")

    print(f"  youtube client_secrets: {cfg.yt_client_secrets} {'(present)' if cfg.yt_client_secrets.exists() else '(missing)'}")
    print(f"  youtube oauth token:    {cfg.yt_token} {'(present)' if cfg.yt_token.exists() else '(missing)'}")
    print(f"  instagram token in .env: {'(set)' if cfg.ig_access_token else '(missing)'}; IG_USER_ID: {'(set)' if cfg.ig_user_id else '(missing)'}")
    print(f"  bilibili cookies in .env: {'(set)' if cfg.bili_sessdata and cfg.bili_jct else '(missing)'}")
    return 0


def run_post(
    cfg: Config,
    job_id: str,
    clip_index: int,
    platforms: list,
    title: str,
    desc: str,
    tags: str,
    do_post: bool,
    assume_yes: bool,
) -> int:
    clip = _get_clip(cfg, job_id, clip_index)
    if not do_post:
        _print_payloads(cfg, job_id, clip, platforms, title, desc, tags)
        print("DRY-RUN ONLY - nothing was uploaded. Add --post (and --clip) to really post.")
        return 0

    if not clip.local_path.exists():
        print(f"ERROR: clip file not found: {clip.local_path}")
        return 1

    payloads = build_payloads(cfg, job_id, clip, platforms, title, desc, tags)
    print("=" * 60)
    print(f" REAL POST: job {job_id}, clip [{clip_index}], platforms: {', '.join(platforms)}")
    for name, p in payloads.items():
        print(f"   {name}: title={p['title'] or '(caption only)'}")
    print("=" * 60)
    if not assume_yes:
        answer = input("Type POST to confirm, anything else aborts: ").strip()
        if answer != "POST":
            print("Aborted - nothing was posted.")
            return 1

    results = []
    for name in platforms:
        adapter = ADAPTERS[name](cfg)
        payload_obj = _payload_dataclass(payloads[name])
        print(f"[{name}] uploading...", flush=True)
        started = time.time()
        try:
            result = adapter.upload(payload_obj)
        except (SetupError, Exception) as exc:  # noqa: BLE001 - one platform must not kill the others
            result = UploadResult(name, False, error=str(exc))
        mins = (time.time() - started) / 60
        if result.ok:
            print(f"[{name}] DONE in {mins:.1f} min -> {result.url or '(no url)'}")
        else:
            print(f"[{name}] FAILED: {result.error[:400]}")
        results.append(result)

    ok_results = [r for r in results if r.ok]
    posts_copy = ""
    if ok_results:
        posts_copy = _copy_to_posts(clip, payloads[ok_results[0].platform]["title"] or clip.hook)

    ledger_record(
        {
            "kind": "post",
            "job_id": job_id,
            "clip_index": clip_index,
            "title": payloads[platforms[0]]["title"],
            "score": clip.score,
            "platforms": [
                {"platform": r.platform, "ok": r.ok, "url": r.url, "ref": r.ref_id, "error": r.error[:500]}
                for r in results
            ],
            "posts_copy": posts_copy,
        }
    )

    print("-" * 60)
    if ok_results:
        extra = f"; local copy: {posts_copy}" if posts_copy else ""
        print(f"Posted to {len(ok_results)}/{len(platforms)} platforms{extra}")
        return 0 if len(ok_results) == len(platforms) else 2
    print("All platforms failed - nothing posted (ledger recorded the attempt).")
    return 1


def _get_clip(cfg: Config, job_id: str, clip_index: int) -> Clip:
    try:
        job = fetch_job(cfg, job_id)
    except ApiError as exc:
        raise SystemExit(f"ERROR: {exc}")
    if clip_index < 0 or clip_index >= len(job.clips):
        raise SystemExit(f"ERROR: --clip must be 0..{len(job.clips) - 1} (use `uploader.bat list --job {job_id}`).")
    return job.clips[clip_index]


def _print_payloads(cfg: Config, job_id: str, clip: Clip, platforms: list, title: str, desc: str, tags: str) -> None:
    print(f"Clip [{clip.index}] {clip.duration}s score={clip.score} (job {job_id})")
    print(f"  hook: {clip.hook}")
    print(f"  file: {clip.local_path.name} {'(exists)' if clip.local_path.exists() else '(MISSING!)'}")
    print("")
    payloads = build_payloads(cfg, job_id, clip, platforms, title, desc, tags)
    for name in platforms:
        adapter = ADAPTERS[name](cfg)
        print(f"--- {name} ---")
        try:
            adapter.check()
        except SetupError:
            print("  (setup incomplete - `uploader.bat check` shows the steps)")
        except Exception as exc:  # noqa: BLE001
            print(f"  (check failed: {str(exc)[:120]})")
        for line in adapter.dry_run(_payload_dataclass(payloads[name])):
            print(f"  {line}")
        print("")


def _payload_dataclass(p: dict) -> ClipPayload:
    return ClipPayload(
        platform=p["platform"],
        title=p["title"],
        description=p["description"],
        tags=p["tags"],
        video_path=p["video_path"],
        video_public_url=p["video_public_url"],
        hook=p["hook"],
        score=p["score"],
        job_id=p["job_id"],
        clip_index=p["clip_index"],
    )


def _copy_to_posts(clip: Clip, title: str) -> str:
    """Keep a human-findable copy next to the Upload-Post workflow's exports."""
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    score = clip.score if clip.score.isdigit() else "x"
    dest = POSTS_DIR / f"{datetime.now():%Y-%m-%d}_{slugify(title)}_{score}.mp4"
    shutil.copy2(clip.local_path, dest)
    return str(dest)
