# Clipper — Automated Faceless Clipping & Posting System

Self-hosted, end-to-end pipeline built on **OpenShorts** (`mutonby/openshorts`,
MIT core): long video in → transcribed → AI highlight detection → 9:16
face-tracked crop → burned captions → **human review gate** → scheduled
publishing to **YouTube Shorts / Instagram Reels / Facebook Reels / TikTok / Bilibili**
(self-hosted `uploader/` — no vendor cap; Upload-Post kept as a fallback).

Test niche: **GTA 6 hype content**. The pipeline is niche-agnostic — the same
setup works for any long-form source after the niche is validated.

**Status: OpenShorts installed via Docker (backend/frontend/renderer all up,
UI on :5175, API on :8000). Pipeline confirmed working END-TO-END on a GTA6
long-form source: IGN's "89 Details From GTA 6 Trailer 2" (18 min,
`JmKZUB1NBag`) ran download → faster-whisper transcription → Gemini moment
scoring → face-tracked 9:16 crop → burned captions in ~14 min, producing
5 ranked candidates (scores 85/80/75/70/65, timestamps + viral hooks +
per-platform titles/descriptions) and finished 1080x1920 MP4s in the review
queue (`openshorts/output/e332c2dd-ceb4-40a7-85a8-48f3d69e49da/`). An 83s
smoke-test (`2ApLx29sKxM`) also completed. The original IShowSpeed test URL
(`miGclAow9KI`) is age-restricted by YouTube and still needs cookies — see
below.**

