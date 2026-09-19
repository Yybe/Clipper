# Ready-to-post batch — 2026-09-19b (MARKET-SKILL EDIT: video-clip-editor, Sony ownership story)

**Pick:** `posts/2026-09-19_sony-you-dont-own-your-games_SKILL-EDIT.mp4` (25.2 s, 1080×1920)
Built with the Qoder-market `video-clip-editor` skill's Mode-B workflow (NOT openshorts) to fix the
two reported defects: cut snaps to whisper WORD timestamps at a sentence boundary ("First up, …" —
full first word audible, silencedetect-verified) and captions cover 100% of the runtime
(7 lines, word-timed). Hook burned: "SONY: you DON'T own your games". Source: Gaming Hardcore
"Gaming News - September 18" (`jPmzz1wHcio`). Caption: `*_CAPTION.txt` + same-timeline `.srt`.
Editor tooling kept at `scripts/skill_edit.py` (source in gitignored `market_skill_run/`).

Post when ready (dry-run first, human gate per AGENTS.md):
`uploader.bat post --job <this-file-directly> --clip 0` — this file is outside the openshorts job
layout, so post it via the direct-file path or copy into a job dir first.

---

# Ready-to-post batch — 2026-09-19 (fresh-research gaming short, IGN Sept-2026 slate)

