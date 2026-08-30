"""Operational email alerts for the admin (proxy out of credits, high failure rate).

Tracks recent managed-job outcomes in memory and emails ADMIN_EMAIL (via Resend)
when something looks broken, with a per-alert cooldown so it never spams.
"""
import asyncio
import os
import time
from collections import deque

from .config import settings
from .emails import send_email

_recent = deque(maxlen=12)          # rolling window of recent job outcomes (ok bool)
_last_alert = {}                    # alert kind -> last-sent epoch
_ALERT_COOLDOWN = 3600              # 1 hour between repeats of the same alert
_FAIL_WINDOW_MIN = 6               # need at least this many recent jobs to judge a rate
_FAIL_THRESHOLD = 5                # ...and this many failures among them

# Specific signatures of a genuine proxy / download-stage failure. Kept precise
# on purpose: a bare "proxy"/"credit"/"balance" match fired on any job whose logs
# merely echoed the proxy URL (yt-dlp debug) or whose video title contained one of
# those words, producing false "out of credits" alerts for jobs that actually
# failed later in processing. These phrases only appear in real proxy failures.
_PROXY_HINTS = (
    "proxyerror",
    "cannot connect to proxy",
    "failed to connect to proxy",
    "unable to connect to proxy",
    "proxy authentication required",
    "407 proxy",
    "http error 407",
    "tunnel connection failed",
    "402 payment required",
    "out of credits",
    "insufficient balance",
)


def _looks_like_proxy_error(err: str) -> bool:
    e = (err or "").lower()
    return any(k in e for k in _PROXY_HINTS)


def _classify_failure(err: str) -> str:
    """One-word category for the last error, so the alert points the right way."""
    e = (err or "").lower()
    if _looks_like_proxy_error(e):
        return "proxy"
    if "no_audio" in e or "no audio" in e:
        return "no audio"
    if "sign in to confirm" in e or "not a bot" in e or "http error 403" in e \
            or "http error 429" in e or "video unavailable" in e or "read timed out" in e:
        return "youtube download"
    if "whisper" in e or "faster_whisper" in e or "transcrib" in e or "av/container" in e:
        return "transcription"
    # User content rejected by the AI provider's policy filter — deterministic,
    # not actionable on our side. Named so the alert doesn't read as an outage.
    if "prohibited_content" in e or "blocked this video" in e or "blocked its answer" in e:
        return "blocked content (user video)"
    # The source held nothing clip-shaped (typically an already-short video) —
    # content-shaped like the policy block above, not an outage.
    if "did not return usable clips" in e or "clip detection failed" in e:
        return "no clips found (user video)"
    if "gemini" in e or "google.genai" in e:
        return "gemini"
    if "ffmpeg" in e or "reframe" in e:
        return "ffmpeg/render"
    return "mixed"


def _cooldown_ok(kind: str) -> bool:
    now = time.time()
    if now - _last_alert.get(kind, 0) < _ALERT_COOLDOWN:
        return False
    _last_alert[kind] = now
    return True


# Prefix on every OpenShorts Telegram message. The chat is shared with other
# products (Upload-Post, …), so this tags which one each alert is from.
TELEGRAM_PREFIX = "OPENSHORTS ✂️ - "


async def send_telegram(text: str, *, raise_errors: bool = False):
    """Push a plain-text message to the admin's Telegram chat. No-op if unset.

    Best-effort by default: never raises — an alert failing must not break a
    webhook or job. ``raise_errors=True`` is for callers with their own retry
    (the daily digest), where swallowing the failure means losing the message.
    """
    if not settings.telegram_configured:
        return
    try:
        import httpx
        url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
        payload = {"chat_id": settings.telegram_chat_id,
                   "text": TELEGRAM_PREFIX + text,
                   "disable_web_page_preview": True}
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
    except Exception as e:
        if raise_errors:
            raise
        print(f"⚠️  Telegram alert failed: {e}")


async def send_admin_alert(subject: str, body: str):
    """Notify the admin via every configured channel (email + Telegram)."""
    # Telegram first — instant, and configured independently of email.
    await send_telegram(f"{subject}\n\n{body}")

    to = settings.admin_email
    if not to or not settings.smtp_configured:
        if not settings.telegram_configured:
            print(f"⚠️  [ADMIN ALERT] {subject}\n{body[:500]}"
                  + ("" if to else "  (set ADMIN_EMAIL + SMTP_* or TELEGRAM_* to receive these)"))
        return
    html = f"<pre style='font:13px/1.5 monospace;white-space:pre-wrap'>{body}</pre>"
    await send_email(to, f"[OpenShorts] {subject}", html)


