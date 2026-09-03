"""Configuration: root .env is the single source of truth (no hardcoded keys)."""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = Path(__file__).resolve().parent
CRED_DIR = UPLOAD_DIR / "credentials"
LEDGER_PATH = CRED_DIR / "ledger.json"
POSTS_DIR = ROOT / "posts"


def load_env(path: Path | None = None) -> dict:
    """Parse the root .env (KEY=VALUE lines, quotes stripped, # comments kept)."""
    path = path or (ROOT / ".env")
    env: dict = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        value = value.strip().strip('"').strip("'")
        if value:
            env[key.strip()] = value
    return env


class Config:
    """Resolved settings for the uploader CLI + adapters."""

    def __init__(self, env: dict | None = None):
        self.env = env if env is not None else load_env()
        self.api_base = self.env.get("OPENSHORTS_API_URL", "http://localhost:8000").rstrip("/")
        self.gemini_key = self.env.get("GEMINI_API_KEY", "")

        # YouTube (official Data API v3, OAuth desktop flow)
        self.yt_client_secrets = Path(
            self.env.get("YOUTUBE_CLIENT_SECRETS", str(CRED_DIR / "client_secrets.json"))
        )
        self.yt_token = CRED_DIR / "youtube_token.json"
        self.yt_category_id = self.env.get("YT_CATEGORY_ID", "20")  # 20 = Gaming
        self.yt_privacy = self.env.get("YT_PRIVACY_STATUS", "public")

        # Instagram (official Meta Graph API, Reels publish)
        self.ig_access_token = self.env.get("IG_ACCESS_TOKEN", "")
        self.ig_user_id = self.env.get("IG_USER_ID", "")
        self.ig_graph_version = self.env.get("IG_GRAPH_VERSION", "v23.0")
        self.ig_public_base_url = self.env.get("IG_PUBLIC_BASE_URL", "").rstrip("/")
        self.ig_cloudflared = self.env.get("IG_CLOUDFLARED_PATH", "cloudflared")

        # Bilibili (bilibili-api-python, cookie credential)
        self.bili_sessdata = self.env.get("BILI_SESSDATA", "")
        self.bili_jct = self.env.get("BILI_JCT", "")
        self.bili_buvid3 = self.env.get("BILI_BUVID3", "")
        self.bili_buvid4 = self.env.get("BILI_BUVID4", "")
        self.bili_dedeuserid = self.env.get("BILI_DEDEUSERID", "")
        self.bili_ac_time_value = self.env.get("BILI_AC_TIME_VALUE", "")
        self.bili_tid = int(self.env.get("BILI_TID", "21"))  # 21 = daily-life
        self.bili_tags = self.env.get("BILI_TAGS", "")
        self.bili_original = self.env.get("BILI_ORIGINAL", "1") == "1"
        self.bili_source = self.env.get("BILI_SOURCE", "")

        # Facebook (official Graph API, Page video/Reels — same app as Instagram)
        self.fb_page_id = self.env.get("FB_PAGE_ID", "")
        self.fb_page_access_token = self.env.get("FB_PAGE_ACCESS_TOKEN", "")
        # Reuse IG token as fallback if a dedicated Page token is not set
        if not self.fb_page_access_token and self.env.get("FB_ACCESS_TOKEN", ""):
            self.fb_page_access_token = self.env.get("FB_ACCESS_TOKEN", "")
        self.fb_graph_version = self.env.get("FB_GRAPH_VERSION", self.env.get("IG_GRAPH_VERSION", "v23.0"))
        self.fb_public_base_url = self.env.get("FB_PUBLIC_BASE_URL", "").rstrip("/")

        # TikTok (official Content Posting API — PULL_FROM_URL + FILE_UPLOAD)
        self.tiktok_client_key = self.env.get("TIKTOK_CLIENT_KEY", "")
        self.tiktok_client_secret = self.env.get("TIKTOK_CLIENT_SECRET", "")
        self.tiktok_access_token = self.env.get("TIKTOK_ACCESS_TOKEN", "")
        self.tiktok_refresh_token = self.env.get("TIKTOK_REFRESH_TOKEN", "")
        self.tiktok_open_id = self.env.get("TIKTOK_OPEN_ID", "")
        self.tiktok_privacy_level = self.env.get("TIKTOK_PRIVACY_LEVEL", "SELF_ONLY")
        self.tiktok_public_base_url = self.env.get("TIKTOK_PUBLIC_BASE_URL", "").rstrip("/")
        # FILE_UPLOAD chunk size; TikTok allows 1-64 MB, default 10 MB
        try:
            self.tiktok_chunk_size = int(self.env.get("TIKTOK_CHUNK_SIZE", str(10 * 1024 * 1024)))
        except ValueError:
            self.tiktok_chunk_size = 10 * 1024 * 1024

        self.default_platforms = [
            p.strip()
            for p in self.env.get("POST_PLATFORMS", "youtube,instagram,bilibili").split(",")
            if p.strip()
        ]

    def has(self, key: str) -> bool:
        return bool(self.env.get(key, ""))


def setup_console() -> None:
    """Keep CLI output readable on Windows consoles (cp1252 / GBK fallbacks)."""
    import sys

    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
