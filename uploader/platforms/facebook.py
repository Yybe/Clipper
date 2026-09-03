"""Facebook adapter — official Graph API Page video upload (Reels-capable).

Flow: direct file upload to `/{page-id}/videos` with the Page access token.
This is the same Graph app that already powers Instagram — no third party,
no monthly cap. Reels published this way appear as Page Reels when the
Page's Reels surface is enabled; otherwise they appear as Page videos
(both count as vertical video). No public URL / tunnel needed — the file
is POSTed directly.

One-time setup:
  1. Same Meta app as Instagram (developers.facebook.com, Business type,
     with a Facebook Page linked).
  2. Graph API Explorer (or the App dashboard) — generate a **Page** access
     token for that Page with `pages_show_list` + `pages_read_engagement` +
     `publish_video` / `pages_manage_posts`.
  3. Put `FB_PAGE_ID=<page id>` and `FB_PAGE_ACCESS_TOKEN=<page token>` in
     the root `.env` (or `FB_ACCESS_TOKEN` as an alias). Optionally
     `FB_GRAPH_VERSION=v23.0` to pin the version.

If the Page token is a long-lived user token that still needs exchanging,
reuse the IG long-lived exchange — the Page token inherits the lifetime.
"""

import requests

from .base import CheckLine, ClipPayload, PlatformAdapter, SetupError, UploadResult


class FacebookAdapter(PlatformAdapter):
    name = "facebook"

    def _requirements(self):
        if not self.cfg.fb_page_id or not self.cfg.fb_page_access_token:
            raise SetupError(
                "Facebook is not configured. One-time setup (official Graph API, Page video):\n"
                "  1. Same Meta app as Instagram (developers.facebook.com, Business type)\n"
                "     Link a Facebook Page to the app (App Settings -> Business -> Pages)\n"
                "  2. Graph API Explorer -> select that Page -> generate a Page token with\n"
                "     pages_show_list + pages_read_engagement + publish_video + pages_manage_posts\n"
                "     (or exchange a user token for a Page token via /{page-id}?fields=access_token)\n"
                "  3. Put FB_PAGE_ID=<page id> and FB_PAGE_ACCESS_TOKEN=<page token> in .env\n"
                "     (FB_ACCESS_TOKEN is accepted as an alias for the token)\n"
                "  Optional: FB_GRAPH_VERSION=v23.0"
            )

    def check(self):
        self._requirements()
        graph = f"https://graph.facebook.com/{self.cfg.fb_graph_version}"
        # Validate token + Page by fetching the Page's name
        try:
            resp = requests.get(
                f"{graph}/{self.cfg.fb_page_id}",
                params={"fields": "name,username", "access_token": self.cfg.fb_page_access_token},
                timeout=30,
            ).json()
        except Exception as exc:  # noqa: BLE001
            raise SetupError(f"Cannot reach the Graph API: {exc}") from exc
        if "name" not in resp:
            raise SetupError(f"Facebook Page token/Page ID rejected by the Graph API: {resp}")
        page_name = resp.get("name", "?")
        username = resp.get("username", "")
        who = f"{page_name} (@{username})" if username else page_name
        return [
            CheckLine(True, f"Facebook: token valid, Page '{who}' (id {self.cfg.fb_page_id})"),
            CheckLine(True, f"Facebook: Graph {self.cfg.fb_graph_version}, direct file upload (no tunnel needed)"),
        ]

    def dry_run(self, payload: ClipPayload):
        size_mb = payload.video_path.stat().st_size / 1_048_576 if payload.video_path.exists() else 0
        return [
            f"[facebook] file: {payload.video_path.name} ({size_mb:.1f} MB) -> Graph API /{self.cfg.fb_page_id or 'PAGE_ID'}/videos (direct upload)",
            f"[facebook] title ({len(payload.title)} ch): {payload.title}",
            f"[facebook] description: {payload.description[:160]}{'...' if len(payload.description) > 160 else ''}",
            "[facebook] flow: POST multipart source=@file + title + description -> video id -> https://www.facebook.com/reel/<id>",
        ]

    def upload(self, payload: ClipPayload) -> UploadResult:
        self._requirements()
        graph = f"https://graph.facebook.com/{self.cfg.fb_graph_version}"
        url = f"{graph}/{self.cfg.fb_page_id}/videos"
        # Title is optional on FB; description is the caption.
        # Keep within FB limits (title ~255, description ~5000).
        title = (payload.title or "")[:255]
        description = (payload.description or "")[:5000]
        try:
            with open(payload.video_path, "rb") as fh:
                files = {"source": (payload.video_path.name, fh, "video/mp4")}
                data = {
                    "access_token": self.cfg.fb_page_access_token,
                    "title": title,
                    "description": description,
                }
                resp = requests.post(url, data=data, files=files, timeout=600)
                body = resp.json()
        except Exception as exc:  # noqa: BLE001
            return UploadResult(self.name, False, error=f"Facebook upload request failed: {exc}")

        if resp.status_code not in (200, 201) or "id" not in body:
            return UploadResult(self.name, False, error=f"Facebook upload rejected: {body} (HTTP {resp.status_code})")

        video_id = body.get("id", "")
        # Reels permalink form; falls back to Page video URL
        permalink = f"https://www.facebook.com/reel/{video_id}" if video_id else ""
        return UploadResult(self.name, True, url=permalink, ref_id=video_id)