**Pick:** `posts/2026-09-19_the-most-chaotic-racing-game-you-need-to-see_90.mp4` (31.1 s, 1080×1920, score 90)
Hook burned: "The most chaotic racing game ever made." — Hot Wheels Infinite Rush segment from IGN's
"The Biggest Game Releases of September 2026" (`8CpXbD0FXBA`), job `a9b19fc5-dc8b-4273-824d-34478348753f`.
Topic angle from research: Sept 2026 is the busiest release month in years because publishers are
dodging GTA 6's Nov 19 drop. Caption: `*_CAPTION.txt` alongside the MP4.
Alt picks from the same job (all in band): clip_1 (85, "Why was this game banned in Australia?"),
clip_4 (82, Grinch), clip_2 (78, farming), clip_5 (75, worst-trailer) — in `openshorts\output\a9b19fc5-…\`.

Post when ready (dry-run first, human gate per AGENTS.md):
`uploader.bat post --job a9b19fc5-dc8b-4273-824d-34478348753f --clip 2` then add `--post --yes` for the real leg.

---

# Ready-to-post batch — 2026-09-06/07 (multi-game viral batch)

**POSTED 2026-09-07** to the **Wybe** YouTube channel (@wybe5048, `xx.shiv.xx2212@gmail.com`) **AND Bilibili** (_Wybe_, uid 3745039282867460):

| Clip | Score | YouTube | Bilibili |
|---|---|---|---|
| "Rockstar really just finessed us all." | 92 | https://youtube.com/shorts/qtyxVepAXvk | https://www.bilibili.com/video/BV1LNbt6yEzS |
| "Wait, did you steal my car?!" | 90 | https://youtube.com/shorts/YBfKlaEUddM | https://www.bilibili.com/video/BV1vNbt6yE2H |
| "Oh shit, vampires? This is awesome." | 88 | https://youtube.com/shorts/XIXf4SZIcxM | https://www.bilibili.com/video/BV15Nbt6yE8y |
| "Is this the most brutal stealth game?" | 88 | https://youtube.com/shorts/oLjhM5T0fpo | https://www.bilibili.com/video/BV1VNbt6yEfH |
| "This massive 2K27 update is a W." | 88 | https://youtube.com/shorts/hWS5GB6tgTA | https://www.bilibili.com/video/BV15Nbt6yETm |

An earlier batch went to the wrong channel ("Shivam Tripathi", UCukwNg3W2iujMume3-3YpcA) before the
correct OAuth account was selected — those 5 URLs (`4YyxY6Q6TJ4`, `xweIW0EO7uk`, `JjfxecHze1s`,
`QtzQqViA3sk`, `T9K4xBeJv9s`) are duplicates on the wrong channel and can be deleted from YouTube
Studio.

8 sources → 8 completed jobs → 40 finished clips in the review queue
(`openshorts\output\<job_id>\`, also visible at <http://localhost:5175>).
Every clip below is the final captioned MP4 (`subtitled_*.mp4`), 1080×1920,
hook overlay + karaoke captions verified frame-by-frame.

**Why nothing is posted yet:** every posting leg is credential-blocked
(checked live 2026-09-06):

| Leg | Status |
|---|---|
| Upload-Post (YT + IG) | key valid, but **10/10 uploads used** (`last_reset 2026-08-28` → next window opens ~**Sep 28**). First post attempt tonight returned `429 … You have 0 upload(s) remaining` |
| YouTube self-hosted | OAuth app "Clipper" is in **Testing** mode and `omshiv2218@gmail.com` is not an approved tester (`403 access_denied`). Fix: Cloud Console → OAuth consent screen → add that account as test user (or publish the app), then `uploader.bat login --platform youtube` |
| Bilibili | cookies invalidated server-side (`-101 账号未登录`); browser is logged out too. Re-login in Chrome, re-export `BILI_SESSDATA`/`BILI_JCT`/`BILI_BUVID3` into `.env` |
| Instagram / Facebook / TikTok self-hosted | never configured (no Meta app token / TikTok OAuth) — `uploader.bat check` prints exact steps |

The moment ANY leg is unblocked, post in this order (one command per clip,
keep spacing between posts):

## Post set (top 5 — fits the Upload-Post 10-upload window: 5 clips × YT+IG)

| # | Job | Clip | Score | Hook (burned) | Game / source |
|---|---|---|---|---|---|
| 1 | `16f723a8-656f-4965-99f6-c8f1cefdd997` | 2 | **92** | "Rockstar really just finessed us all." | GTA 6 release-date reactions (Kai Cenat Live) |
| 2 | `8e2a41ea-bb87-4623-be4e-92dd777177d8` | 3 | **90** | "Wait, did you steal my car?!" | GTA 6 Extended Look live reaction (Kai Cenat) |
| 3 | `9fb326d1-f1d1-42ec-95a0-a287fa65ee89` | 1 | **88** | "Oh shit, vampires? This is awesome." | The Blood of Dawnwalker (Asmongold Clips) |
| 4 | `868dabb9-57a6-4b03-b7f9-a2c9c99f7b16` | 0 | **88** | "Is this the most brutal stealth game?" | Marvel's Wolverine (Blind Wave Gaming) |
| 5 | `be2b1f4b-76e5-4a0c-b153-119c70572238` | 0 | **88** | "This massive 2K27 update is a W." | NBA 2K27 (NotYourAverageFlight breakdown) |

```powershell
# Upload-Post leg (YouTube + Instagram), one command per clip:
post-clip.bat 16f723a8-656f-4965-99f6-c8f1cefdd997 -ClipIndex 2 -Post -Profile Wybe -Yes
post-clip.bat 8e2a41ea-bb87-4623-be4e-92dd777177d8 -ClipIndex 3 -Post -Profile Wybe -Yes
post-clip.bat 9fb326d1-f1d1-42ec-95a0-a287fa65ee89 -ClipIndex 1 -Post -Profile Wybe -Yes
post-clip.bat 868dabb9-57a6-4b03-b7f9-a2c9c99f7b16 -ClipIndex 0 -Post -Profile Wybe -Yes
post-clip.bat be2b1f4b-76e5-4a0c-b153-119c70572238 -ClipIndex 0 -Post -Profile Wybe -Yes
```

```powershell
# Self-hosted leg (once YT OAuth + Bilibili are unblocked), same clips:
uploader.bat post --job 16f723a8-656f-4965-99f6-c8f1cefdd997 --clip 2 --post --yes
uploader.bat post --job 8e2a41ea-bb87-4623-be4e-92dd777177d8 --clip 3 --post --yes
uploader.bat post --job 9fb326d1-f1d1-42ec-95a0-a287fa65ee89 --clip 1 --post --yes
uploader.bat post --job 868dabb9-57a6-4b03-b7f9-a2c9c99f7b16 --clip 0 --post --yes
uploader.bat post --job be2b1f4b-76e5-4a0c-b153-119c70572238 --clip 0 --post --yes
```

## Backups (next in line if a pick fails review or quota allows more)

| Job | Clip | Score | Hook | Note |
|---|---|---|---|---|
| `d2b150e9-bca3-48e0-8c7b-55c6a3dcb7e9` | 0 | 88 | "This move makes you look like a god" | Onimusha: Way of the Sword (Tyrone Magnus) — 6th clip, post first via self-hosted legs |
| `d47b8fad-3a0d-467c-b7a0-934d96813b86` | 2 | 85 | "A professional adapts. Are you one?" | GTA 6 Extended Look multi-streamer compilation (Jynxzi/Dontai/iShowSpeed) |
| `9fb326d1-f1d1-42ec-95a0-a287fa65ee89` | 0 | 85 | "Did I make an exception for children?" | Dawnwalker #2 |
| `d47b8fad-3a0d-467c-b7a0-934d96813b86` | 3 | 92 | "Why did they kill her?" | ⚠️ captions failed to burn on this one — hook + split layout OK, no karaoke |
| `16f723a8-656f-4965-99f6-c8f1cefdd997` | 0 | 88 | "I have to stay alive for GTA 6." | GTA 6 release-date #2 |

**Deliberately not picked:** `f981c351` (Wolverine, MohitVerse) — the source
is a Hindi channel, Gemini returned Devanagari hooks/titles; wrong market +
uncertain font rendering. Prefer English reaction channels for sources.

## Source provenance (all reaction/commentary — no raw publisher footage)

Rockstar explicitly permits reaction/breakdown content with commentary for
the GTA 6 Extended Look (no raw rebroadcast) — see gtaboom.com summary in
PLAN.md. Same transformative-commentary standard applied to every other
source: every clip is a creator's face-cam + commentary, re-edited with
burned hooks/captions/punch-ins by this pipeline.
