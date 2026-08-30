# Clipper — workspace rules

- **Commit policy:** after every major change, feature implementation, and bug fix, run the `/git-acp` slash command (git add + commit + push) and make the commit message state what was changed. Do not accumulate unrelated work into one commit.
- **Secrets:** real keys live only in the root `.env` (gitignored). Never commit, print, or hardcode `.env` contents, `cookies.txt`, or the Upload-Post JWT. If a new file contains secrets, gitignore it BEFORE any commit.
- **Repo layout:** the OpenShorts engine (upstream: github.com/mutonby/openshorts, MIT) is absorbed in `openshorts/` — local patches to `main.py` / `app.py` / `docker-compose.yml` / `gemini_worker.py` are intentional, documented in README.md "Built on OpenShorts", and get overwritten only on purpose. Tooling lives in `scripts/*.ps1` + `*.bat` wrappers.
- **Docs stay truthful:** PLAN.md's verification log is the source of truth for what is proven; update it (and README.md) as part of any change that alters pipeline behavior.
- **Verification discipline:** every pipeline change is verified against a real run before being declared done; record the run in PLAN.md's verification log.
- **Posting safety:** `post-clip.ps1` must stay dry-run by default; real posts need explicit `-Post` + a specific `-ClipIndex`. Platforms: YouTube + Instagram via Upload-Post (profile `Wybe`), Bilibili manual. Free tier = 10 uploads/month — do not batch-dump.