async def record_job_outcome(ok: bool, error_text: str = ""):
    """Record a managed job's result and fire an alert if the picture looks bad."""
    _recent.append(bool(ok))
    if ok:
        return

    # 1) Proxy / credits problem — most urgent, alert immediately AND open the
    # incident so the proxy watcher keeps nagging until the balance is back
    # (one alert at 3am is easy to miss; an exhausted proxy takes all
    # YouTube-URL ingest down until someone tops it up).
    if _looks_like_proxy_error(error_text):
        if not _watch_down.get(_PAID_TARGET):
            _watch_down[_PAID_TARGET] = time.time()
            _watch_nag[_PAID_TARGET] = time.time()
        if _cooldown_ok("proxy"):
            await send_admin_alert(
                "🔴 Proxy error — may be out of credits",
                "A managed job failed with a proxy-related error. Check your proxy "
                "balance — downloads will keep failing until it's topped up.\n"
                "This repeats every 2 h until the proxy answers again.\n\n"
                f"Error:\n{error_text[:1200]}",
            )
        return

    # 2) High failure rate — report it honestly and classify the last error
    # instead of always blaming the download path (it's often transcription of
    # a silent upload, a bad video, etc.).
    recent = list(_recent)
    fails = recent.count(False)
    if len(recent) >= _FAIL_WINDOW_MIN and fails >= _FAIL_THRESHOLD and _cooldown_ok("failrate"):
        await send_admin_alert(
            f"⚠️ High job failure rate ({_classify_failure(error_text)})",
            f"{fails} of the last {len(recent)} managed jobs failed.\n\n"
            f"Last error:\n{error_text[:1200]}",
        )


# --- Proxy watcher --------------------------------------------------------------
# A dead download route takes YouTube-URL ingest down (or silently moves it to
# per-GB billing), and a single alert at the moment it dies is easy to miss.
# The watcher probes every configured route on a schedule, keeps nagging on
# Telegram until it's fixed, and confirms recovery (incident of 19-aug-2026:
# DataImpulse 407 TRAFFIC_EXHAUSTED, found by accident hours later).
#
# Watched targets:
# - "static proxy pool" (STATIC_PROXY_URLS): flat-rate ISP IPs, the primary
#   route. Ingest still works when they die (paid fallback) but every GB
#   starts costing money — that's worth a nag of its own.
# - "paid proxy" (PROXY_URL): the per-GB last resort; dead = ingest at risk.
_PROXY_PROBE_INTERVAL = 1800        # seconds between probes (30 min)
_PROXY_RENOTIFY = 7200              # keep nagging every 2 h while it stays down
# 204-No-Content endpoint: the probe costs a handful of bytes of paid traffic.
# Plain HTTP on purpose: HTTPS through DataImpulse fails in httpx with an SSL
# record-layer error even when the proxy is healthy (yt-dlp's stack is fine
# with it), which would make an HTTPS probe cry wolf. An exhausted balance
# rejects the request before forwarding, so HTTP still detects the 407.
_PROXY_PROBE_URL = "http://www.google.com/generate_204"
_watch_down = {}                    # target name -> down-since epoch
_watch_nag = {}                     # target name -> last-nag epoch

_PAID_TARGET = "paid proxy"
_STATIC_TARGET = "static proxy pool"


def _watch_targets():
    """[(name, [proxy urls])] — a target is up if ANY of its urls answers."""
    targets = []
    statics = [p.strip() for p in
               os.environ.get("STATIC_PROXY_URLS", "").split(",") if p.strip()]
    if statics:
        targets.append((_STATIC_TARGET, statics))
    paid = os.environ.get("PROXY_URL", "").strip()
    if paid:
        targets.append((_PAID_TARGET, [paid]))
    return targets


async def _probe_one(proxy):
    """(ok, detail) for one cheap request through one proxy."""
    try:
        import httpx
        async with httpx.AsyncClient(proxy=proxy, timeout=20) as client:
            resp = await client.get(_PROXY_PROBE_URL)
        if resp.status_code < 400:
            return True, ""
        return False, f"HTTP {resp.status_code}"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


async def _watch_update(name, ok, detail):
    """Shared incident state machine: alert on down, nag, confirm recovery."""
    now = time.time()
    if ok:
        if _watch_down.get(name):
            mins = int((now - _watch_down[name]) / 60)
            await send_admin_alert(
                f"✅ {name} recovered",
                f"The {name} answers again after ~{mins} min down.",
            )
            _watch_down[name] = None
            _watch_nag[name] = 0.0
        return
    hint = ("YouTube-URL jobs are falling back to the PER-GB paid proxy — "
            "ingest still works but every download now costs money."
            if name == _STATIC_TARGET else
            "YouTube-URL jobs will keep failing on this route until it's "
            "topped up / fixed.")
    if not _watch_down.get(name):
        _watch_down[name] = now
        _watch_nag[name] = now
        await send_admin_alert(
            f"🔴 {name} DOWN",
            f"The {name} probe failed. {hint}\n"
            "This alert repeats every 2 h until it answers again.\n\n"
            f"Probe error: {detail[:400]}",
        )
    elif now - _watch_nag[name] >= _PROXY_RENOTIFY:
        _watch_nag[name] = now
        hours = (now - _watch_down[name]) / 3600
        await send_admin_alert(
            f"🔴 {name} STILL down ({hours:.1f} h)",
            f"{hint}\n\nProbe error: {detail[:400]}",
        )


async def proxy_watch_tick():
    """One probe cycle over every configured route."""
    for name, urls in _watch_targets():
        ok, detail = False, "no urls"
        for u in urls:
            ok, detail = await _probe_one(u)
            if ok:
                break
        await _watch_update(name, ok, detail)


async def proxy_watch_loop():
    """Background task started from the app lifespan (managed mode only)."""
    while True:
        try:
            await proxy_watch_tick()
        except Exception as e:
            print(f"⚠️  Proxy watch error: {e}")
        await asyncio.sleep(_PROXY_PROBE_INTERVAL)
