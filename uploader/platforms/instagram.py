"""Instagram adapter - official Meta Graph API Reels publish (no third party, no cap).

Flow: create a media container (media_type=REELS, video_url=<PUBLIC url>) ->
poll until FINISHED -> media_publish -> fetch permalink.

The Graph API requires the video to be reachable at a public URL, so this
adapter publishes the clip that the OpenShorts backend already serves at
http://localhost:8000/videos/... through a free Cloudflare quick tunnel
(cloudflared, no account needed) unless IG_PUBLIC_BASE_URL is set.

One-time setup: Meta developer app + Instagram Business/Creator account,
Instagram API product added, long-lived access token -> .env:
  IG_ACCESS_TOKEN=...   IG_USER_ID=...
(Steps in README "Instagram setup".)
"""

import re
import shutil
import subprocess
import time
import urllib.parse
import urllib.request

import requests

from .base import CheckLine, ClipPayload, PlatformAdapter, SetupError, UploadResult

CREATE_NO_WINDOW = 0x08000000  # keep cloudflared quiet on Windows


class QuickTunnel:
    """A temporary free Cloudflare tunnel exposing the OpenShorts backend."""

    def __init__(self, binary: str, target: str):
        self.binary = binary
        self.target = target
        self.proc = None
        self.base_url = ""

    def start(self, timeout: float = 45.0) -> str:
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
            "`winget install Cloudflare.cloudflared`, or set IG_CLOUDFLARED_PATH). "
            "Alternatively set IG_PUBLIC_BASE_URL to your own public tunnel/domain."
        )

    def stop(self):
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.proc.kill()
        self.proc = None


class InstagramAdapter(PlatformAdapter):
    name = "instagram"

    def _requirements(self):
        if not self.cfg.ig_access_token or not self.cfg.ig_user_id:
            raise SetupError(
                "Instagram is not configured. One-time setup (official Graph API, no third party):\n"
                "  1. developers.facebook.com -> Create App -> 'Business' type\n"
                "  2. Add product 'Instagram Graph API' (your IG account must be\n"
                "     Business/Creator; convert free in the Instagram app)\n"
                "  3. Graph API Explorer -> generate a user token with\n"
                "     instagram_basic + instagram_content_publish + pages_show_list,\n"
                "     then exchange it for a long-lived token (README has the exact curl)\n"
                "  4. Put IG_ACCESS_TOKEN=<long-lived token> and IG_USER_ID=<ig account id> in .env"
            )

    def check(self):
        self._requirements()
        graph = f"https://graph.facebook.com/{self.cfg.ig_graph_version}"
        try:
            resp = requests.get(
                f"{graph}/{self.cfg.ig_user_id}",
                params={"fields": "username", "access_token": self.cfg.ig_access_token},
                timeout=30,
            ).json()
        except Exception as exc:  # noqa: BLE001
            raise SetupError(f"Cannot reach the Graph API: {exc}") from exc
        if "username" not in resp:
            raise SetupError(f"Instagram token/user rejected by the Graph API: {resp}")

        lines = [
            CheckLine(True, f"Instagram: token valid, publishing as @{resp['username']} (id {self.cfg.ig_user_id})")
        ]
        if self.cfg.ig_public_base_url:
            lines.append(CheckLine(True, f"Instagram: public base URL configured ({self.cfg.ig_public_base_url})"))
        elif shutil.which(self.cfg.ig_cloudflared):
            lines.append(CheckLine(True, "Instagram: cloudflared available (auto quick-tunnel for Reels publish)"))
        else:
            lines.append(
                CheckLine(
                    False,
                    "Instagram: cloudflared NOT found - IG publish needs it (or set IG_PUBLIC_BASE_URL). "
                    "Install: winget install Cloudflare.cloudflared",
                )
            )
        return lines

    def _ensure_public_url(self, video_url: str) -> str:
        """Return a public URL for the backend-served clip (tunnel if needed)."""
        if self.cfg.ig_public_base_url:
            return self.cfg.ig_public_base_url + video_url
        self.tunnel = QuickTunnel(self.cfg.ig_cloudflared, "http://localhost:8000")
        base = self.tunnel.start()
        return base + video_url

    def dry_run(self, payload: ClipPayload):
        lines = [
            f"[instagram] Reels publish via Graph API (official), account id {self.cfg.ig_user_id or '(NOT SET)'}",
            f"[instagram] caption: {payload.description[:160]}{'...' if len(payload.description) > 160 else ''}",
        ]
        if self.cfg.ig_public_base_url and payload.video_public_url:
            lines.append(f"[instagram] video_url: {payload.video_public_url}")
        else:
            lines.append(
                "[instagram] video_url: backend /videos path, exposed via auto Cloudflare quick-tunnel at post time"
            )
        lines.append("[instagram] flow: media container (REELS) -> poll FINISHED -> media_publish -> permalink")
        return lines

    def upload(self, payload: ClipPayload) -> UploadResult:
        self._requirements()
        self.tunnel = None
        try:
            public_url = self._ensure_public_url(payload.video_public_url or "")
            print(f"[instagram] public video url: {public_url}", flush=True)
            graph = f"https://graph.facebook.com/{self.cfg.ig_graph_version}"
            params = {"access_token": self.cfg.ig_access_token}

            # 1. create the Reels container
            resp = requests.post(
                f"{graph}/{self.cfg.ig_user_id}/media",
                params={
                    **params,
                    "media_type": "REELS",
                    "video_url": public_url,
                    "caption": payload.description[:2200],
                    "share_to_feed": "true",
                },
                timeout=120,
            )
            body = resp.json()
            if resp.status_code != 200 or "id" not in body:
                return UploadResult(self.name, False, error=f"container create failed: {body}")
            container_id = body["id"]
            print(f"[instagram] container {container_id} created; polling until processed...", flush=True)

            # 2. poll until the container is FINISHED (Meta fetches + transcodes the video)
            deadline = time.time() + 20 * 60
            while time.time() < deadline:
                time.sleep(15)
                status = requests.get(
                    f"{graph}/{container_id}", params={**params, "fields": "status_code,status"}, timeout=60
                ).json()
                code = status.get("status_code", "")
                print(f"[instagram]   status: {code}", flush=True)
                if code == "FINISHED":
                    break
                if code in ("ERROR", "EXPIRED"):
                    return UploadResult(self.name, False, error=f"container {code}: {status.get('status')}")
            else:
                return UploadResult(self.name, False, error="container processing timed out (20 min)")

            # 3. publish + 4. permalink
            published = requests.post(
                f"{graph}/{self.cfg.ig_user_id}/media_publish",
                params={**params, "creation_id": container_id},
                timeout=120,
            ).json()
            media_id = published.get("id", "")
            if not media_id:
                return UploadResult(self.name, False, error=f"media_publish failed: {published}")
            permalink = requests.get(
                f"{graph}/{media_id}", params={**params, "fields": "permalink"}, timeout=60
            ).json()
            return UploadResult(self.name, True, url=permalink.get("permalink", ""), ref_id=media_id)
        finally:
            if self.tunnel:
                self.tunnel.stop()
