"""Platform adapter contract shared by youtube / instagram / bilibili."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path


class SetupError(Exception):
    """Raised when a platform is not configured yet - message = user instructions."""


@dataclass
class ClipPayload:
    platform: str
    title: str
    description: str
    tags: list
    video_path: Path
    video_public_url: str | None  # only Instagram needs a public URL
    hook: str
    score: str
    job_id: str
    clip_index: int


@dataclass
class UploadResult:
    platform: str
    ok: bool
    url: str = ""
    ref_id: str = ""
    error: str = ""


@dataclass
class CheckLine:
    ok: bool
    text: str


class PlatformAdapter(ABC):
    name: str = ""

    def __init__(self, cfg):
        self.cfg = cfg

    @abstractmethod
    def check(self) -> list:
        """Non-destructive credential/readiness check. Raises SetupError if unconfigured."""

    @abstractmethod
    def dry_run(self, payload: ClipPayload) -> list:
        """Lines describing exactly what a real post would do."""

    @abstractmethod
    def upload(self, payload: ClipPayload) -> UploadResult:
        """Perform the real upload."""
