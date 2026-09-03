"""Platform adapter registry."""

from .base import CheckLine, ClipPayload, PlatformAdapter, SetupError, UploadResult
from .bilibili import BilibiliAdapter
from .facebook import FacebookAdapter
from .instagram import InstagramAdapter
from .tiktok import TikTokAdapter
from .youtube import YouTubeAdapter

ADAPTERS = {
    "youtube": YouTubeAdapter,
    "instagram": InstagramAdapter,
    "bilibili": BilibiliAdapter,
    "facebook": FacebookAdapter,
    "tiktok": TikTokAdapter,
}

__all__ = [
    "ADAPTERS",
    "BilibiliAdapter",
    "CheckLine",
    "ClipPayload",
    "FacebookAdapter",
    "InstagramAdapter",
    "PlatformAdapter",
    "SetupError",
    "TikTokAdapter",
    "UploadResult",
    "YouTubeAdapter",
]
