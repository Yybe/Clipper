"""TikTok adapter — official Content Posting API (PULL_FROM_URL + FILE_UPLOAD).

Two upload modes, one API. The adapter picks automatically:
  - PULL_FROM_URL: TikTok fetches the clip from a public URL (needs a tunnel
    or TIKTOK_PUBLIC_BASE_URL). Cheaper and faster when available.
  - FILE_UPLOAD: chunked PUT of the local file directly to TikTok's upload_url.
    Always works, no tunnel needed; slower on large files.

Both modes use the same init endpoint (open.tiktokapis.com/v2); check() hits
creator_info/query to validate the token + surface the account's privacy
options.

One-time setup (see https://developers.tiktok.com/doc/content-posting-api-get-started):
  1. developers.tiktok.com -> Manage apps -> Create app -> add
     "Content Posting API" (and "Login Kit" for OAuth). Set redirect URI
     (e.g. https://www.example.com/callback — any https you control).
  2. Request/complete App review so the scopes video.publish + video.upload
     are approved; sandbox works before approval but is limited.
  3. OAuth: user authorizes at
     https://www.tiktok.com/v2/auth/authorize?client_key=<KEY>&scope_token=video_publish,video_upload&response_type=code&redirect_uri=<URI>&state=...
     Exchange the returned `code` for tokens:
     POST https://open.tiktokapis.com/v2/oauth/token/
       client_key, client_secret, code, grant_type=authorization_code, redirect_uri
     -> { access_token, refresh_token, open_id, expires_in }
  4. Put the four values in the root .env:
     TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_ACCESS_TOKEN,
     TIKTOK_REFRESH_TOKEN, TIKTOK_OPEN_ID
     Optional: TIKTOK_PRIVACY_LEVEL (SELF_ONLY | PUBLIC_TO_EVERYONE |
     MUTUAL_FOLLOW_FRIENDS | FOLLOWER_OF_CREATOR), TIKTOK_PUBLIC_BASE_URL,
     TIKTOK_CHUNK_SIZE (bytes, default 10 MB).

Tokens expire (~24 h for the short-lived access_token); refresh with:
  POST https://open.tiktokapis.com/v2/oauth/token/
    client_key, client_secret, grant_type=refresh_token, refresh_token
  and update .env (the adapter prints a warning when the check fails due to
  expiry so you know to refresh).

Publishing is async: init returns a publish_id; the adapter polls
/v2/post/publish/status/fetch/ until PUBLISH_COMPLETE / FAILED.
"""

import math
import time
from pathlib import Path

import requests

from ..tunnel import QuickTunnel
from .base import CheckLine, ClipPayload, PlatformAdapter, SetupError, UploadResult

TIKTOK_API = "https://open.tiktokapis.com/v2"
# TikTok enforces SUCCESS with 200 even on logical errors — data.error.code matters.
PRIVACY_VALUES = {"PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"}


