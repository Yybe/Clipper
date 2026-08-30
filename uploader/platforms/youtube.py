"""YouTube adapter - official Data API v3, OAuth desktop flow, resumable upload.

Free quota: 10,000 units/day; videos.insert costs 1,600 units (reported ~100
since Dec 2025) -> at least ~6 clips/day with no third-party in the loop.
One-time setup: Google Cloud project -> enable YouTube Data API v3 ->
OAuth client (Desktop app) -> client_secrets.json in uploader/credentials ->
`python -m uploader login --platform youtube` (opens the browser once).
"""

import time
from pathlib import Path

from .base import CheckLine, ClipPayload, PlatformAdapter, SetupError, UploadResult

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]


class YouTubeAdapter(PlatformAdapter):
    name = "youtube"

    def _credentials(self):
        try:
            from google.oauth2.credentials import Credentials
        except ImportError as exc:
            raise SetupError(
                "google libs missing - run: uploader\\setup-deps.bat (or pip install -r uploader/requirements.txt)"
            ) from exc
        token_path: Path = self.cfg.yt_token
        if token_path.exists():
            return Credentials.from_authorized_user_file(str(token_path), SCOPES)
        return None

    def _authorize(self):
        """Load or refresh stored credentials; run the browser flow only if `interactive`."""
        from google.auth.transport.requests import Request

        creds = self._credentials()
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            creds.to_json(self.cfg.yt_token)
        if not creds or not creds.valid:
            raise SetupError(
                f"No valid YouTube OAuth token at {self.cfg.yt_token}. One-time setup:\n"
                "  1. Google Cloud Console -> enable 'YouTube Data API v3'\n"
                "  2. Credentials -> OAuth client ID -> Desktop app -> download JSON\n"
                f"  3. Save it as {self.cfg.yt_client_secrets}\n"
                "  4. Run: uploader.bat login --platform youtube"
            )
        return creds

    def login_interactive(self) -> str:
        """One-time browser consent flow; stores the refresh token for future runs."""
        from google.auth.transport.requests import Request
        from google_auth_oauthlib.flow import InstalledAppFlow

        if not self.cfg.yt_client_secrets.exists():
            raise SetupError(
                f"client_secrets.json not found at {self.cfg.yt_client_secrets}. "
                "Download an OAuth 'Desktop app' client from Google Cloud Console "
                "(APIs & Services -> Credentials) and save it there."
            )
        flow = InstalledAppFlow.from_client_secrets_file(str(self.cfg.yt_client_secrets), SCOPES)
        creds = flow.run_local_server(port=0, prompt="consent")
        self.cfg.yt_token.parent.mkdir(parents=True, exist_ok=True)
        creds.to_json(self.cfg.yt_token)
        who = self._channel_title(creds)
        return f"YouTube authorized ({who}). Token saved to {self.cfg.yt_token}"

    def _youtube(self, creds):
        import googleapiclient.discovery

        return googleapiclient.discovery.build("youtube", "v3", credentials=creds, cache_discovery=False)

    def _channel_title(self, creds) -> str:
        yt = self._youtube(creds)
        resp = yt.channels().list(part="snippet", mine=True).execute()
        items = resp.get("items") or []
        return items[0]["snippet"]["title"] if items else "(unknown channel)"

    def check(self):
        creds = self._credentials()
        if creds is None:
            raise SetupError(
                f"No YouTube OAuth token at {self.cfg.yt_token}. One-time setup:\n"
                "  1. Google Cloud Console -> enable 'YouTube Data API v3'\n"
                "  2. Credentials -> OAuth client ID -> Desktop app -> download JSON\n"
                f"  3. Save it as {self.cfg.yt_client_secrets}\n"
                "  4. Run: uploader.bat login --platform youtube"
            )
        from google.auth.transport.requests import Request

        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            creds.to_json(self.cfg.yt_token)
        try:
            who = self._channel_title(creds)
        except Exception as exc:  # noqa: BLE001 - surface the real API error
            raise SetupError(f"YouTube token exists but the API rejected it: {exc}") from exc
        return [
            CheckLine(True, f"YouTube: OAuth token valid, posting as '{who}'"),
            CheckLine(True, f"YouTube: privacy={self.cfg.yt_privacy}, categoryId={self.cfg.yt_category_id}"),
        ]

    def dry_run(self, payload: ClipPayload):
        size_mb = payload.video_path.stat().st_size / 1_048_576
        return [
            f"[youtube] file: {payload.video_path.name} ({size_mb:.1f} MB) -> official Data API v3 upload",
            f"[youtube] title ({len(payload.title)} ch): {payload.title}",
            f"[youtube] description: {payload.description[:160]}{'...' if len(payload.description) > 160 else ''}",
            f"[youtube] tags: {', '.join(payload.tags) if payload.tags else '(none)'}",
            f"[youtube] status: privacyStatus={self.cfg.yt_privacy}, selfDeclaredMadeForKids=False",
        ]

    def upload(self, payload: ClipPayload) -> UploadResult:
        from googleapiclient.errors import HttpError
        from googleapiclient.http import MediaFileUpload

        creds = self._authorize()
        yt = self._youtube(creds)
        body = {
            "snippet": {
                "title": payload.title[:100],
                "description": payload.description[:5000],
                "tags": payload.tags[:30],
                "categoryId": self.cfg.yt_category_id,
            },
            "status": {
                "privacyStatus": self.cfg.yt_privacy,
                "selfDeclaredMadeForKids": False,
                "notifySubscribers": True,
            },
        }
        media = MediaFileUpload(
            str(payload.video_path), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True
        )
        request = yt.videos().insert(part="snippet,status", body=body, media_body=media)
        response = None
        last_pct = -10
        while response is None:
            try:
                status, response = request.next_chunk(num_retries=3)
            except Exception as exc:  # noqa: BLE001
                return UploadResult(self.name, False, error=str(exc))
            if status:
                pct = int(status.progress() * 100)
                if pct >= last_pct + 10:
                    last_pct = pct
                    print(f"[youtube]   {pct}% uploaded", flush=True)
        video_id = response.get("id", "")
        url = f"https://youtube.com/shorts/{video_id}" if video_id else ""
        return UploadResult(self.name, True, url=url, ref_id=video_id)
