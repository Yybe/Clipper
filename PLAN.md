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
| 2026-09-13 | **Whop COD_1 MW4 campaign clip: YouTube live, Bilibili blocked on fresh cookies** | ✅ 19.6 s 1080×1920 promo edit built entirely from the official MediaSilo stringouts (`Whop_Campaigns/COD_1/Media`, gitignored) per the campaign brief: 6-cut viral format, persistent on-screen text "MW4 OPEN BETA" + "THIS WEEKEND", POS logo watermark (NEG logo as drop shadow), original audio only, Spanish-UI + facecam segments excluded, NVENC encode. Posted to **YouTube** (`https://youtube.com/shorts/lhSE7tYqNP4`) via a one-off `post_whop.py` that reuses the uploader adapters with campaign-compliant copy (exact pre-order phrase + `#Ad` own line + @callofduty + 3 tags). Same run fixed the real bug in `uploader/platforms/youtube.py`: `creds.to_json(Path)` crashes on google-auth ≥ new API (positional arg is now `strip`) → `write_text(creds.to_json())`. ⚠️ **Bilibili refused `-101 账号未登录`** — cookies expired again server-side; needs the user to re-export SESSDATA/bili_jct/buvid3 into root `.env`, then rerun `post_whop.py --post --only bilibili`. IG leg is manual per user choice |
| 2026-09-14 | **Whop COD_1 v2 clip built + verified, YT post blocked on revoked OAuth** | ✅ 21.5 s 1080×1920 variant (`Whop_Campaigns/COD_1/out/MW4_BetaWeekend_PlayItNow_V2.mp4`, 61.7 MB, NVENC h264+aac) — 6 fresh cuts zero-overlap with v1 (F3 Repair-Shop first-blood, F3 C2 gunfight, F3 snow-patio spray, F2 bus-side Fury, F2 tank-yard snipe, F1 Dispatch door breach), hook text "MW4 OPEN BETA / PLAY IT THIS WEEKEND" + end-card "DAY ONE - OCT 23" on final cut, POS logo watermark, original audio, English HUD only, frame-verified all 6 moments. Same compliant caption block as v1 (pre-order phrase + #Ad + @callofduty + 3 tags). ❌ YT upload refused `invalid_grant: Token has been expired or revoked` — needs user to re-run `uploader.bat login --platform youtube`. Also fixed the same old `creds.to_json(Path)` bug in `check()` that was already fixed in `_authorize()`. |
| 2026-09-16 | **Whop Blizzard BlizzCon Warcraft clip: viral-ready GPU cut (Mak'gora tease)** | ✅ 30.0 s 1080×1920 (`Whop_Campaigns/Blizzard_Blizzcon/output/Blizzard_WoW_Hardcore_Makgora_Tease_01.mp4`, 48 MB, NVENC h264+aac, RTX 3060 encode) — cut 2042→2072 from official panel file "The past, present and future of Hardcore" (only sanctioned source); uncut single take (no reorder/misrepresentation), original panel audio untouched; hook overlay "HE HAS A TEASE!" top + word-level karaoke captions (Anton, corrected "Mak'gora"/"tease"), frame-verified. Campaign caption in `*_CAPTION.txt` (own-line #BlizzardPartner first + #Warcraft). GPU whisper base transcript used for moment pick + SRT. NOT posted — human gate + posting-leg credential state decide next step. |
| 2026-09-17 | **Whop COD_1 diagnosis: why v1/v2 hooks felt weak/soulless** | ✅ root causes confirmed by frame inspection: (1) letterboxed 16:9 shrunk into the middle third on blurred filler — gameplay tiny, blur reads as low-effort; (2) one static text line ("MW4 OPEN BETA / THIS WEEKEND") for the whole clip — no kinetic hook/escalation/payoff layer, so nothing earns the first-3s retention test; (3) 6 random cuts, no single-play arc — montage with no setup→payoff story; (4) cold opens landed on aftermath (explosion smoke, "KILL" fading) instead of mid-gunfire. These were hand-built ffmpeg promo edits for compliance, NOT openshorts viral-pipeline clips (no Gemini moment scoring, no punch-ins). Format changed accordingly in v3 (next row) |
| 2026-09-17 | **Whop COD_1 v3: 3 viral-format clips, full-GPU build (cuda decode + NVENC)** | ✅ `Whop_Campaigns/COD_1/out/`: **MW4_RoomClear_V3.mp4** (16.1 s, TopPlays 96-112: scope kill → room multi-kill → snow-patio "KILL/LOW BLOW/SURVIVOR" payoff), **MW4_1v1Clutch_V3.mp4** (18.1 s, Batch2 118-136: corridor kills → "3RD KILL" medal → "1 vs 1" bomb-site cliffhanger; recut off the Korean-UI match at ~141 s to hold English-only), **MW4_KillstreakBoom_V3.mp4** (22.1 s, w2 64-86: ADS → killstreak explosion → refinery gunfight payoff). All 1080×1920 60 fps NVENC h264 + aac original audio only, full-bleed 9:16 center crop (no blur bars), jump-cut punch-in at the escalation beat, kinetic 3-stage text (hook → escalation → payoff + "DAY ONE OCT 23"), persistent "MW4 OPEN BETA - THIS WEEKEND" banner + POS logo watermark, -14 LUFS. Campaign captions in `*_CAPTION.txt` (exact pre-order phrase + own-line #Ad + @callofduty + 3 tags). Frame-verified all 9 beats. NOT posted — human gate decides |
| 2026-09-17 | **GTA6 celeb-tease viral short: synthetic VO + GPU build (SAPI + NVENC)** | ✅ `posts/2026-09-17_celebrities-that-teased-gta-6_90.mp4` (28.5 s, 1080×1920 30 fps, h264_nvenc CQ19 + aac, 0.9 MB) + `*_CAPTION.txt`. NOT an openshorts clip job — synthetic compilation for the Sep-15 coordinated music rollout (Travis Scott pink-heels/Phase-1/Jack-of-Hearts, Future + Metro Boomin purple Coquette/Leonida plate, Fred Again + PinkPantheress + Paco yacht, Wallen pool-ladder / Rauw float / Keith iguana; sourced from TechWiser Sep-16 list). Offline SAPI voice (David, rate +2) per-beat WAVs, card timings locked to VO durations, Anton/hook overlay + yellow sub + caption box + PART n/6 counter, Vice City pink/purple bars. Frame-verified hook/Travis/yacht/CTA. No copyrighted IG images used (text cards only). ⚠️ User rejected this version (no real post visuals, AI-sounding VO) — superseded by the pipeline run below |
| 2026-09-17 | **GTA6 celeb-tease via proven pipeline (real source, real voice)** | ✅ job `93856d26` on GTA 6 Daily "Travis Scott & Other Artists Are Posting GTA 6 Clues… But Why?" (`oYjipYKfIaA`, 7:38, found via yt-dlp search): 5 clips, durations 28/32/26/31/31 s (all inside the 15–34 s band), scores 85/78/90/75/82, hooks burned (outline style), karaoke captions (Anton, yellow active word), 1080×1920, punch-ins fired, Gemini cost $0.0030. Frame-verified top pick **clip_3 (score 90, 26 s, "Why is Keith Richards involved in GTA 6?")**: hook overlay + real GTA 6 artwork visuals (Keith iguana post) + real human VO captions. ⚠️ infra notes: caption burn failed on clip_1 and hook overlay failed on clip_4 (`Cannot allocate memory` on moov-atom move — renderer RAM pressure after Docker restart; clips delivered without those layers, deprioritized, not staged). Staged: `posts/2026-09-17_why-is-keith-richards-in-gta-6_90.mp4` (7.1 MB) + `*_CAPTION.txt`. NOT posted — human gate decides |
| 2026-09-19 | **Whop COD_1 v4 clip: YouTube LIVE on Wybe; Bilibili skipped (cookies expired)** | ✅ 22.3 s 1080×1920 60 fps NVENC (`Whop_Campaigns/COD_1/out/MW4_BloodthirstyStreak_V4.mp4`) — fresh single-take streak play from TopPlays 119.75–142 (zero overlap v1/v2/v3): mid-gunfire cold open → "BLOODTHIRSTY!" medal → punch-in rooftop DOUBLE KILL → "BLOODTHIRSTY x2" + "DAY ONE OCT 23" → artillery-beacon kill; persistent "MW4 OPEN BETA - THIS WEEKEND" banner, POS logo watermark top-right (source's own bottom logo collided with a bottom placement — corner wins), English HUD only, original audio -14 LUFS. All 6 beats frame-verified. Posted to **YouTube (Wybe)** `https://youtube.com/shorts/zVpV2WvPweE` via `post_whop_v4.py --post --only youtube`; page verified live (title + 22 s). YT OAuth re-minted via `login_yt_printurl.py` — first consent landed on the wrong account ('shivam tripathi'), re-ran and account-chosen **Wybe** (check confirms). Caption file `MW4_BloodthirstyStreak_V4_CAPTION.txt` (exact pre-order phrase + own-line #Ad + @callofduty + 3 tags) handed to user for the manual IG leg. ⚠️ Bilibili leg skipped by user choice — cookies still `-101` expired |
| 2026-09-19 | **Fresh-research viral short via openshorts pipeline (IGN Sept-2026 releases, GTA 6 dodge-window topic)** | ✅ researched the week's gaming hooks (busiest release month in years because publishers dodge GTA 6's Nov 19 drop — NBA 2K27 / Valheim 1.0 / Code Vein II; sources: IGN, GameInformer, GamingBuddy, r/Games) → ran `viral-job.ps1` on IGN "The Biggest Game Releases of September 2026" (`8CpXbD0FXBA`, 12:19): job `a9b19fc5`, docker download HD 88 s → GPU whisper (cuda, 12-min video transcribed ~6 min) → Gemini scoring → 5 clips 25.1/28.9/31.1/32.6/33.0 s (all in band), scores 85/78/90/82/75. Top pick **clip_3 (90, 31 s, "The most chaotic racing game ever made." — Hot Wheels Infinite Rush)**: 1080×1920, hook overlay + karaoke captions + punch-in frame-verified at t=5 s (t=2/t=15 first checks landed outside overlay/caption windows). Staged `posts/2026-09-19_the-most-chaotic-racing-game-you-need-to-see_90.mp4` + `_CAPTION.txt`. NOT posted — human gate. New tooling: `scripts/job-status.ps1 -JobId <id>` (API status+logs+clip list without the 90-min poller) |
| 2026-09-19 | **Market-skill comparison run: `video-clip-editor` skill vs openshorts (new topic: Sony "you don't own digital games" lawsuit)** | ✅ installed the Qoder-market `video-clip-editor` skill and ran its Mode-B workflow end-to-end on a NEW source + topic: Gaming Hardcore "Gaming News - September 18" (`jPmzz1wHcio`, 8:19, uploaded same day). Host yt-dlp download → faster-whisper large-v3-turbo w/ word timestamps (⚠️ container CUDA broken after host reboot — `CUDA driver version is insufficient` — ran CPU int8 instead, ~11 min for 8 min audio) → sentence-boundary clip 8.59→33.79 s (25.2 s, in band) → dense word-chunked captions (7 lines, 100% of runtime covered) → ffmpeg 9:16 blur-fill reframe + hook overlay. Output `posts/2026-09-19_sony-you-dont-own-your-games_SKILL-EDIT.mp4` + `.srt` + `_CAPTION.txt`; frame-verified t=1/12/24, silencedetect proves speech starts at frame 0 with the full word "First" (0.15 s pre-pad before the word start). **Comparison vs openshorts:** skill's word-timestamp snapping GUARANTEES no mid-sentence start (the reported openshorts defect — its Gemini-scored ranges can begin mid-word) and its captions cover every second (openshorts karaoke had gaps that made the clip skippable); openshorts wins on automation (one command, Gemini moment scoring + hooks + titles), face-tracked 9:16 (skill uses static blur-fill), punch-ins, GPU speed. Skill's CapCut-draft/TTS legs unused (no JianYing in this pipeline; original audio kept). **Best of both: openshorts moment discovery + skill's sentence-boundary cut + full-coverage caption rules.** NOT posted — human gate |
| 2026-09-19 | **Accent rejection + remake: US-narrator source for the Sony clip** | ⚠️→✅ User rejected the first market-skill Sony cut purely for the Gaming Hardcore narrator's Indian accent ("remake with proper accent voice") — English-language is necessary but NOT sufficient; accent is a source-selection gate. Saved as a durable rule (user memory) and remade with the SAME skill workflow on Atomic Niko "You Don't Own Your Video Games (And Sony Proved It in Court)" (`xxzW01tsjxg`, US narrator, 4:47): cut 27.41→53.83 (26.4 s, in band) — every boundary is a whole sentence ("When you scroll…" → "…the digital games they purchase."), 11 dense caption lines covering 100% of runtime, hook "SONY: you DON'T own your games", courtroom Heycock v. Sony visual lands at t=16 s (frame-verified t=1/t=16; silencedetect: 0.12 s pad then full first word). `skill_edit.py` now takes `SKILL_SOURCE`/`SKILL_SEGS` env overrides. `posts/…_SKILL-EDIT.mp4` replaced. Container GPU still down after restart (`CUDA driver version is insufficient` — host driver/image mismatch) — CPU int8 transcription used (~8 min for 4.8 min audio). NOT posted — human gate |
| 2026-09-20 | **Skill-edit batch: 10 clips + 10 scheduled YouTube posts in Postiz (2/day x 5 days)** | ✅ New dedicated folder `posts/skill-edit/` (+ README documenting the format rules). Researched 10 current gaming topics (Sept 10-19, 2026) and cut all 10 with the market-skill rules: `gta6-physical` 25.7s, `gamepass-day1` 20.6s, `kojima-physint-sony` 27.4s, `gtaonline2-twitch` 26.7s, `wow-forever-blizzcon` 17.8s, `re-movie-review` 25.1s, `steamframe-price` 25.4s, `nintendo-sale-loophole` 23.5s, `kh-keyblade-fortnite` 21.0s, `psn-boycott` 26.4s — all 1080x1920, every boundary a whole sentence, 8-13 dense caption lines each covering 100% of runtime, hook banner frame-verified for all 10 in one contact sheet, silencedetect proves **zero** leading silence >0.12s in any clip. Sources: 8 IGN (Damon/Max - neutral US), 1 IGN BlizzCon interview, 1 GameXplain + 1 Evolve (US channels, accent not audio-verified - swap candidates if rejected). New tooling: `scripts/render-skill-edit.ps1` (plan.tsv -> render -> stage -> manifest), `scripts/schedule-skill-edit.ps1` (manifest -> Postiz upload + schedule, dry-run by default), `market_skill_run/one_source.sh` must run **serially** (3 parallel faster-whisper loads corrupt the shared model read: `File model.bin is incomplete`). **Postiz auth root cause found**: the public API compares the raw `Authorization` header to `Organization.apiKey` - a `Bearer ` prefix makes every request fail (307 -> /auth on the frontend path, 401 "Invalid API key" on `/api/public/v1`); correct form is `Authorization: <key>` + `/api/public/v1/...`, which is why the Sept-6 audit saw `[]`. YouTube "Wybe" (`cmtyl9cnn0001lmbq35ej4p1r`) is connected. LIVE: 10 posts confirmed `QUEUE` for 2026-09-20 -> 2026-09-24 at 04:30 and 13:00 UTC (10:00 / 18:30 local), one per slot; a single upload+schedule+delete smoke test was run first to prove the leg |
| 2026-09-20 | **Skill-edit batch first-fire diagnosis: 10:00 IST slot missed, three causes fixed/one user action left** | Docker Desktop was not running when the first slot came due (no auto-start after reboot) -> nothing fired. Booting the stack exposed a second bug: the orchestrator's Temporal worker connect races the temporal container and gives up permanently (`Failed to create worker connection` at 07:48) -> overdue posts sat in QUEUE until `docker restart postiz`. Third bug: /upload hands back `http://localhost:4007/uploads/...` and the YouTube provider HEADs http paths through its SSRF guard -> `Blocked IP`; even a bare `/uploads/...` double-joins (provider prepends UPLOAD_DIRECTORY). Fixed: all 10 rows' `Post.image` rewritten to upload-dir-relative `/2026-MM-DD/<hash>.mp4` (verified the provider joins it to `/uploads`), and `schedule-skill-edit.ps1` now strips the host+`/uploads` prefix from the upload response before creating posts. Retry tool: `PUT /api/public/v1/posts/<id>/status {"status":"schedule"}` re-queues AND restarts the Temporal workflow (wrapped in gitignored `.tmp-auth/retry-post.ps1`). **Remaining blocker (user action): Google rejected Postiz's stored YouTube `refresh_token` ("Please re-authenticate your YouTube account") -> reconnect the Wybe channel in the Postiz UI (localhost:4007); the 9 future slots will fire on their own once re-connected, GTA-6-physical needs one retry afterwards.** RESOLVED 08:23 UTC: user re-connected the Wybe channel in the Postiz UI, one `retry-post.ps1` call later the GTA-6-physical post is PUBLISHED (https://www.youtube.com/watch?v=Ek7RnRC_Y7o, title verified via oEmbed) and the other 9 sit in QUEUE for their slots. Operational gap to remember: the scheduler only fires while Docker Desktop is running - it does not auto-start on boot Note: uploader.bat's own YT OAuth is separate and still valid - direct posting was NOT used, keeping the single Postiz leg honest |
| 2026-09-20 | **18:30 IST slot missed (empty Postiz refresh token) -> recovered via direct uploader leg** | The UI reconnect at ~17:00 IST fixed the access token but left `Integration.refreshToken` EMPTY (length 0 verified via psql) - Google only issues a refresh_token on a brand-new grant, so the 13:00 UTC Game Pass post errored on the expired ~1 h access token. Recovery for the missed slot: new `market_skill_run/post_skill_edit_one.py <clip> --post` (dry-run default) posts a staged posts/skill-edit/ file straight through the uploader YouTube adapter (its own OAuth, `check` passed) - **gamepass-day1 PUBLISHED: https://youtube.com/shorts/1vN5vjtBmVQ** (oEmbed-verified title/channel). Permanent fix still pending a USER action: revoke the app at myaccount.google.com/connections FIRST, then reconnect in the Postiz UI - only that order stores a refresh token; until then every slot >~1 h after reconnect fails |