**Update 2026-08-30 (later):** posting is **self-hosted now** — the new
`uploader\` tool posts each clip straight to **YouTube, Instagram, Bilibili,
Facebook and TikTok** (Facebook + TikTok added 2026-09-03) with **no monthly
cap**: `uploader.bat post --job <id> --clip <N> --post`. One-time
credentials per platform (README section below). Dry-run by default, same
human gate as always. The Upload-Post path (`post-clip.bat`) stays wired as
a paid-tier fallback.

**Update 2026-08-30:** the *verified viral format* profile is wired and
one-command (`viral-clip.bat <url>` — hook overlay, 15–34 s band, punch-ins,
auto layouts, loop-aware scoring prompts; see **PLAN.md** for the format
spec + verification log). **Posting went LIVE via Upload-Post**: the first
clip is already published (two more scheduled). That free tier capped at
**10 uploads/month** and had no Bilibili — which is exactly why the
self-hosted `uploader\` above exists now. Every successful post also saves a
clean-named copy to `posts\`.

## Test source URL

```
https://www.youtube.com/watch?v=miGclAow9KI   # "REACTING TO THE NEW GTA 6 TRAILER! LIVE🔴" — IShowSpeed, 57 min
```

## Stack

| Piece | Choice |
|---|---|
| Core engine | OpenShorts — self-hosted Docker, MIT core (no openshorts.app cloud tier) |
| Bundled inside it | yt-dlp, faster-whisper, YOLOv8, mediapipe, FFmpeg, google-genai |
| AI moment scoring | Gemini `gemini-2.5-flash-lite` (free tier) — the only paid dependency |
| Publishing | **Self-hosted `uploader\`** — official YouTube Data API v3 + official Meta Graph API (IG Reels + FB Page video) + TikTok Content Posting API + `bilibili-api-python`, no monthly cap. Upload-Post kept as a paid-tier fallback |
| Review gate | Dry-run-by-default posting CLI — nothing uploads without an explicit `--post` + `--clip` |

## Built on OpenShorts — attribution & what we changed

This project is **built on [OpenShorts](https://github.com/mutonby/openshorts)** by
mutonby (MIT license, kept in `openshorts/LICENSE`) — a self-hosted Docker
pipeline: yt-dlp ingest → faster-whisper transcription → Gemini highlight
scoring → 9:16 face-tracked reframe (YOLOv8/mediapipe) → burned karaoke
captions → review queue → Upload-Post publishing. The engine lives in
`openshorts/` (absorbed into this repo, with its own git history removed).

**Local changes on top of upstream** (the fork-with-patches layer):

| Change | Where | Why it's better |
|---|---|---|
| **Source-resolution cap** `MAX_SOURCE_HEIGHT` (deployment default 720p) + per-job `max_source_height` API field | `openshorts/main.py`, `openshorts/app.py`, root `.env` | Twitch 1080p60 HLS downloads wedged 15+ min on flaky networks; the cap makes every download land reliably while finished clips still deliver 1080×1920 (upscale floor) |
| **Cookies fallback** — a bind-mounted `cookies.txt` works even when the `YOUTUBE_COOKIES` env var is unset | `openshorts/main.py` | Age-gated/signed-in sources without pushing 500 KB of cookie text through an env var |
| **Root `.env` as single source of truth** — docker-compose `env_file` includes `../.env` | `openshorts/docker-compose.yml` | One file holds all real keys for both the engine and the outer tooling |
| **Loop-aware scoring prompts** — `LOOP RULE` (end within ~1 s of the payoff, trim dead air) + rewatch as a scoring criterion | `openshorts/gemini_worker.py` | Clips follow the verified viral structure (hook → payoff → seamless loop) instead of trailing off |
| **One-command viral format** (`viral-job.ps1` / `viral-clip.bat`): burned hook overlay, 15–34 s band, punch-ins, auto layouts, per-job controls | `scripts/`, `*.bat` | The 2026 retention levers are applied per job by default, not hidden behind config |
| **Posting workflow with a hard human gate**: dry-run listing by default, `-Yes` for scripted runs, scheduled posts, clean-named `posts\` export of everything actually posted | `scripts/post-clip.ps1` | Safe to keep logged in; clip files become findable (`2026-08-30_gta-6-every-confirmed-mini-game-so-far_85.mp4`) |
| **Target platform set**: YouTube + Instagram + Bilibili + Facebook + TikTok auto-post (all self-hosted) | `scripts/`, `uploader/`, PLAN.md | All five via `uploader/` — TikTok restored via official Content Posting API |
| **Self-hosted unlimited posting** (`uploader\` package + `uploader.bat`): official YouTube Data API v3 (OAuth), official Meta Graph API (IG Reels + FB Page video, auto quick-tunnel), TikTok Content Posting API (PULL_FROM_URL + FILE_UPLOAD), bilibili-api-python cookie uploads — replaces the Upload-Post 10/month cap and automates Bilibili/Facebook/TikTok | `uploader/`, `uploader.bat` | No vendor cap, no third party in the loop; same human gate (dry-run default, `--post` + specific `--clip`); append-only JSON ledger of every attempt |

Everything else — transcription, face tracking, caption rendering, layout
engines — is upstream OpenShorts, unchanged. Patches are documented in
**[PLAN.md](PLAN.md)** (verification log) so they can be re-applied when
pulling upstream updates.

## Layout

```
.env            real keys (gitignored): GEMINI_API_KEY, UPLOAD_POST_API_KEY,
                IG_ACCESS_TOKEN, BILI_SESSDATA, ... (uploader keys too)
.env.example    documented template — copy to .env
openshorts/     the engine itself (cloned from mutonby/openshorts; has its own git history)
postiz/         local Postiz scheduler stack (docker compose) + .env.example; secrets in gitignored postiz/.env
uploader/       self-hosted posting legs: YouTube API / IG+FB Graph API / TikTok API / Bilibili (own venv)
uploader.bat    the unlimited multi-platform posting CLI (dry-run by default, 5 platforms)
postiz.bat      Postiz stack control (start/stop/logs/status/update)
postiz-post.bat post a finished clip through Postiz (dry-run by default, same human gate)
PLAN.md         the further plan: verified viral format spec, posting cadence, phases
scripts/        PowerShell tooling (viral-job / post-clip / check-social)
*.bat           double-click wrappers: start/stop, viral-clip, uploader, post-clip, check-social
README.md       this file
```

All media, transcripts, clip candidates, and finished MP4s live **inside
`openshorts/`** (its job/output directories) — no parallel folder tree here.

## Start / stop (after rebooting or closing everything)

Double-click in the project root, or run from a terminal:

- **`start.bat`** — starts Docker Desktop if needed, waits for the engine, then brings up all three services. Web UI: <http://localhost:5175>, API: <http://localhost:8000/docs>
- **`stop.bat`** — stops the containers (clips, jobs and settings stay on disk)
- **`stop-full.bat`** — stops the containers *and* quits Docker Desktop (frees the most RAM)

Manual equivalent:

```bash
cd openshorts
docker-compose stop        # stop
docker-compose up -d       # start (no rebuild — fast)
```

## Setup

```bash
git clone https://github.com/mutonby/openshorts.git
cp openshorts/.env.example openshorts/.env      # server-side extras (optional)
# fill GEMINI_API_KEY + UPLOAD_POST_API_KEY in the root .env
docker compose -f openshorts/docker-compose.yml up --build -d
```

- Web UI: <http://localhost:5175> — jobs, review queue, publishing calendar
- API: <http://localhost:8000> (OpenAPI docs at `/docs`, MCP at `/mcp`)
- CLI (optional): `pip install openshorts` → `OPENSHORTS_API_URL=http://localhost:8000 openshorts process <url> --wait`

