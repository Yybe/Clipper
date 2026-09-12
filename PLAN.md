# Clipper — Further Plan (updated 2026-09-06)

Where the project goes next. Built on top of what is already proven (README.md):
the OpenShorts pipeline runs end-to-end on this machine — download →
transcribe → Gemini moment scoring → face-tracked 9:16 crop → captions →
review queue.

The core question this plan answers: **what makes a clip actually pull views,
and how do we make the pipeline produce that by default, then post it?**

---

## 1. The verified viral short format (what the research says in 2026)

These are the levers that consistently show up across 2026 algorithm/retention
breakdowns — not folklore, but the recurring consensus of retention-curve
studies and platform algorithm write-ups:

| # | Lever | Evidence |
|---|---|---|
| 1 | **Hook lands in the first 1–3 s** — curiosity gap, visual shock, bold claim, proof-upfront, mid-action story. Weak hooks "sound like setup"; the algorithm tests the hook on a small viewer batch and only expands reach if early retention holds. | backstage.com (5 hook types), socialync.io, prodshort.com |
| 2 | **Retention > likes.** TikTok 2026 completion bar moved to ~70%; **rewatch rate multiplies reach**; watch-time, shares/saves and search intent outrank likes and follower count. | socialync.io ("7 signals"), darkroomagency.com |
| 3 | **15–30 s is the sweet spot.** Shorts under ~30 s regularly show 100 %+ retention because of replay loops; a 30 s Short at ~85 % watch time beats a 60 s one. Longer only wins if retention justifies it. | virvid.ai (retention data), prodshort.com |
| 4 | **Hook → body → payoff → seamless loop.** No intro, no greeting, no dead air; the ending snaps back toward the opening beat so rewatches feel continuous. | socialync.io (structure guide), aibrify.com (retention curves) |
| 5 | **Sound-off design.** Burned captions + text overlays are mandatory — most FYP views are sound-off/skim-first. | prodshort.com playbook |
| 6 | **Pattern interrupts / cut pacing.** Punch-ins, layout changes, no static frame for more than a few seconds. | prodshort.com, aibrify.com |

