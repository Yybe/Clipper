"""Clipper Uploader - self-hosted, unlimited multi-platform posting.

Replaces the Upload-Post free tier (10 uploads/month cap) with direct
per-platform integrations, all running on this machine:

  - YouTube:  official Data API v3 (OAuth desktop flow, resumable upload)
  - Instagram: official Meta Graph API (Reels container -> media_publish)
  - Bilibili: bilibili-api-python (cookie credential, video_uploader)

No single open-source scheduler (Postiz, Mixpost, Upload-Post, ...) supports
Bilibili, so this composes the strongest open-source client per platform into
one orchestrator with a shared dry-run gate, state ledger and setup checks.
"""

__version__ = "1.0.0"