`GEMINI_API_KEY` is also entered once in the web UI (stored client-side,
encrypted) — the root `.env` remains the single source of truth for this
machine; a missing/invalid key fails loudly, never silently degrades.

### Age-restricted / bot-gated sources (cookies)

OpenShorts uses YouTube cookies for gated sources. This project adds a small
local patch to `openshorts/main.py` (falls back to an existing
`/app/cookies.txt` when the `YOUTUBE_COOKIES` env var is unset), so setup is:

1. Export cookies from your logged-in browser (Netscape format — e.g. the
   "Get cookies.txt LOCALLY" extension) and save as `openshorts/cookies.txt`.
   It is bind-mounted into the container at `/app/cookies.txt` and is
   gitignored. Alternatively paste the file contents into `openshorts/.env`
   as a quoted multi-line `YOUTUBE_COOKIES="..."` value (upstream behaviour;
   the backend writes it to /app/cookies.txt at job time).
2. Recreate the backend if `.env` changed:
   `docker compose -f openshorts/docker-compose.yml up -d`

**Current blocker on the original IShowSpeed test URL (`miGclAow9KI`):** the
video is age-restricted, and YouTube rejects the request even with a fully
logged-in session exported — i.e. the **account itself needs age
verification** (verify at youtube.com/verifyage, then re-export fresh
cookies and resubmit). Verified via direct `yt-dlp --cookies` probes with
multiple player clients (default/tv/ios/mweb/tv_embedded/android_vr/
web_embedded): all return "Sign in to confirm your age". This is an
account-state gate, not a pipeline issue — the pipeline itself was proven
end-to-end on the non-gated GTA6 source above.

Submitting jobs: via the web UI, or
`curl -X POST http://localhost:8000/api/process -H "Content-Type: application/json" -H "X-Gemini-Key: <key from .env>" -d '{"url":"<URL>","acknowledged":true}'`

Job status: `GET http://localhost:8000/api/status/<job_id>`. Finished,
captioned clips land in `openshorts/output/<job_id>/` and in the web UI's
review queue. **Stop there — publishing/scheduling (Phase 6) stays
unwired until clip quality is explicitly approved.**

## Viral format + posting (one-command workflow)

The full plan lives in **[PLAN.md](PLAN.md)** — what is *verified* to pull
views in 2026, how each lever is wired into the pipeline, the posting
cadence, and the retention feedback loop. Day-to-day you only need three
double-clickable scripts (all `scripts/*.ps1` / `uploader/` under the hood):

