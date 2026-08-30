"""Platform adapter registry."""

from .base import CheckLine, ClipPayload, PlatformAdapter, SetupError, UploadResult
from .bilibili import BilibiliAdapter
from .instagram import InstagramAdapter
from .youtube import YouTubeAdapter

ADAPTERS = {
    "youtube": YouTubeAdapter,
    "instagram": InstagramAdapter,
    "bilibili": BilibiliAdapter,
}

__all__ = [
    "ADAPTERS",
    "BilibiliAdapter",
    "CheckLine",
    "ClipPayload",
    "InstagramAdapter",
    "PlatformAdapter",
    "SetupError",
    "UploadResult",
    "YouTubeAdapter",
]
