# Clipper — Automated Faceless Clipping & Posting System

Self-hosted, end-to-end pipeline built on **OpenShorts** (`mutonby/openshorts`,
MIT core): long video in → transcribed → AI highlight detection → 9:16
face-tracked crop → burned captions → **human review gate** → scheduled
publishing through the self-hosted `uploader/` (no vendor cap; Upload-Post kept
as a fallback). `uploader/` ships adapters for **YouTube Shorts, Instagram
Reels, Facebook Reels, TikTok and Bilibili** — but of those five, **only
YouTube and Bilibili have ever completed a real post**. The Instagram, Facebook
and TikTok adapters are written, dry-run-verified and documented, and have
**never been given credentials** — they are unproven, not "live".

Test niche: **GTA 6 hype content**. The pipeline is niche-agnostic — the same
setup works for any long-form source after the niche is validated.

**Status (re-audited against the live machine 2026-10-27):** the engine is
installed via Docker and **proven end-to-end repeatedly**, not once: IGN's
"89 Details From GTA 6 Trailer 2" (18 min, `JmKZUB1NBag`) ran download →
faster-whisper transcription → Gemini moment scoring → face-tracked 9:16 crop →
burned captions in ~14 min into 5 ranked candidates (85/80/75/70/65) with
finished 1080×1920 MP4s; a 73-min GDQ Twitch VOD, an 83 s smoke source, 8
gaming-reaction sources (40 clips) and 4 more single-source jobs also completed
(see the PLAN.md verification log). **Current operating state as of
2026-10-27, verified live:** Docker Desktop is **off** (API :8000 and Postiz
:4007 unreachable), **every posting leg is blocked** (uploader YouTube OAuth
refresh → `invalid_grant: Bad Request`; Bilibili cookies → `-101 账号未登录`;
Instagram/Facebook/TikTok never configured; Postiz's YouTube integration holds an
empty `refreshToken`), and **nothing has been published since 2026-09-21**. The
pipeline is dormant, not deprecated — `start.bat` brings it back.