| Command | What it does |
|---|---|
| `viral-clip.bat <url>` | Submits any video/stream link through the **verified viral format profile**: burned hook overlay (`outline` style, top), 15–34 s clips (retention sweet spot), audio-beat punch-ins, Gemini auto layout picker + speaker cuts/split, karaoke captions (default), loop-aware/no-dead-air scoring prompts. Polls until done, then prints every clip's score, hook, title and file. Source downloads cap at 720p by default (root `.env` `MAX_SOURCE_HEIGHT=720`, the fix for the Twitch 1080p60 stall) — finished clips still deliver 1080×1920; add `-MaxSourceHeight 1080` for a full-quality source on one job. |
| `uploader.bat` | **The default posting leg — unlimited, all 5 platforms.** Dry-run by default: `uploader.bat list --job <id>` shows every clip with score/hook/copy; `uploader.bat post --job <id> --clip <N>` dry-runs the exact payloads; append `--post` (+ `--yes` for scripted runs) to actually upload to YouTube + Instagram + Bilibili + Facebook + TikTok (or `--platforms youtube,bilibili` to narrow). `uploader.bat check` validates credentials per platform; `uploader.bat doctor` checks the environment. Setup below. |
| `postiz-post.bat <job_id>` | **Scheduler leg via local self-hosted Postiz** — dry-run by default, `-ClipIndex N -Post` posts/schedules to every channel connected in Postiz (YouTube / Instagram / Facebook / TikTok; no Bilibili). Add `-ScheduledDate "YYYY-MM-DDTHH:mm:ss"` (local time) to schedule; `-Draft` is a safe API smoke test. `postiz.bat start` boots the stack (UI <http://localhost:4007>). Setup below. |
| `post-clip.bat <job_id>` | **Fallback posting via Upload-Post** (paid tier if you want it) — dry-run by default, `-ClipIndex N -Post -Profile Wybe` posts/schedules to YT + IG only. |
| `check-social.bat` | Read-only check of the Upload-Post key (fallback leg's status). |

### Self-hosted uploader — why and how it works

No open-source scheduler covers all five platforms (verified 2026-08-30:
[Postiz](https://github.com/gitroomhq/postiz-app) has no Bilibili, and
Upload-Post neither — its 22 platforms stop at YouTube/IG/TikTok), and the
Upload-Post free tier caps at 10 uploads/month. So the posting leg is a small
self-hosted orchestrator (`uploader/`, ~900 lines of Python in its own venv)
composing the strongest open-source/official client per platform:

| Platform | Client | Auth | Cap |
|---|---|---|---|
| YouTube | **Official Data API v3** (`google-api-python-client`, resumable upload) | OAuth desktop flow → `uploader/credentials/youtube_token.json` | Free quota ≥ ~6 uploads/day (10,000 units/day; `videos.insert` = 1,600 units, reported ~100 since Dec 2025) |
| Instagram | **Official Meta Graph API** Reels publish (container → poll → `media_publish`) | Long-lived IG access token in `.env` | No cap; needs a public video URL → the backend's `/videos` path is exposed through a free Cloudflare quick-tunnel automatically (or set `IG_PUBLIC_BASE_URL`) |
| Facebook | **Official Meta Graph API** Page video (`/{page-id}/videos`, direct file upload) | Page access token (`FB_PAGE_ID` + `FB_PAGE_ACCESS_TOKEN` in `.env`, same app as Instagram) | No cap; no tunnel needed (file POSTed directly) |
| TikTok | **Official Content Posting API** (`open.tiktokapis.com`, PULL_FROM_URL + FILE_UPLOAD) | OAuth `video_publish` + `video_upload` → `TIKTOK_ACCESS_TOKEN`/`TIKTOK_OPEN_ID` in `.env` | No cap; PULL needs a public URL (auto tunnel), FILE_UPLOAD always works (chunked PUT) |
| Bilibili | **`bilibili-api-python`** `video_uploader` (open source, actively maintained 2026) | Browser cookies (`SESSDATA`/`bili_jct`/`buvid3`) in `.env` | No official cap; keep the 2/day cadence to stay friendly to risk control |

Why not [instagrapi](https://github.com/subzeroid/instagrapi) for Instagram? Why not a TikTok scraper?
Its own repo states Reels uploads are **no longer maintained** (Meta
restricted the project) — the official Graph API is the stable path.
(2026-08-30 note "why not Postiz" is superseded: Postiz is now wired as the
local **scheduler** for YT/IG/FB/TikTok — see below — while the uploader
stays the no-vendor direct-posting leg and the only Bilibili route.)

Every real upload is recorded in `uploader/credentials/ledger.json`
(gitignored) — timestamp, job, clip, per-platform result/URL — and a
clean-named copy lands in `posts\` like the Upload-Post flow.

### Uploader one-time setup (per platform)

0. `uploader\setup-deps.bat` — creates the venv + installs the client
   libraries (once). `uploader.bat doctor` confirms the environment.
1. **YouTube** — Google Cloud Console: create a project → enable *YouTube
   Data API v3* → *OAuth client ID* → type *Desktop app* → download JSON →
   save as `uploader\credentials\client_secrets.json` → run
   `uploader.bat login --platform youtube` (browser consent, once). Quota
   note: a fresh unverified project starts at 10,000 units/day.
2. **Instagram** — the IG account must be a free *Business/Creator* account.
   At developers.facebook.com create an app (*Business* type), add the
   *Instagram Graph API* product, then in Graph API Explorer generate a token
   with `instagram_basic`, `instagram_content_publish`, `pages_show_list`.
   Exchange it for a long-lived token and put both values in the root `.env`:
   `IG_ACCESS_TOKEN=<long-lived>` + `IG_USER_ID=<ig account id>`. The
   long-lived exchange (60-day validity, re-run the curl to refresh):
   `curl -G "https://graph.facebook.com/v23.0/oauth/access_token" --data-urlencode "grant_type=fb_exchange_token" --data-urlencode "client_id=<APP_ID>" --data-urlencode "client_secret=<APP_SECRET>" --data-urlencode "fb_exchange_token=<short-lived token>"`
   Also install `cloudflared` (`winget install Cloudflare.cloudflared`) or set
   `IG_PUBLIC_BASE_URL` — Reels publishing requires a public video URL and the
   backend's `/videos` mount is localhost-only until tunneled.
3. **Bilibili** — log into bilibili.com, DevTools (F12) → Application →
   Cookies → bilibili.com, and copy `SESSDATA`, `bili_jct`, `buvid3` into the
   root `.env` as `BILI_SESSDATA` / `BILI_JCT` / `BILI_BUVID3` (cookies
   expire — re-export when `uploader.bat check` fails). Optional: `BILI_TID`
   (upload zone), `BILI_TAGS`, `BILI_ORIGINAL`.
4. **Facebook** — same Meta app as Instagram: link a Facebook Page to the
   app, then in Graph API Explorer select that Page → generate a Page token
   with `pages_show_list` + `pages_read_engagement` + `publish_video` +
   `pages_manage_posts`. Put `FB_PAGE_ID=<page id>` and
   `FB_PAGE_ACCESS_TOKEN=<page token>` in `.env` (`FB_ACCESS_TOKEN` is an
   alias). Direct file upload — no tunnel needed.
5. **TikTok** — at developers.tiktok.com create an app → add *Content
   Posting API* + *Login Kit* → set a redirect URI → complete App review
   (sandbox works before approval). OAuth: authorize the TikTok account
   (`video_publish,video_upload` scopes), exchange the `code` for tokens
   (`POST https://open.tiktokapis.com/v2/oauth/token/`), and put
   `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ACCESS_TOKEN`,
   `TIKTOK_REFRESH_TOKEN`, `TIKTOK_OPEN_ID` in `.env`. PULL_FROM_URL needs
   a public URL (auto tunnel or `TIKTOK_PUBLIC_BASE_URL`); FILE_UPLOAD
   always works.

`uploader.bat check` after each step tells you exactly what's still missing.
**Posting safety is unchanged:** the uploader dry-runs by default and a real
post needs `--post` plus a specific `--clip` index (AGENTS.md human gate).

### Postiz scheduler (local, docker compose)

Postiz runs locally as the **scheduling layer** — visual calendar + queue for
YouTube / Instagram / Facebook / TikTok (it has no Bilibili, which stays on
`uploader.bat`). It does not replace the per-platform credentials above; it
connects channels with its own OAuth apps and publishes on schedule. Two
files matter:

- `postiz.bat start|stop|restart|logs|status|update` — the stack
  (`postiz/docker-compose.yaml`: postiz + postgres + redis + Temporal).
  UI: <http://localhost:4007>, Temporal UI: <http://localhost:8080>.
- `postiz-post.bat <job_id>` — posts a pipeline clip through Postiz. Dry-run
  by default; `-ClipIndex N -Post` is the human gate; `-ScheduledDate`
  schedules; `-Draft` tests the API round-trip without touching a social
  network.

One-time setup:

1. `copy postiz\.env.example postiz\.env` and set `POSTIZ_JWT_SECRET`
   (long random string). `postiz.bat start`.
2. Register the first admin user at <http://localhost:4007> (registration is
   open until you set `POSTIZ_DISABLE_REGISTRATION=true` and restart).
3. Provider OAuth apps in `postiz\.env` (`POSTIZ_YOUTUBE_CLIENT_ID/SECRET`,
   `POSTIZ_FACEBOOK_APP_ID/SECRET` — one Meta app covers Facebook +
   Instagram, `POSTIZ_TIKTOK_CLIENT_ID/SECRET`), each with redirect URI
   `http://localhost:4007/integrations/social/<provider>`. Recreate:
   `postiz.bat stop && postiz.bat start`.
4. Connect the channels in the Postiz UI (Add Channel), then mint an API key
   (UI → Settings → API Keys) and paste it into the root `.env` as
   `POSTIZ_API_KEY=<key>`.
5. `postiz-post.bat <job_id>` (dry-run) should now list your clips AND the
   connected channels.

API: `http://localhost:4007/api/public/v1` with header
`Authorization: <POSTIZ_API_KEY>` (docs.postiz.com/public-api).

## Phase map (all inside OpenShorts — zero custom code)

1. **Install** — clone + `docker compose up --build`; confirm UI responds.
2. **Source ingestion** — paste the test URL in the UI (native yt-dlp; no separate download script).
3. **Transcription + moment detection** — faster-whisper + Gemini scoring run automatically; output is ranked candidates with timestamps + reasoning.
4. **Clip generation** — automatic 9:16 face-tracked crop (YOLOv8/mediapipe), burned captions, multi-speaker layout switching; MP4s land in the review queue.
5. **Human review gate** — approve/reject/edit in OpenShorts' review interface. **Nothing auto-posts without explicit approval for the first several batches.**
6. **Publishing** — `uploader.bat post --job <id> --clip N --post`: one command posts the clip to **YouTube Shorts + Instagram Reels + Facebook Reels + TikTok + Bilibili** (no vendor, no monthly cap). Use `--platforms youtube,tiktok` to narrow. Or schedule through the local Postiz calendar: `postiz-post.bat <job_id> -ClipIndex N -Post -ScheduledDate "YYYY-MM-DDTHH:mm:ss"` (YT/IG/FB/TikTok only). Cadence plan stays 2 clips/day, spaced (12:30 / 19:30) — never batch-dump. Upload-Post (`post-clip.bat`) remains as the paid-tier fallback for YT+IG. **Still gated: the review pass + explicit `--post`/`-Post` + specific `--clip`/`-ClipIndex`.**
7. **Weekly review loop** — pull analytics via OpenShorts/Upload-Post, log top source videos + clip types to a CSV for manual review. No auto-scaling decisions.

## Constraints (enforced)

- Self-hosted only, Docker on this machine — no OpenShorts cloud tier.
- No hardcoded keys — `.env` only; missing required keys fail loudly
  (uploader platforms refuse with setup instructions until configured).
- Every phase is confirmed working before the next one starts.
- Both posting legs are dry-run by default: `uploader.bat post` needs
  `--post` + a specific `--clip`; `post-clip.ps1` needs `-Post` +
  `-ClipIndex`; `postiz-post.ps1` needs `-Post` + `-ClipIndex`. Nothing
  uploads without those.

## ToS / legal flags (kept visible on purpose)

- **Downloading YouTube videos** (yt-dlp) violates YouTube's ToS outside
  permitted offline modes. Low practical risk for private testing; not
  risk-free at scale.
- **The uploader's own legs are above-board**: YouTube via the official Data
  API (OAuth), Instagram via the official Graph API (Reels publish), Facebook
  via the official Graph API (Page video), TikTok via the official Content
  Posting API, Bilibili
  via a session-cookie upload — the cookie route is the same category of
  automation the platform tolerates for its own creators' tooling (biliup is
  widely used by Bilibili streamers), but it is still unofficial: keep the
  2/day cadence, never bulk-dump, and expect cookie expiry.
- **Reposting GTA 6 trailers / streamer reactions** you don't own is the
  biggest real risk of this project: copyright strikes and channel bans on
  YT/IG/FB/TikTok/Bilibili. Faceless reposting of others' footage (e.g. the IShowSpeed
  test video) without transformation or permission is exactly what gets
  channels terminated. Before anything publishes: budget for transformative
  commentary, or use owned/licensed footage. Flagged per spec — not silently
  accepted.
- **Twitch VOD downloading** violates Twitch's ToS the same way.