Sources: [socialync.io — short-form structure guide 2026](https://www.socialync.io/blog/short-form-video-structure-guide-2026),
[virvid.ai — best Shorts length / retention data](https://virvid.ai/blog/best-shorts-length-retention-2026),
[backstage.com — 5 social media hook types](https://www.backstage.com/magazine/article/social-media-hook-examples-80055/),
[darkroomagency.com — TikTok algorithm 2026](https://www.darkroomagency.com/observatory/how-tiktok-algorithm-works-in-2026),
[prodshort.com — 2026 viral playbook](https://prodshort.com).

## 2. How the pipeline now enforces that format (Phase 7 — done)

OpenShorts already had most levers built in — they were just off by default.
The viral format is now applied **per job** by `scripts/viral-job.ps1`
(double-click `viral-clip.bat <url>`), so no global config change is needed:

| Verified lever | Pipeline mechanism | How it's wired |
|---|---|---|
| Hook in 1–3 s | Gemini "THE 2-SECOND TEST" is the primary scoring criterion (`gemini_worker.py`) + **auto-hook text overlay burned into the first seconds** | `auto_hook=true`, style `outline` (bold white + black outline, MrBeast-style), positioned top |
| Hook copy patterns | HOOK PLAYBOOK in the detail prompt: open question / hot take / number shock / story loop / POV | built into the prompts |
| 15–34 s band | per-job clip-length controls | `clip_min_seconds=15`, `clip_max_seconds=34`, `target_clips=5` |
| Loop + no dead air | **NEW prompt rules (this update):** LOOP RULE — end within ~1 s of the payoff, trim trailing silence/filler, ending that snaps back toward the opening beat; rewatch explicitly added to the scoring criteria | patched into `gemini_worker.py` SCORE + DETAIL prompts |
| Sound-off design | karaoke captions — bold Anton, white uppercase, yellow active word, pop effect | on by default (`AUTO_CAPTIONS`) |
| Pattern interrupts | **punch-ins** on audio beats + **auto layout picker** (Gemini chooses per scene) | `layouts="auto,punch_in,speaker_cut,split"` |
| Multi-speaker dynamism | hard speaker cuts / stacked split layout | same `layouts` field |
| Platform specs | 1080×1920, −14 LUFS loudness, per-platform titles/descriptions with hashtags | built into the engine |

**Verification:** run `viral-clip.bat` on a long-form source and confirm the
output has (a) the hook overlay burned in the top area, (b) karaoke captions,
(c) clips inside the 15–34 s band, (d) per-platform copy in the metadata.
The result of that run is recorded at the bottom of this file.

## 3. Posting workflow (Phase 8 — live via Upload-Post; Phase 8b adds the self-hosted unlimited leg)

Posting goes through OpenShorts' native Upload-Post integration
(`POST /api/social/post`) — it uploads the finished MP4 and can post now or
schedule. The tool is `scripts/post-clip.ps1` (double-click wrapper:
`post-clip.bat`).

The workflow deliberately keeps a human gate — it just makes the gate fast:

1. **Review** the finished batch in the web UI (<http://localhost:5175>) —
   reject anything embarrassing (wrong hook text, weak moment, bad crop).
2. **List** what's ready with per-clip score + hook + generated copy:
   `post-clip.bat <job_id>` (dry-run by default — it only lists).
3. **Post or schedule the picks** (one command per clip):
   `post-clip.bat <job_id> -ClipIndex 0 -Post -Profile <upload-post-profile>`
   - `‑ScheduledDate "2026-09-01T17:30:00" -Timezone "Asia/Kolkata"` schedules
     instead of posting immediately.
   - Title/description default to Gemini's per-platform copy; pass
     `-Title`/`-Description` to override.
4. **Cadence (the plan): 2 clips/day** — one ~12:30, one ~19:30 local time,
   staggered across YouTube Shorts and Instagram Reels (all three platforms —
   including Bilibili + Facebook + TikTok — via `uploader.bat` as of Phase 8b/8c, see 3b). Never
   batch-dump 5 clips at once: spaced posts each get their own test batch
   from the algorithm.

**Target platform set (updated 2026-09-03): YouTube + Instagram + Bilibili + Facebook + TikTok (all self-hosted, all independent of Upload-Post).**
TikTok was dropped on 2026-08-30 and is now restored via the official Content Posting API.

### 3b. Self-hosted uploader (Phase 8b/8c — the unlimited leg, replaces Upload-Post as default)

Upload-Post turned out to be a dead end for the real goal: its free tier caps
at **10 uploads/month** and Bilibili isn't among its 22 platforms (verified
against upload-post.com/platforms). No open-source scheduler covers all three
either (Postiz has no Bilibili; instagrapi's Reels uploads are officially
unmaintained). So the posting leg is now **`uploader/`** — a small self-hosted
orchestrator composing the best client per platform:

| Platform | Client | Auth | Monthly cap |
|---|---|---|---|
| YouTube | official Data API v3 (`google-api-python-client`, resumable) | OAuth desktop flow, token cached in `uploader/credentials/` | none that matters (quota ≥ ~6 uploads/day free) |
| Instagram | official Meta Graph API Reels publish (container → poll → `media_publish`) | long-lived IG token + user id in `.env` | none; public video URL solved by auto Cloudflare quick-tunnel over the backend's `/videos` mount |
| Facebook | official Meta Graph API Page video (`/{page-id}/videos`, direct file upload) | Page access token (`FB_PAGE_ID` + `FB_PAGE_ACCESS_TOKEN` in `.env`, same app as Instagram) | none; no tunnel needed (file POSTed directly) |
| TikTok | official Content Posting API (`open.tiktokapis.com`, PULL_FROM_URL + FILE_UPLOAD) | OAuth `video_publish` + `video_upload` → `TIKTOK_ACCESS_TOKEN`/`TIKTOK_OPEN_ID` in `.env` | none; PULL needs a public URL (auto tunnel), FILE_UPLOAD always works |
| Bilibili | `bilibili-api-python` `video_uploader` (open source, maintained 2026) | browser cookies in `.env` (`BILI_SESSDATA`/`BILI_JCT`/`BILI_BUVID3`) | none official; keep the 2/day cadence for risk control |

Design rules kept from the Upload-Post era:

- **Human gate unchanged**: dry-run by default; a real post needs
  `uploader.bat post --job <id> --clip <N> --post` (and `--yes` only skips the
  interactive confirm for scripted runs).
- Every attempt is appended to `uploader/credentials/ledger.json`; successful
  posts still export a clean-named copy to `posts\`.
- One platform failing never blocks the others; exit code reports partial
  success (0 all, 2 partial, 1 none).
- `uploader.bat check` / `doctor` give per-platform readiness + setup steps.
- Shared `uploader/tunnel.py` QuickTunnel is reused by Instagram + TikTok PULL paths (or a permanent `*_PUBLIC_BASE_URL` if set).

The Upload-Post path (`scripts/post-clip.ps1`) stays wired as a paid-tier
fallback and is still what the already-scheduled Upload-Post posts run on.

**Blocking prerequisite (user-side, one-time): ~~get the Upload-Post key and
connect the accounts~~ DONE 2026-08-30** — key is set in the root `.env`,
verified live through the backend (`/api/social/user`): profile
**`Wybe`** has **instagram + youtube** connected (the empty "default"
profile is unused). The remaining gate is the human review before the first
`-Post`. The steps, for re-reference:
1. Sign up at <https://app.upload-post.com> (free tier is enough to start).
2. Dashboard → **API Keys** → create a key, copy it.
3. Paste into the root `.env` as `UPLOAD_POST_API_KEY=<key>`, then recreate
   the backend: `docker-compose -f openshorts/docker-compose.yml up -d`
   (env_file is read at container creation, a plain restart is not enough).
4. In the dashboard connect **YouTube** and **Instagram** (OAuth) and note
   the profile name it shows.
5. `check-social.bat` verifies: shows the profile + connected platforms
   (read-only). Only then does `post-clip.bat ... -Post` work.

### 3c. Postiz scheduler (Phase 8d — local docker compose, added 2026-09-12)

Postiz now runs locally (`postiz/docker-compose.yaml`: postiz + postgres +
redis + Temporal; `postiz.bat start`) as the **scheduling layer** — visual
calendar + queue for YouTube / Instagram / Facebook / TikTok. Scope decided
up front: Postiz has **no Bilibili**, so Bilibili stays on `uploader.bat`;
the self-hosted uploader stays the default direct-posting leg (no vendor, no
cap), and Postiz is the leg to use when the calendar/scheduler UX is wanted.

- CLI: `postiz-post.bat <job_id>` — dry-run by default; real post needs
  `-Post` + specific `-ClipIndex` (same human gate). `-ScheduledDate`
  (local time, converted to UTC) schedules; `-Draft` is a safe API test
  (media upload only, no post object, no social side).
- Auth: root `.env` `POSTIZ_API_KEY` (`Authorization` header) +
  `POSTIZ_BASE_URL` (default http://localhost:4007); API base
  `/api/public/v1`.
- Container secrets (JWT_SECRET, provider OAuth apps) live in gitignored
  `postiz/.env` (template `postiz/.env.example`). Provider redirect URI
  pattern: `http://localhost:4007/integrations/social/<provider>`.
- Admin account + API key minted at install time (2026-09-12); key is in the
  root `.env`. Registration can be closed afterwards via
  `POSTIZ_DISABLE_REGISTRATION=true` + restart.

## 4. Retention feedback loop (Phase 9 — next after first posts)

Views come from iterating on real numbers, not from the first batch:

- Pull per-post impressions/analytics via OpenShorts' Upload-Post analytics
  endpoints (`/api/social/analytics*`) into `analytics_log.csv`:
  date, platform, clip id, predicted_score, hook type, length, 24 h views,
  completion, rewatches.
- Weekly: compare **predicted vs actual**. Sort by actual retention, not
  views. Identify which hook patterns (question vs hot-take vs number-shock)
  and which lengths win for the niche.
- Feed the winners back: bias `target_clips`/length band toward what the data
  says, and keep the hook playbook patterns that correlate with completion.
- Kill rule: a format that underperforms 3 batches in a row gets dropped.

## 5. Stream-link ingestion (Phase 10 — hardening)

- **YouTube VODs/live archives:** working (proven). Age-restricted sources
  need an age-verified account's cookies (see README — the IShowSpeed test
  URL is blocked by account state, not the pipeline).
- **Twitch VODs:** yt-dlp handles them generically — no Twitch-specific code
  exists, so treat as unproven until one VOD runs end-to-end. Sub-only VODs
  need Twitch cookies in the same `/app/cookies.txt` path. **Test: run one
  Twitch VOD through `viral-clip.bat` and record the result here.**
- **Kick/Rumble/direct file URLs:** same generic path; verify opportunistically.
- The pre-flight quality gate (min 720p, min 45 s) protects against burning
  20 minutes on a bad source.
- **Source-resolution cap (added 2026-08-30):** the root `.env` sets
  `MAX_SOURCE_HEIGHT=720` — every yt-dlp download (YouTube, Twitch, direct
  URLs) picks a ≤720p rendition, which is the fix for the 1080p60 HLS stall
  above. Finished clips still deliver 1080×1920 (the 9:16 crop is upscaled by
  `delivery_size`; frame-verified). Per job: `viral-clip.bat <url>
  -MaxSourceHeight 1080` for a full-quality source, or the API's
  `max_source_height` field (144–2160; empty string = use the deployment
  default).

## 6. Scale + A/B (Phase 11 — only after Phase 9 shows signal)

- Overnight batch queue: paste 5–10 source links, stagger the schedule across
  the week (OpenShorts scheduling + Upload-Post calendar).
- Hook A/B: render the same clip twice with different `auto_hook_style` /
  hook text, post to different platforms or time slots, compare retention.
- Niche expansion only after 2 weeks of data on the test niche; the pipeline
  is niche-agnostic by design.

## 7. Constraints that stay

- Self-hosted Docker only; no cloud tier. Keys in `.env` only.
- Posting stays behind the review gate: `post-clip.ps1` dry-runs by default
  and requires an explicit `-Post` flag with a specific clip index.
- Reposting footage you don't own is the biggest real risk (README §ToS) —
  transformative-commentary or owned/licensed footage before scaling.
- Every phase is verified against a real run before the next one starts.

---

## Verification log

| Date | Check | Result |
|---|---|---|
| 2026-08-28 | Pipeline end-to-end (GTA6 source, 5 clips, 14 min) | ✅ proven (README) |
| 2026-08-30 | Viral-format job: hook overlay + captions + 15–34 s band + loop prompts | ✅ **job `db806c36` on the GTA6 source: 5 clips, durations 30.4/21.6/30.9/30.2/19.8 s (all in band), hook overlay burned in (`auto_hook` recorded on all 5; frame-extract verified: top hook text + karaoke captions with yellow active word, 1080×1920), per-platform copy generated (YT title + TikTok/IG descriptions), Gemini cost $0.0053, auto layout picker ran** |
| 2026-08-30 | Root `.env` loaded into backend container | ✅ docker-compose `env_file` now includes `../.env`; verified via `docker exec` env probe |
| 2026-08-30 | Loop/dead-air prompt rules active | ✅ `REWATCH VALUE` + `LOOP RULE` confirmed loaded in the running container (`import gemini_worker` probe) |
| 2026-08-30 | Upload-Post key valid + platforms connected | ❌ **blocked: `UPLOAD_POST_API_KEY` is empty in `.env`** — user must get a key at app.upload-post.com, paste it into the root `.env`, and connect TikTok/IG/YT accounts. `post-clip.bat` correctly refuses with instructions (fail-closed verified) |
| 2026-08-30 | Posting leg readiness up to the vendor boundary | ✅ **`post-clip.bat` dry-run listing works keyless** (all 5 clips listed with score/hook/YT title/TikTok+IG copy); backend `POST /api/social/post` verified live: routing + job lookup + ownership pass, returns local `400 Missing Upload-Post API key` before any vendor call. With a real key + profile the same path posts — no code changes needed |
| 2026-08-30 | **Twitch VOD (stream link) end-to-end** | ✅ **proven** — GDQ gamescom VOD (`twitch.tv/videos/2860474714`, 73 min) → 5 clips, 26.9/28.6/30.1/31.5/30.0 s (all in band), scores 82/90/88/92/85, hooks ("Even the pro has never seen this."), punch-ins fired, karaoke captions + hook overlay frame-verified, 1080×1920. yt-dlp handles Twitch generically, no cookies needed for public VODs |
| 2026-08-30 | Twitch 1080p60 pipeline download can stall | ✅ **fixed (was ⚠️)**: the flaky-network stall is now solved in-engine by `MAX_SOURCE_HEIGHT` — see the two rows below |
| 2026-08-30 | Source cap `MAX_SOURCE_HEIGHT=720` (deployment default, .env → container → worker) | ✅ **proven end-to-end** — `printenv` in container = 720; worker logs `📐 MAX_SOURCE_HEIGHT=720: capping the source at 720p.`; smoke job `3ae47cce` (83 s YT source) downloaded at **1280×720** and completed with 4 clips, all inside the 15–34 s band (21.5/24.1/17.5/16.0 s, scores 78–88), delivery **1080×1920** (upscale floor held). Capped format string also resolves on the real GDQ Twitch VOD to `720p60 avc1` |
| 2026-08-30 | Per-job cap override (`max_source_height` API field / `viral-clip.bat -MaxSourceHeight`) | ✅ **proven end-to-end** — job `9f96dcfd` with `max_source_height=1080` logged `[source-cap] max_source_height=1080`, downloaded at **1920×1080**, completed with 5 in-band clips (17.6–27.3 s, scores 72–88). Invalid value → clean `400 must be between 144 and 2160` (fail-loud verified) |
| 2026-08-30 | Upload-Post key valid + platforms connected | ✅ **unblocked** — key set in `.env` (JWT from app.upload-post.com), container recreated, verified live via backend `/api/social/user`: profile **`Wybe`** has **instagram + youtube** connected. Target set: YT + IG auto-post, Bilibili manual (Upload-Post doesn't support it) |
| 2026-08-30 | Posting leg readiness, full chain | ✅ **ready, gated only by the human review** — dry-run listing of `db806c36` prints all 5 clips with score/hook/YT title/IG+TikTok copy (stored copy is clean UTF-8; console mojibake was a PS 5.1 decode artifact only). Next action: user reviews the MP4s in `openshorts\output\db806c36-…\` (final files = `subtitled_*clip_N.mp4`), then fires `post-clip.bat db806c36-… -ClipIndex <N> -Post -Profile Wybe` |
| 2026-08-30 | **First real post (Phase 8 go-live)** | ✅ **LIVE** — clip 0 (score 85, "GTA 6: Every Confirmed Mini-Game So Far!") posted to **YouTube + Instagram** via Upload-Post (`success:true`, vendor job `25b3b86d…`, async durable worker). Clips 2 ("Arsenal", 82) and 1 ("Pets", 78) **scheduled**: Aug 31 19:30 IST + Sep 1 12:30 IST (verified in the vendor queue via `/api/social/scheduled?user=Wybe`). Cadence chosen by quota: free tier = **10 uploads/month** (worst case 2 per call) → ~1 clip/day until a paid plan |
| 2026-08-30 | Findable clip names | ✅ every successful `-Post` now also saves `posts\<date>_<yt-title-slug>_<score>.mp4` (e.g. `posts\2026-08-30_gta-6-every-confirmed-mini-game-so-far_85.mp4`); originals keep pipeline names because the backend/UI reference them by path. `post-clip.ps1 -Yes` skips the interactive POST confirm for scripted runs |
| 2026-08-30 | **Uploader research: no OSS scheduler covers all 3 platforms** | ✅ Postiz (30+ platforms) has **no Bilibili**; Upload-Post neither (22 platforms); instagrapi repo states Reels uploads "no longer maintained" (Meta restriction). Conclusion: compose per-platform clients — official YouTube Data API v3 + official Meta Graph API + bilibili-api-python 17.4.2 (actively maintained, `video_uploader` module verified against the installed lib's signatures) |
| 2026-08-30 | **Uploader environment** (`uploader\setup-deps.bat`) | ✅ Python 3.11 venv created; deps installed: google-api-python-client 2.199.0, google-auth-oauthlib 1.4.1, requests 2.34.2, bilibili-api-python 17.4.2. `uploader.bat doctor`: all 4 python deps OK, backend reachable, ffmpeg present (Bilibili auto-cover), cloudflared missing (IG needs it or `IG_PUBLIC_BASE_URL`), all 3 credentials correctly reported missing |
| 2026-08-30 | **Uploader dry-run against the real job** (`db806c36`) | ✅ `list` prints all 5 clips with score/hook/YT+IG copy, file exists + size; `post --clip 0` dry-run shows per-platform payloads: YT title+description (+tags from hashtags, privacy/category), IG caption + container→publish flow + tunnel plan, Bilibili title/desc/tags/tid 21/cover/original |
| 2026-08-30 | **Uploader fail-loud + safety gate** | ✅ `post --clip 0 --post --yes` with no credentials configured: all 3 platforms refuse with exact one-time setup instructions (no partial upload, no secrets touched), attempt recorded in `uploader/credentials/ledger.json`, exit code 1; `--clip 9` rejected (`must be 0..4`); `check` exit 1 with per-platform guidance |
| 2026-08-30 | **Instagram public-URL prerequisite** | ✅ backend's `/videos/<job>/<file>.mp4` mount verified live over HTTP with range requests (HTTP 206, correct bytes) — that's the URL Meta's Reels fetcher consumes via the auto quick-tunnel |
| (user-side) | Uploader first real post to all 3 platforms | needs one-time credentials only the user can create: YouTube OAuth (`login --platform youtube` after client_secrets.json), Meta app + long-lived IG token in `.env`, Bilibili cookies in `.env` (exact steps printed by `uploader.bat check`, documented in README) — then `uploader.bat post --job <id> --clip <N> --post` |
| (pending) | 24 h analytics pull into `analytics_log.csv` (Phase 9) | after the first posts accrue views — `/api/social/analytics*` endpoints are live; `posts\` copies make per-clip matching easy |
| 2026-08-31 | **Bilibili cookies wired + adapter live** | ✅ `BILI_SESSDATA` / `BILI_JCT` / `BILI_BUVID3` in root `.env` (gitignored); installed missing `curl_cffi` for bilibili-api-python v17+; `uploader.bat check --platforms bilibili` shows `OK Bilibili: cookies valid, uploading as '_Wybe_' (uid 3745039282867460)`; tid=4 (Gaming), 6 default GTA 6 tags, original=1. `POST_PLATFORMS=youtube,bilibili` (IG leg stays on Upload-Post until Meta app creds land) |
| 2026-08-31 | **Bilibili cookie credential set is valid but the account still needs a phone number** | ⚠️ real upload (job `445378b1` clip 0) returns Bilibili error `61001` (per Bilibili's real-name rules, an account must have a phone number bound to upload). One-time user step in the Bilibili app: Settings → Account Security → bind a phone. Re-run the same `uploader.bat post --platforms bilibili` after that |
| 2026-08-31 | **New famous-streamer GTA 6 reaction content batch** | ✅ 6 viral-clip jobs against YouTube reactions of the GTA 6 trailer, all in the 15-34 s band and 1080×1920, hook overlay + karaoke captions, top clip from each: **Agent00** (`445378b1`, score 92 "They added individual physics to EVERYTHING."), **Fanum** (`88403d79`, 90 "What happens if you leak GTA 6?"), **Kai Cenat** (`5cdbf373`, 90 "If she hasn't pre-ordered GTA 6, leave."), **YourRAGE** (`d9de8c59`, 90 "Is this year just a simulation?"), **Sidemen** (`4646465f`, 85 "Look at the hair. It's too real."), **Jynxzi** (`4d8cf14c`, 85 "POV: You finally find the GTA 6 strip club."). 4 videos finished in 8-14 min, 1 long (Kai Cenat 1h) finished in ~24 min, 1 long (YourRAGE 31m) finished in ~23 min. **Concurrency lesson**: 4-6 jobs in parallel OOM-killed the worker on the long videos; sequential is the safe default, the cap is real but not tuned for fan-out |
| 2026-08-31 | **Cleanup of the previous batch's outputs** | ✅ removed 4 test-job output dirs (31423aa8 GDQ, 3ae47cce 83 s smoke, 9f96dcfd 1080p cap probe, fc80ddc9 empty), kept the original `db806c36` GTA6 batch (it produced the 3 already-exported `posts\` clips) and the 5 failed OOM dirs from the parallel run |
| 2026-08-31 | **Today's posts: 2/3 live to YT+IG via Upload-Post, 3rd hit the 10/month cap** | ✅ Clip 0 of `445378b1` ("GTA 6 Physics Are Actually Insane", score 92) and clip 1 of `5cdbf373` ("If she hasn't pre-ordered GTA 6, leave.", score 90) both posted to **YouTube + Instagram** via `POST /api/social/post` (Upload-Post profile `Wybe`, both platforms connected). Clean-named copies saved to `posts/2026-08-31_…_92.mp4` and `posts/2026-08-31_if-she-hasnt-pre-ordered-gta-6-leave_90.mp4`. ⚠️ Clip 3 of `88403d79` ("What happens if you leak GTA 6?") **rejected by Upload-Post with `429` and `count:10, limit:10`** — the Aug 30 batch already consumed the 10/month free-tier quota (6 uploads: 3 posts × 2 platforms) plus 2 of today's = 8, then the 3rd post crossed the cap. **Confirms exactly why the self-hosted uploader exists** — but Bilibili still needs phone binding (above) and YouTube still needs OAuth login (next row) |
| 2026-08-31 | **YouTube OAuth token (deferred — needs interactive user step)** | ⚠️ `uploader\credentials\client_secrets.json` is in place (Google Cloud project `clipping-automation-506912`, Desktop-app OAuth client) but `youtube_token.json` has never been generated — the only path is `uploader.bat login --platform youtube`, which opens a browser consent window and can only be done by the user. **Once done**, `uploader.bat post --platforms youtube` replaces Upload-Post for YouTube with no monthly cap. Until then, all YouTube traffic goes through Upload-Post (subject to the 10/month cap that triggered this whole rebuild) |
| 2026-09-03 | **Phase 8c: Facebook + TikTok adapters (independent of Upload-Post)** | ✅ **5-platform uploader live:** `uploader/platforms/facebook.py` (Graph API Page video, direct file POST, same Meta app as IG) + `uploader/platforms/tiktok.py` (Content Posting API, PULL_FROM_URL with auto quick-tunnel + FILE_UPLOAD chunked PUT with status polling). Shared `uploader/tunnel.py` QuickTunnel deduped from Instagram. `uploader/config.py` now reads `FB_PAGE_ID/FB_PAGE_ACCESS_TOKEN/FB_GRAPH_VERSION` + `TIKTOK_CLIENT_KEY/CLIENT_SECRET/ACCESS_TOKEN/REFRESH_TOKEN/OPEN_ID/PRIVACY_LEVEL/PUBLIC_BASE_URL/CHUNK_SIZE`. `uploader/engine.py` builds per-platform payloads for all 5; `uploader/cli.py` + `uploader/platforms/__init__.py` registry = `[bilibili, facebook, instagram, tiktok, youtube]`. `uploader.bat` + CLI help updated to 5 platforms. `doctor` now reports FB + TikTok creds; `check --platforms facebook,tiktok` prints exact one-time setup steps. Dry-run `build_payloads` verified for a real clip (all 5 titles/captions/tags); `uploader --help`, `doctor`, `check` (valid/invalid platform), and the `--post` human gate all verified live. No secrets committed (`uploader/credentials/` + `.env` remain gitignored). |
| 2026-09-03 | **Docs: 5-platform rollout** | ✅ `.env.example` documents FB + TikTok vars (Page token + TikTok OAuth 5-value set, privacy/chunk options, `POST_PLATFORMS` lists all 5). `README.md` updated: intro, Stack, Built-on-OpenShorts table, Layout, viral-format table, Self-hosted uploader (5-row table + shared ~900-line note), one-time setup steps 4 (Facebook) + 5 (TikTok), Phase map step 6, ToS flags (YT/IG/FB/TikTok/Bilibili). |
| 2026-08-31 | **Tomorrow's 3 posts: blocked on the two user-side one-time steps** | ❌ clips are picked and ready (Sidemen `4646465f` clip 0, Jynxzi `4d8cf14c` clip 0, Kai Cenat `5cdbf373` clip 4) but the two blocking steps both have to land first: **(1)** user runs `uploader.bat login --platform youtube` once to mint the YT token, **(2)** user binds a phone number to the Bilibili account once. After that: `uploader.bat post --job <id> --clip N --post --yes --platforms youtube,bilibili` for each of the 3 tomorrow clips, and the IG leg via `post-clip.bat` once the next Upload-Post period starts (free tier resets monthly) |
| 2026-09-06 | **Multi-game viral batch: 8 sources → 8 jobs → 40 clips (researched the Sep-2026 viral slate first)** | ✅ picked the currently-viral games (GTA 6 Extended Look premiered Aug 27 on Netflix/YouTube — Rockstar explicitly allows reaction/breakdown-with-commentary content, no raw rebroadcast, per gtaboom; Marvel's Wolverine launches Sep 15; NBA 2K27 launched Sep 4; The Blood of Dawnwalker out now; Onimusha: Way of the Sword out now) and ran 8 reaction/commentary sources through `viral-clip.bat`: Kai Cenat Extended Look live (`8e2a41ea`, 63-min source), Kai Cenat "Streamers React to GTA 6 Release Date" (`16f723a8`), multi-streamer Extended Look compilation ft. Jynxzi/Dontai/iShowSpeed (`d47b8fad`), Blind Wave Wolverine (`868dabb9`), MohitVerse Wolverine (`f981c351`), Asmongold Dawnwalker (`9fb326d1`), Tyrone Magnus Onimusha (`d2b150e9`), FlightReacts NBA 2K27 (`be2b1f4b`). 40 clips finished, all 15–34 s (one 9 s outlier in `8e2a41ea`), hook overlay + karaoke captions + 1080×1920 frame-verified on the top picks (92/90/88/88/88). Picks + exact post commands staged in **READY_TO_POST.md**. All sources are creator reaction/commentary content — no raw publisher/trailer footage |
| 2026-09-06 | **Backend image rebuild + whisper model.bin flaky reads under concurrency** | ⚠️→✅ the backend image was missing at session start (only renderer/frontend existed) — `docker compose up -d --build` rebuilt it healthy. Two jobs then failed at model load with `RuntimeError: File model.bin is incomplete` (different byte offsets each time; blob on disk is the full 483,546,902 bytes) — a Windows bind-mount read race when several jobs load faster-whisper simultaneously; one 26-min source also died with `av.error.MemoryError` when 3 jobs ran concurrently. **Mitigation that works: ≤2 jobs concurrent + resubmit failed jobs** — both failures succeeded on retry |
| 2026-09-06 | **Posting legs audit — everything is credential-blocked (user-side)** | ❌ verified live, fail-loud: **Upload-Post** key valid, Wybe still has instagram+youtube, but the quota window shows `count:10, limit:10, last_reset 2026-08-28` → tonight's first post attempt (`9fb326d1` clip 1) correctly refused with `429 … 0 upload(s) remaining`; window reopens ~**Sep 28**. **YouTube self-hosted**: OAuth consent now returns `403 access_denied — Clipper has not completed the Google verification process` (app in Testing mode, `omshiv2218@gmail.com` not an approved tester; fix in Cloud Console → OAuth consent screen → test users, then `uploader.bat login --platform youtube`). **Bilibili**: `-101 账号未登录` (cookies invalidated server-side) and the Chrome profile is logged out of bilibili.com too. **IG/FB/TikTok self-hosted**: never configured. Zero posts possible until at least one leg is unblocked — picks + one-command post lines wait in READY_TO_POST.md |
| 2026-09-06 | **Source-language lesson: Hindi channels produce Devanagari hooks** | ⚠️ MohitVerse Wolverine job (`f981c351`, 5 clips, scores 75–85) came back with Hindi hooks/titles (correct Devanagari in metadata, garbled only in the PS 5.1 console) — wrong market for this channel set and uncertain hook-font rendering. Clips kept but deprioritized in READY_TO_POST.md; stick to English-language reaction channels for sources |
| 2026-09-07 | **First live post batch: 5 clips on YouTube + Bilibili (self-hosted legs, both live)** | ✅ **LIVE on both platforms** — after the user added the OAuth tester + bound the Bilibili phone number, and we fixed the `creds.to_json(Path)` crash (now `write_text(to_json())`) and drove the OAuth consent via computer-use, the top 5 picks posted to **YouTube (Wybe @wybe5048)**: 92/90/88/88/88 (GTA 6 release-date, GTA 6 Extended Look, Dawnwalker, Wolverine, NBA 2K27) **and to Bilibili (_Wybe_)**: `BV1LNbt6yEzS` / `BV1vNbt6yE2H` / `BV15Nbt6yE8y` / `BV1VNbt6yEfH` / `BV15Nbt6yETm`. Bilibili phone binding (`61001` blocker) resolved by the user in the app. ⚠️ An earlier 5-clip run landed on the **wrong** YT channel ("Shivam Tripathi", `UCukwNg3W2iujMume3-3YpcA`) before the correct OAuth account was selected — flagged as duplicates for manual deletion in YouTube Studio |
| 2026-09-12 | **Phase 8d: Postiz scheduler stack up + API verified live** | ✅ local stack (`postiz/docker-compose.yaml`, adapted from gitroomhq/postiz-docker-compose with secrets via gitignored `postiz/.env`) — postiz + postgres17 + redis + Temporal(elasticsearch) all healthy, UI on :4007. Admin user registered via API (`/api/auth/register` needs `provider:"LOCAL"` + `company`), API key = `Organization.apiKey`, saved to root `.env` as `POSTIZ_API_KEY`. Live against the running instance: `GET /public/v1/integrations` → `[]` (200, auth OK); `POST /public/v1/upload` accepted a real 11 MB pipeline MP4 (`posts/2026-08-31_gta-6-physics…_92.mp4`) → media id + local `/uploads` path. Draft-with-no-integration correctly refused (`400 All posts must have an integration id`) — real end-to-end posts need connected channels (user-side provider OAuth apps in `postiz/.env`, redirect `http://localhost:4007/integrations/social/<provider>`). `postiz-post.ps1` CLI: parse + graceful job-not-found failure verified; Postiz-unique code paths (auth/integrations/upload) verified via curl; job-lookup code is identical to proven `post-clip.ps1` | |