**Historical: 2026-08-30 → 09-20 (posting went live, then stalled).** The first
clips published through the Upload-Post leg (2026-08-30), whose free tier then
capped at **10 uploads/month** with no Bilibili — the reason `uploader/` was
built. From 2026-09-07 the self-hosted leg posted YouTube + Bilibili directly,
and from 2026-09-20 Postiz scheduled a batch. The viral-format profile
(`viral-clip.bat`) and the clean-named `posts\` export have been in the loop
throughout.

## Measured output — live numbers, with method

Channel: **Wybe** — **https://www.youtube.com/@wybe5048** (`UCfu4UkED_dhZ_y5CaQ9efbQ`)
How this was measured: YouTube Data API v3 with the project's own
`YOUTUBE_API_KEY` — `channels.list(forHandle, part=statistics)` + the channel's
uploads playlist + `videos.list(part=statistics)`, queried **2026-10-27 13:02
UTC**. These are cumulative lifetime public view counts, not analytics-scope
data and not estimates.

Channel-level: **12 subscribers, 23 videos, 16,120 total channel views.** 7 of
those videos (1,041 views) predate this project — personal 2020-2022 edits,
excluded from every claim below.

The 16 project-era clips (published 2026-08-30 → 2026-09-21), sorted by views:

| Published | Views | Likes | Dur | Clip | Posting route recorded in this repo |
|---|---|---|---|---|---|
| 2026-08-31 | 2,560 | 49 | 32 s | The GTA 6 Arsenal Revealed! | Upload-Post leg |
| 2026-09-01 | 2,092 | 24 | 22 s | Will GTA 6 Have Pets? | Upload-Post leg |
| 2026-08-30 | 1,927 | 38 | 31 s | GTA 6: Every Confirmed Mini-Game So Far! | Upload-Post leg |
| 2026-08-31 | 1,485 | 15 | 28 s | GTA 6 Physics Are Actually Insane (92) | Upload-Post leg |
| 2026-09-19 | 1,297 | 19 | 27 s | Sony says you DON'T own your digital games | **none — manual/ad-hoc upload** |
| 2026-09-20 | 1,253 | 8 | 21 s | Xbox Game Pass Day-1 Games Might Be Gone | `uploader` YouTube leg |
| 2026-09-14 | 1,197 | 9 | 22 s | MW4 Multiplayer Beta Incoming (Whop) | **none — manual/ad-hoc upload** |
| 2026-08-31 | 1,143 | 19 | 31 s | Does your girl have your GTA 6 pre-order? (90) | Upload-Post leg |
| 2026-09-20 | 904 | 3 | 26 s | GTA 6 Is Getting a Physical Edition… $125 | Postiz scheduler leg |
| 2026-09-17 | 904 | 15 | 19 s | MW4 1v1Clutch V3 (Whop) | **none — manual/ad-hoc upload** |
| 2026-09-12 | 247 | 4 | 20 s | MW4 Beta Gameplay (Whop v1) | `uploader` YouTube leg |
| 2026-09-17 | 33 | 0 | 27 s | why is keith richards in gta 6 (90) | **none — manual/ad-hoc upload** |
| 2026-09-16 | 19 | 5 | 22 s | MW4 Multiplayer Beta Incoming (Whop) | **none — manual/ad-hoc upload** |
| 2026-09-19 | 14 | 0 | 23 s | 2x BLOODTHIRSTY in MW4 Beta (Whop v4) | `uploader` YouTube leg |
| 2026-09-21 | 6 | 0 | 14 s | vampires in a dark fantasy rpg (88) | **none — manual/ad-hoc upload** |
| 2026-09-19 | 1 | 0 | 32 s | The most chaotic racing game ever made (90) | **none — manual/ad-hoc upload** |

**Totals that are defensible:** 16 live clips = **15,082 views** (mean 943,
median 1,024, top 2,560). Of that, **9 clips / 11,625 views** were published by
an automated leg with a record in this repo; the other 7 / 3,457 views were
uploaded by hand or by an ad-hoc script and must not be credited to the
automation. Cohorts: Aug-2026 4 clips = 7,115 views, Sep-2026 12 clips = 7,967.

**What is deliberately NOT claimed:**
- **5 clips of the 2026-09-07 batch** (`qtyxVepAXvk`, `YBfKlaEUddM`,
  `XIXf4SZIcxM`, `oLjhM5T0fpo`, `hWS5GB6tgTA`) posted successfully through the
  self-hosted leg (`ledger.json` says `ok:true`) and are **now gone from the
  channel** — absent from its uploads playlist and `404` via oEmbed (deleted or
  made private; this repo has no record of the removal). Their views are not counted.
- **10 duplicate uploads** of that same batch are **still public on the wrong,
  personal channel** ("Shivam Tripathi", `UCukwNg3W2iujMume3-3YpcA`, 1,890
  combined views). They were flagged for manual deletion on 2026-09-07 and were
  never deleted. Not project output — cleanup still outstanding.
- **Bilibili**: 5 uploads logged `ok:true` on 2026-09-06 (`BV1LNbt6yEzS` etc.).
  Their current liveness/views **cannot be verified from this machine** — the
  Bilibili API returns `412 Precondition Failed` and the pages serve only
  JavaScript. No Bilibili view number is quotable.
- **Retention/completion**: none exists. `analytics_log.csv` has a header row and
  **zero data rows**, so PLAN §4's feedback loop never ran. Any
  watch-time/completion figure quoted for these clips would be fabricated.

Totals across all legs, ever, from repo records: **24 successful automated
YouTube uploads** (9 of them still live on the project channel) + **5 to
Bilibili**. First-to-view lag was ~4 weeks; the number has been static since
2026-09-21 because nothing new has shipped.

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
| Publishing | **Self-hosted `uploader\`** — official YouTube Data API v3 + official Meta Graph API (IG Reels + FB Page video) + TikTok Content Posting API + `bilibili-api-python`, no monthly cap by design. **Adapters exist for all five; real posts are proven for YouTube + Bilibili only** (IG/FB/TikTok were never credentialed). Upload-Post kept as a paid-tier fallback |
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
| **Market-skill edit path** (`scripts/skill_edit.py`, from the Qoder-market `video-clip-editor` skill): cuts snap to whisper WORD timestamps at sentence boundaries (no mid-sentence audio starts) and captions cover 100% of the runtime | `scripts/skill_edit.py`, PLAN.md 2026-09-19b row | Alternative to openshorts when a clean speech start + dense full-coverage captions matter more than auto moment scoring / face tracking |
| **Posting workflow with a hard human gate**: dry-run listing by default, `-Yes` for scripted runs, scheduled posts, clean-named `posts\` export of everything actually posted | `scripts/post-clip.ps1` | Safe to keep logged in; clip files become findable (`2026-08-30_gta-6-every-confirmed-mini-game-so-far_85.mp4`) |
| **Target platform set**: adapters for YouTube + Instagram + Bilibili + Facebook + TikTok (all self-hosted) | `scripts/`, `uploader/`, PLAN.md | **Proven live: YouTube + Bilibili only.** IG/FB/TikTok adapters compile, dry-run and print exact setup steps, but no credentials were ever added and no post was ever made through them |
| **Self-hosted, cap-free posting** (`uploader\` package + `uploader.bat`): adapters for the official YouTube Data API v3 (OAuth), official Meta Graph API (IG Reels + FB Page video, auto quick-tunnel), TikTok Content Posting API (PULL_FROM_URL + FILE_UPLOAD) and bilibili-api-python cookie uploads — removes the Upload-Post 10/month cap on the legs that are actually credentialed (YouTube, Bilibili) | `uploader/`, `uploader.bat` | No vendor cap and no third party in the loop **where it has been exercised** — 17 recorded YouTube uploads + 5 Bilibili uploads, incl. 3 OAuth re-mints after revocations; the IG/FB/TikTok adapters have never posted anything. Same human gate (dry-run default, `--post` + specific `--clip`); append-only JSON ledger of every attempt |

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
uploader.bat    cap-free multi-platform posting CLI (dry-run by default; adapters for 5 platforms, 2 credentialed to date)
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
| `uploader.bat` | **The default posting leg — no vendor cap, adapters for 5 platforms (2 ever exercised: YouTube + Bilibili).** Dry-run by default: `uploader.bat list --job <id>` shows every clip with score/hook/copy; `uploader.bat post --job <id> --clip <N>` dry-runs the exact payloads; append `--post` (+ `--yes` for scripted runs) to upload to whichever of YouTube / Instagram / Bilibili / Facebook / TikTok are credentialed — **as of 2026-10-27 that means YouTube + Bilibili only; the other three fail closed with setup instructions because no credentials for them exist** (or `--platforms youtube,bilibili` to narrow). `uploader.bat check` validates credentials per platform; `uploader.bat doctor` checks the environment. Setup below. |
| `postiz-post.bat <job_id>` | **Scheduler leg via local self-hosted Postiz** — dry-run by default, `-ClipIndex N -Post` posts/schedules to every channel connected in Postiz (YouTube / Instagram / Facebook / TikTok; no Bilibili). Add `-ScheduledDate "YYYY-MM-DDTHH:mm:ss"` (local time) to schedule; `-Draft` is a safe API smoke test. `postiz.bat start` boots the stack (UI <http://localhost:4007>). Setup below. |
| `post-clip.bat <job_id>` | **Fallback posting via Upload-Post** (paid tier if you want it) — dry-run by default, `-ClipIndex N -Post -Profile Wybe` posts/schedules to YT + IG only. |
| `check-social.bat` | Read-only check of the Upload-Post key (fallback leg's status). |
| `scripts\render-skill-edit.ps1` | **Batch market-skill edit renderer** — reads `market_skill_run\plan.tsv` (src/start/end/clip_id/hook/title/caption), renders missing clips via `scripts\skill_edit.py`, stages them into `posts\skill-edit\<date>_<id>_SKILL-EDIT.mp4` + `.srt` + `_CAPTION.txt`, and writes `schedule-manifest.json` (2 slots/day × 5 days, YouTube integration id). See `posts\skill-edit\README.md`. |
| `scripts\schedule-skill-edit.ps1` | **Skill-edit scheduler** — dry-run by default; `-Post` uploads each staged MP4 to local Postiz (`POST /api/public/v1/upload`, raw `Authorization: <apiKey>` header — no "Bearer" prefix) and creates the 10 scheduled YouTube posts from the manifest. |

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

**Credential state, re-checked live 2026-10-27 with `uploader check`:** YouTube leg
**blocked** (`RefreshError: invalid_grant: Bad Request` — token revoked/expired,
needs `uploader.bat login --platform youtube`); Bilibili leg **blocked**
(`-101 账号未登录` — cookies expired again); Instagram, Facebook and TikTok **not
configured at all** (no `IG_ACCESS_TOKEN` / `FB_PAGE_*` / `TIKTOK_*` in `.env`,
so those three adapters have never made a request against a live API). What this
leg has actually delivered: **17 successful YouTube uploads + 5 Bilibili
uploads**, recorded in `uploader/credentials/ledger.json`.

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
connects channels with its own OAuth apps and publishes on schedule. **Measured
outcome, verified 2026-10-27:** one batch of 10 posts was scheduled on
2026-09-20 and **only 2 of the 10 slots ever published** — `gta6-physical`
(`youtube.com/watch?v=Ek7RnRC_Y7o`, via Postiz after a UI re-auth) and
`gamepass-day1` (`youtube.com/shorts/1vN5vjtBmVQ`, recovered by hand through the
`uploader` leg after Postiz missed its slot). The other 8 never fired: Docker
Desktop does not auto-start on boot, and Postiz's YouTube integration kept an
**empty `refreshToken`** (Google only issues one on a brand-new grant, so the
reconnect order matters). The stack is down again as of 2026-10-27 (port 4007
unreachable). Two
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
6. **Publishing** — done on the two legs that were credentialed, blocked on the rest. `uploader.bat post --job <id> --clip N --post` posts through adapters for **YouTube Shorts + Instagram Reels + Facebook Reels + TikTok + Bilibili** (no vendor, no monthly cap); **in practice only YouTube and Bilibili have ever been exercised** — Instagram/Facebook/TikTok were never configured. Use `--platforms youtube,tiktok` to narrow. Or schedule through the local Postiz calendar: `postiz-post.bat <job_id> -ClipIndex N -Post -ScheduledDate "YYYY-MM-DDTHH:mm:ss"` (YT/IG/FB/TikTok only). Cadence plan stays 2 clips/day, spaced (12:30 / 19:30) — never batch-dump. Upload-Post (`post-clip.bat`) remains as the paid-tier fallback for YT+IG. **Still gated: the review pass + explicit `--post`/`-Post` + specific `--clip`/`-ClipIndex`.**
7. **Weekly review loop** — **NOT DONE.** `analytics_log.csv` contains its header row and zero data rows; no per-post analytics was ever pulled, so predicted-vs-actual score comparison has never happened. Clip quality so far is judged by human review + public view counts only (see "Measured output" above).

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
  2/day cadence, never bulk-dump, and expect cookie expiry. Of these, only the
  YouTube and Bilibili routes have been exercised in production; the IG/FB/TikTok
  routes are API-conformant code that was never given credentials.
- **Reposting GTA 6 trailers / streamer reactions** you don't own is the
  biggest real risk of this project: copyright strikes and channel bans on
  YT/IG/FB/TikTok/Bilibili. Faceless reposting of others' footage (e.g. the IShowSpeed
  test video) without transformation or permission is exactly what gets
  channels terminated. Before anything publishes: budget for transformative
  commentary, or use owned/licensed footage. Flagged per spec — not silently
  accepted.
- **Twitch VOD downloading** violates Twitch's ToS the same way.