class TikTokAdapter(PlatformAdapter):
    name = "tiktok"

    def _requirements(self):
        cfg = self.cfg
        if not (cfg.tiktok_client_key and cfg.tiktok_access_token and cfg.tiktok_open_id):
            raise SetupError(
                "TikTok is not configured. One-time setup (official Content Posting API):\n"
                "  1. developers.tiktok.com -> Manage apps -> Create app -> add\n"
                "     'Content Posting API' + 'Login Kit'; set a redirect URI\n"
                "  2. OAuth authorize -> exchange code for tokens (steps in README)\n"
                "  3. Put TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET,\n"
                "     TIKTOK_ACCESS_TOKEN, TIKTOK_REFRESH_TOKEN, TIKTOK_OPEN_ID in .env\n"
                "  Optional: TIKTOK_PRIVACY_LEVEL, TIKTOK_PUBLIC_BASE_URL\n"
                "  Docs: https://developers.tiktok.com/doc/content-posting-api-get-started"
            )
        if cfg.tiktok_privacy_level not in PRIVACY_VALUES:
            raise SetupError(
                f"TIKTOK_PRIVACY_LEVEL must be one of {sorted(PRIVACY_VALUES)} "
                f"(got '{cfg.tiktok_privacy_level}')."
            )

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.cfg.tiktok_access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }

    def _creator_info(self) -> dict:
        """Fetch creator_info to validate token + surface limits. Raises on failure."""
        resp = requests.post(
            f"{TIKTOK_API}/post/publish/creator_info/query/",
            headers=self._headers(),
            json={},
            timeout=30,
        )
        body = resp.json() if resp.content else {}
        # TikTok returns { data: { creator_nickname, privacy_level_options, ... }, error: { code } }
        err = body.get("error") or {}
        if err.get("code") not in (None, "ok", "OK", ""):
            raise SetupError(f"TikTok creator_info rejected the token: {body} (HTTP {resp.status_code})")
        data = body.get("data") or {}
        if not data and resp.status_code != 200:
            raise SetupError(f"TikTok creator_info failed: {body} (HTTP {resp.status_code})")
        return data

    def check(self):
        self._requirements()
        try:
            info = self._creator_info()
        except SetupError:
            raise
        except Exception as exc:  # noqa: BLE001
            raise SetupError(f"Cannot reach TikTok API: {exc}") from exc
        nick = info.get("creator_nickname") or info.get("creator_username") or self.cfg.tiktok_open_id
        opts = info.get("privacy_level_options") or []
        opts_str = ", ".join(opts) if opts else "(unknown — will still post with configured level)"
        lines = [
            CheckLine(True, f"TikTok: token valid, posting as '{nick}' (open_id {self.cfg.tiktok_open_id[:8]}...)"),
            CheckLine(True, f"TikTok: privacy options from API: {opts_str}"),
            CheckLine(True, f"TikTok: configured privacy={self.cfg.tiktok_privacy_level}"),
        ]
        # Tunnel / public URL hint
        if self.cfg.tiktok_public_base_url:
            lines.append(CheckLine(True, f"TikTok: public base URL configured ({self.cfg.tiktok_public_base_url})"))
        else:
            import shutil

            if shutil.which(self.cfg.ig_cloudflared):
                lines.append(CheckLine(True, "TikTok: cloudflared available (PULL_FROM_URL will auto-tunnel; FILE_UPLOAD works without it)"))
            else:
                lines.append(
                    CheckLine(
                        False,
                        "TikTok: cloudflared NOT found — PULL_FROM_URL needs it (or set TIKTOK_PUBLIC_BASE_URL); "
                        "FILE_UPLOAD still works without a tunnel",
                    )
                )
        return lines

    def dry_run(self, payload: ClipPayload):
        size_mb = payload.video_path.stat().st_size / 1_048_576 if payload.video_path.exists() else 0
        size_bytes = payload.video_path.stat().st_size if payload.video_path.exists() else 0
        mode = "PULL_FROM_URL (auto quick-tunnel)" if self._can_pull() else "FILE_UPLOAD (chunked PUT)"
        caption = (payload.description or payload.title or "")[:150]
        return [
            f"[tiktok] file: {payload.video_path.name} ({size_mb:.1f} MB, {size_bytes} bytes) -> Content Posting API ({mode})",
            f"[tiktok] caption ({len(caption)} ch): {caption}{'...' if len(caption) == 150 else ''}",
            f"[tiktok] privacy: {self.cfg.tiktok_privacy_level}, open_id: {self.cfg.tiktok_open_id[:8] + '...' if self.cfg.tiktok_open_id else '(NOT SET)'}",
            "[tiktok] flow: video/init (PULL or FILE) -> poll status/fetch until published -> tiktok.com/@user/video/<id>",
        ]

    def _can_pull(self) -> bool:
        import shutil

        return bool(self.cfg.tiktok_public_base_url or shutil.which(self.cfg.ig_cloudflared))

    def _public_url(self, video_url: str) -> str:
        if self.cfg.tiktok_public_base_url:
            return self.cfg.tiktok_public_base_url + video_url
        # Reuse IG's cloudflared path; tunnel exposes the same /videos mount TikTok will fetch.
        self._tunnel = QuickTunnel(self.cfg.ig_cloudflared, "http://localhost:8000")
        base = self._tunnel.start()
        return base + video_url

    # -- Upload paths --

    def upload(self, payload: ClipPayload) -> UploadResult:
        self._requirements()
        self._tunnel = None
        try:
            # Prefer PULL when we can get a public URL; otherwise FILE_UPLOAD always works.
            if self._can_pull():
                try:
                    public_url = self._public_url(payload.video_public_url or "")
                    print(f"[tiktok] public video url: {public_url}", flush=True)
                    return self._upload_pull(payload, public_url)
                except SetupError as exc:
                    # Tunnel failed — fall back to FILE_UPLOAD rather than failing the platform
                    print(f"[tiktok] PULL setup failed ({exc}); falling back to FILE_UPLOAD", flush=True)
                    return self._upload_file(payload)
            else:
                return self._upload_file(payload)
        finally:
            if getattr(self, "_tunnel", None):
                try:
                    self._tunnel.stop()
                except Exception:
                    pass

    def _upload_pull(self, payload: ClipPayload, public_url: str) -> UploadResult:
        caption = (payload.description or payload.title or "")[:2200]
        size = payload.video_path.stat().st_size
        body = {
            "post_info": {
                "title": caption,
                "privacy_level": self.cfg.tiktok_privacy_level,
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
                "video_cover_timestamp_ms": 1000,
            },
            "source_info": {
                "source": "PULL_FROM_URL",
                "video_url": public_url,
                "video_size": size,
            },
        }
        resp = requests.post(
            f"{TIKTOK_API}/post/publish/video/init/",
            headers=self._headers(),
            json=body,
            timeout=120,
        )
        data = self._parse_init(resp, "PULL_FROM_URL")
        publish_id = data.get("publish_id", "")
        if not publish_id:
            return UploadResult(self.name, False, error=f"TikTok PULL init returned no publish_id: {data} / {resp.text[:500]}")
        print(f"[tiktok] publish_id {publish_id} (PULL_FROM_URL) — polling status...", flush=True)
        return self._poll_status(publish_id)

    def _upload_file(self, payload: ClipPayload) -> UploadResult:
        caption = (payload.description or payload.title or "")[:2200]
        size = payload.video_path.stat().st_size
        chunk_size = max(1 * 1024 * 1024, min(64 * 1024 * 1024, self.cfg.tiktok_chunk_size))
        total_chunks = max(1, math.ceil(size / chunk_size))
        print(f"[tiktok] FILE_UPLOAD: {size} bytes in {total_chunks} chunk(s) of {chunk_size} bytes", flush=True)

        body = {
            "post_info": {
                "title": caption,
                "privacy_level": self.cfg.tiktok_privacy_level,
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
                "video_cover_timestamp_ms": 1000,
            },
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": size,
                "chunk_size": chunk_size,
                "total_chunk_count": total_chunks,
            },
        }
        resp = requests.post(
            f"{TIKTOK_API}/post/publish/video/init/",
            headers=self._headers(),
            json=body,
            timeout=120,
        )
        data = self._parse_init(resp, "FILE_UPLOAD")
        publish_id = data.get("publish_id", "")
        upload_url = data.get("upload_url", "")
        if not publish_id or not upload_url:
            return UploadResult(
                self.name, False, error=f"TikTok FILE init returned no publish_id/upload_url: {data} / {resp.text[:500]}"
            )
        print(f"[tiktok] publish_id {publish_id}, upload_url ready — uploading {total_chunks} chunk(s)...", flush=True)

        # Chunked PUT to the returned upload_url
        try:
            with open(payload.video_path, "rb") as fh:
                for idx in range(total_chunks):
                    fh.seek(idx * chunk_size)
                    chunk = fh.read(chunk_size)
                    start = idx * chunk_size
                    end = start + len(chunk) - 1
                    headers = {
                        "Content-Type": "video/mp4",
                        "Content-Range": f"bytes {start}-{end}/{size}",
                        "Content-Length": str(len(chunk)),
                    }
                    put = requests.put(upload_url, headers=headers, data=chunk, timeout=600)
                    if put.status_code not in (200, 201, 204):
                        return UploadResult(
                            self.name,
                            False,
                            error=f"TikTok chunk {idx + 1}/{total_chunks} upload failed: HTTP {put.status_code} {put.text[:400]}",
                        )
                    pct = int((idx + 1) / total_chunks * 100)
                    print(f"[tiktok]   chunk {idx + 1}/{total_chunks} ({pct}%)", flush=True)
        except Exception as exc:  # noqa: BLE001
            return UploadResult(self.name, False, error=f"TikTok FILE_UPLOAD chunk PUT failed: {exc}")

        print(f"[tiktok] all chunks uploaded — polling status for {publish_id}...", flush=True)
        return self._poll_status(publish_id)

    def _parse_init(self, resp: requests.Response, mode: str) -> dict:
        try:
            body = resp.json()
        except Exception:
            return {}
        # TikTok wraps success as { data: { publish_id, upload_url }, error: { code: ok } }
        err = body.get("error") or {}
        code = err.get("code")
        if code not in (None, "ok", "OK", "", "0"):
            # Surface the real API error; UploadResult will carry it
            raise RuntimeError(f"TikTok {mode} init rejected: {body} (HTTP {resp.status_code})")
        data = body.get("data") or body
        # Some versions nest publish_id directly
        if "publish_id" not in data and "publishId" in data:
            data["publish_id"] = data["publishId"]
        if "upload_url" not in data and "uploadUrl" in data:
            data["upload_url"] = data["uploadUrl"]
        return data

    def _poll_status(self, publish_id: str, timeout_s: float = 20 * 60) -> UploadResult:
        deadline = time.time() + timeout_s
        last_status = ""
        while time.time() < deadline:
            time.sleep(10)
            resp = requests.post(
                f"{TIKTOK_API}/post/publish/status/fetch/",
                headers=self._headers(),
                json={"publish_id": publish_id},
                timeout=30,
            )
            try:
                body = resp.json()
            except Exception:
                body = {"raw": resp.text[:400]}
            data = body.get("data") or body
            status = (data.get("status") or data.get("publish_status") or "").upper()
            # Known statuses: PROCESSING_UPLOAD, PROCESSING, PUBLISH_COMPLETE, FAILED
            if status and status != last_status:
                print(f"[tiktok]   status: {status}", flush=True)
                last_status = status
            if status in ("PUBLISH_COMPLETE", "PUBLISHED", "SUCCESS"):
                # Try to extract a video id / share URL if present
                video_id = data.get("video_id") or data.get("videoId") or ""
                url = f"https://www.tiktok.com/@user/video/{video_id}" if video_id else ""
                # Some responses include share_url directly
                url = data.get("share_url") or data.get("shareUrl") or url
                return UploadResult(self.name, True, url=url, ref_id=publish_id)
            if status in ("FAILED", "PUBLISH_FAILED", "ERROR"):
                return UploadResult(self.name, False, error=f"TikTok publish FAILED: {data} / {body}")
            # If API returns no status but publish_id vanished, treat as still processing
        return UploadResult(self.name, False, error=f"TikTok publish timed out after {timeout_s / 60:.0f} min (publish_id {publish_id}, last status {last_status})")
