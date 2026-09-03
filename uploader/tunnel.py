"""Shared public-URL helper: expose localhost:8000 via a free Cloudflare quick tunnel.

Meta (IG) and TikTok PULL_FROM_URL both require a public video_url, so three
adapters share this one implementation. If IG_PUBLIC_BASE_URL (or any
platform-specific override) is set, that base is used instead and no tunnel
is started.
"""

import re
import shutil
import subprocess
import time

from .platforms.base import SetupError

CREATE_NO_WINDOW = 0x08000000


class QuickTunnel:
    """A temporary free Cloudflare tunnel exposing the OpenShorts backend."""

    def __init__(self, binary: str, target: str):
        self.binary = binary
        self.target = target
        self.proc = None
        self.base_url = ""

    def start(self, timeout: float = 45.0) -> str:
        if not shutil.which(self.binary):
            raise SetupError(
                f"cloudflared not found ('{self.binary}'). Install it (winget install Cloudflare.cloudflared) "
                "or set a permanent public base URL (e.g. IG_PUBLIC_BASE_URL / TIKTOK_PUBLIC_BASE_URL / FB_PUBLIC_BASE_URL) "
                "that proxies http://localhost:8000."
            )
        self.proc = subprocess.Popen(
            [self.binary, "tunnel", "--url", self.target, "--no-autoupdate"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            creationflags=CREATE_NO_WINDOW,
        )
        deadline = time.time() + timeout
        while time.time() < deadline and self.proc.poll() is None:
            line = self.proc.stdout.readline()
            match = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", line or "")
            if match:
                self.base_url = match.group(0)
                return self.base_url
        self.stop()
        raise SetupError(
            "Could not start a Cloudflare quick tunnel (is 'cloudflared' installed and on PATH? "
            "`winget install Cloudflare.cloudflared`, or set a public base URL). "
            "The tunnel prints its URL on stdout - check the line above for clues."
        )

    def stop(self):
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.proc.kill()
        self.proc = None
