# Clipper — Automated Faceless Clipping & Posting System

Self-hosted, end-to-end pipeline built on **OpenShorts** (`mutonby/openshorts`,
MIT core): long video in → transcribed → AI highlight detection → 9:16
face-tracked crop → burned captions → **human review gate** → scheduled
publishing to **YouTube Shorts / Instagram Reels** (Upload-Post API) and
**Bilibili** (manual upload — Upload-Post doesn't support it).

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

**Update 2026-08-30:** the *verified viral format* profile is wired and
one-command (`viral-clip.bat <url>` — hook overlay, 15–34 s band, punch-ins,
auto layouts, loop-aware scoring prompts; see **PLAN.md** for the format
spec + verification log). **Posting is LIVE**: the Upload-Post key is set,
profile `Wybe` has YouTube + Instagram connected, and the first clip is
already published (two more scheduled). Target set: YT + IG auto-post,
Bilibili manual (Upload-Post doesn't support it). Note the **free-tier cap:
10 uploads/month** — pace ~1 clip/day or upgrade for unlimited. Every
successful post also saves a clean-named copy to `posts\`.

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
| Publishing | OpenShorts' built-in Upload-Post integration (Postiz deliberately NOT used — redundant) |
| Review gate | OpenShorts' own review UI — nothing schedules without explicit approval |

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
| **Target platform set**: YouTube + Instagram auto-post, Bilibili manual, TikTok dropped | `scripts/`, PLAN.md | Matches the actual channel plan; Upload-Post's limits (10 uploads/mo free) paced into the cadence |

Everything else — transcription, face tracking, caption rendering, layout
engines — is upstream OpenShorts, unchanged. Patches are documented in
**[PLAN.md](PLAN.md)** (verification log) so they can be re-applied when
pulling upstream updates.

## Layout

```
.env            real keys (gitignored): GEMINI_API_KEY, UPLOAD_POST_API_KEY
.env.example    documented template — copy to .env
openshorts/     the engine itself (cloned from mutonby/openshorts; has its own git history)
PLAN.md         the further plan: verified viral format spec, posting cadence, phases
scripts/        PowerShell tooling (viral-job / post-clip / check-social)
*.bat           double-click wrappers: start/stop, viral-clip, post-clip, check-social
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
double-clickable scripts (all `scripts/*.ps1` under the hood):

| Command | What it does |
|---|---|
| `viral-clip.bat <url>` | Submits any video/stream link through the **verified viral format profile**: burned hook overlay (`outline` style, top), 15–34 s clips (retention sweet spot), audio-beat punch-ins, Gemini auto layout picker + speaker cuts/split, karaoke captions (default), loop-aware/no-dead-air scoring prompts. Polls until done, then prints every clip's score, hook, title and file. Source downloads cap at 720p by default (root `.env` `MAX_SOURCE_HEIGHT=720`, the fix for the Twitch 1080p60 stall) — finished clips still deliver 1080×1920; add `-MaxSourceHeight 1080` for a full-quality source on one job. |
| `post-clip.bat <job_id>` | **Dry-run by default** — lists the job's clips with score/hook/per-platform copy. Add `-ClipIndex N -Post -Profile <upload-post-profile>` (optionally `-ScheduledDate "YYYY-MM-DDTHH:mm:ss" -Timezone "<tz>"`) to actually post/schedule via Upload-Post. Requires a connected account (below). |
| `check-social.bat` | Read-only check of the Upload-Post key: shows your profile name and which platforms (IG/YT) are connected. |

**Posting prerequisites (one-time, user-side) — DONE 2026-08-30:**
1. ~~Get an API key~~ key is set in the root `.env`.
2. ~~Connect accounts~~ profile `Wybe` has YouTube + Instagram connected.
3. `check-social.bat` confirms the key + platforms anytime.

The root `.env` is loaded into the backend container (docker-compose
`env_file` includes `../.env` as of 2026-08-30), so the same file is the
single source of truth for the API and the scripts.

## Phase map (all inside OpenShorts — zero custom code)

1. **Install** — clone + `docker compose up --build`; confirm UI responds.
2. **Source ingestion** — paste the test URL in the UI (native yt-dlp; no separate download script).
3. **Transcription + moment detection** — faster-whisper + Gemini scoring run automatically; output is ranked candidates with timestamps + reasoning.
4. **Clip generation** — automatic 9:16 face-tracked crop (YOLOv8/mediapipe), burned captions, multi-speaker layout switching; MP4s land in the review queue.
5. **Human review gate** — approve/reject/edit in OpenShorts' review interface. **Nothing auto-posts without explicit approval for the first several batches.**
6. **Scheduling/publishing** — via `post-clip.bat <job_id> -ClipIndex N -Post ...` (Upload-Post): 2 clips/day across YouTube Shorts / IG Reels (Bilibili uploaded manually), 14-day rolling calendar. **Still gated: needs the review pass + a real UPLOAD_POST_API_KEY + connected accounts.**
7. **Weekly review loop** — pull analytics via OpenShorts/Upload-Post, log top source videos + clip types to a CSV for manual review. No auto-scaling decisions.

## Constraints (enforced)

- Self-hosted only, Docker on this machine — no OpenShorts cloud tier.
- No hardcoded keys — `.env` only; missing required keys fail loudly.
- Every phase is confirmed working before the next one starts.
- Publishing stays disconnected until the human gate approves clip quality.

## ToS / legal flags (kept visible on purpose)

- **Downloading YouTube videos** (yt-dlp) violates YouTube's ToS outside
  permitted offline modes. Low practical risk for private testing; not
  risk-free at scale.
- **Reposting GTA 6 trailers / streamer reactions** you don't own is the
  biggest real risk of this project: copyright strikes and channel bans on
  YT/IG/Bilibili. Faceless reposting of others' footage (e.g. the IShowSpeed
  test video) without transformation or permission is exactly what gets
  channels terminated. Before anything publishes: budget for transformative
  commentary, or use owned/licensed footage. Flagged per spec — not silently
  accepted.
- **Twitch VOD downloading** violates Twitch's ToS the same way.
