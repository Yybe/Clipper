"""Server-side product events to OpenPanel.

The browser already reports the funnel (Signup, CheckoutStarted, Subscribed,
QuotaWall*, UpsellModal*). This module reports what the browser cannot be
trusted for:

* **Job outcomes.** Ad-blockers eat a chunk of client-side analytics, and the
  interesting moment — a render finishing minutes later — often happens after
  the tab is gone. Server-side is the only place these are complete.
* **Repeat usage.** The one number that decides whether the product retains:
  on 26-jul-2026, 491 of 564 users who ever processed a video did it exactly
  once. Every clip-quality fix shipped that day (1080p, captions, loudness) was
  aimed at that 87%, and nothing in the stack could measure whether it moved.
  ``job_index`` on each event answers it directly: count distinct users at
  index 1 versus index >= 2, before and after.

Fire-and-forget by design. Analytics must never slow down or break a job, so
every failure is swallowed and every send runs in the background.
"""
import asyncio
import os

import httpx

_TIMEOUT = 5.0


def _config():
    """(api_url, client_id, client_secret) or None when not configured.

    Absent config is the normal state for self-hosted installs, so this stays
    silent rather than warning.
    """
    client_id = os.environ.get("OPENPANEL_CLIENT_ID", "").strip()
    if not client_id:
        return None
    api = (os.environ.get("OPENPANEL_API_URL", "").strip()
           or "https://api.openpanel.fotoexamen.com").rstrip("/")
    return api, client_id, os.environ.get("OPENPANEL_CLIENT_SECRET", "").strip()


async def _post(payload):
    cfg = _config()
    if not cfg:
        return
    api, client_id, secret = cfg
    headers = {"openpanel-client-id": client_id, "Content-Type": "application/json"}
    if secret:
        headers["openpanel-client-secret"] = secret
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as c:
            await c.post(f"{api}/track", json=payload, headers=headers)
    except Exception:
        pass  # analytics must never surface into a job


def track(name: str, user_id=None, **props):
    """Queue an event. Returns immediately; never raises.

    ``user_id`` becomes OpenPanel's profileId, which is what makes retention
    and repeat-usage questions answerable per user.
    """
    if not _config():
        return
    payload = {
        "type": "track",
        "payload": {
            "name": name,
            "properties": {k: v for k, v in props.items() if v is not None},
        },
    }
    if user_id is not None:
        payload["payload"]["profileId"] = str(user_id)
    try:
        asyncio.get_running_loop().create_task(_post(payload))
    except RuntimeError:
        pass  # no loop (CLI/self-host path) — nothing to report to anyway
