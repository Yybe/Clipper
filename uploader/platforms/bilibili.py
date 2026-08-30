"""Bilibili adapter - bilibili-api-python (open source, MIT), cookie credential.

No western scheduler supports Bilibili; this library's video_uploader module
is the actively maintained (2026) open-source client for direct uploads.

One-time setup: log into bilibili.com in your browser, then copy three
cookies from DevTools (Application -> Cookies -> bilibili.com) into .env:
  BILI_SESSDATA=...   BILI_JCT=...   BILI_BUVID3=...
(optional: BILI_DEDEUSERID, BILI_AC_TIME_VALUE for stricter risk control)
"""

import asyncio
import shutil
import subprocess
import tempfile
from pathlib import Path

from .base import CheckLine, ClipPayload, PlatformAdapter, SetupError, UploadResult

CREATE_NO_WINDOW = 0x08000000


def _extract_cover(video_path: Path) -> str | None:
    """Grab a frame at ~1s as the cover, if host ffmpeg exists; else let Bilibili default."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return None
    out = Path(tempfile.gettempdir()) / f"clipper_cover_{video_path.stem[:40]}.jpg"
    try:
        subprocess.run(
            [ffmpeg, "-y", "-ss", "1", "-i", str(video_path), "-frames:v", "1", "-q:v", "3", str(out)],
            capture_output=True,
            timeout=60,
            creationflags=CREATE_NO_WINDOW,
            check=True,
        )
        return str(out)
    except Exception:  # noqa: BLE001 - cover is best-effort
        return None


class BilibiliAdapter(PlatformAdapter):
    name = "bilibili"

    def _credential(self):
        try:
            from bilibili_api import Credential
        except ImportError as exc:
            raise SetupError(
                "bilibili-api missing - run: uploader\\setup-deps.bat (or pip install -r uploader/requirements.txt)"
            ) from exc
        cfg = self.cfg
        if not (cfg.bili_sessdata and cfg.bili_jct and cfg.bili_buvid3):
            raise SetupError(
                "Bilibili is not configured. One-time setup (browser cookies):\n"
                "  1. Log into bilibili.com in your browser\n"
                "  2. DevTools (F12) -> Application -> Cookies -> bilibili.com\n"
                "  3. Copy SESSDATA, bili_jct and buvid3 into the root .env as\n"
                "     BILI_SESSDATA=...  BILI_JCT=...  BILI_BUVID3=...\n"
                "  (optional extras: BILI_DEDEUSERID, BILI_AC_TIME_VALUE)"
            )
        return Credential(
            sessdata=cfg.bili_sessdata,
            bili_jct=cfg.bili_jct,
            buvid3=cfg.bili_buvid3,
            buvid4=cfg.bili_buvid4 or None,
            dedeuserid=cfg.bili_dedeuserid or None,
            ac_time_value=cfg.bili_ac_time_value or None,
        )

    def check(self):
        cred = self._credential()

        async def _probe():
            from bilibili_api import user

            return await user.get_self_info(credential=cred)

        try:
            info = asyncio.run(_probe())
        except Exception as exc:  # noqa: BLE001
            raise SetupError(
                f"Bilibili cookies rejected ({exc}). Re-export fresh SESSDATA / bili_jct / buvid3 "
                "(they expire; also check BILI_DEDEUSERID)."
            ) from exc
        name = info.get("name", "?")
        mid = info.get("mid", "?")
        return [
            CheckLine(True, f"Bilibili: cookies valid, uploading as '{name}' (uid {mid})"),
            CheckLine(
                True,
                f"Bilibili: tid={self.cfg.bili_tid}, tags={self.cfg.bili_tags or '(default)'}, "
                f"original={self.cfg.bili_original}",
            ),
        ]

    def dry_run(self, payload: ClipPayload):
        cover = "(auto-extract first frame if ffmpeg present)" if shutil.which("ffmpeg") else "(none - ffmpeg missing)"
        size_mb = payload.video_path.stat().st_size / 1_048_576
        return [
            f"[bilibili] file: {payload.video_path.name} ({size_mb:.1f} MB) -> bilibili-api video_uploader",
            f"[bilibili] title ({len(payload.title)} ch): {payload.title}",
            f"[bilibili] desc: {payload.description[:160]}{'...' if len(payload.description) > 160 else ''}",
            f"[bilibili] tags: {', '.join(payload.tags) if payload.tags else '(default)'}",
            f"[bilibili] zone tid={self.cfg.bili_tid}, cover: {cover}, original={self.cfg.bili_original}",
        ]

    def upload(self, payload: ClipPayload) -> UploadResult:
        cred = self._credential()

        async def _run():
            from bilibili_api.video_uploader import VideoMeta, VideoUploader, VideoUploaderPage

            meta = VideoMeta(
                tid=self.cfg.bili_tid,
                title=payload.title[:80],
                desc=payload.description[:2000],
                cover=_extract_cover(payload.video_path) or "",
                tags=payload.tags,
                original=self.cfg.bili_original,
                source=self.cfg.bili_source,
            )
            page = VideoUploaderPage(path=str(payload.video_path), title=payload.title[:80], description="")
            uploader = VideoUploader([page], meta, credential=cred)
            return await uploader.start()

        try:
            result = asyncio.run(_run())
        except Exception as exc:  # noqa: BLE001 - bilibili errors are str-rich
            return UploadResult(self.name, False, error=str(exc))
        bvid = (result or {}).get("bvid", "")
        aid = (result or {}).get("aid", "")
        url = f"https://www.bilibili.com/video/{bvid}" if bvid else ""
        return UploadResult(self.name, True, url=url, ref_id=f"BV:{bvid} aid:{aid}")
