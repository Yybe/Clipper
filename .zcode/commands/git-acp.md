---
description: git add + commit + push with a message describing what changed
---

Run the full add-commit-push cycle for this repository (pushes to https://github.com/Yybe/Clipper):

1. Run `git status --short` and `git diff --stat` (plus `git diff --cached --stat` if things are already staged) to see exactly what changed.
2. Secret guard: NEVER stage `.env`, `cookies.txt`, `posts/` media, or anything under `openshorts/output/`, `openshorts/uploads/`, `openshorts/.cache/`. They are gitignored — if a secret-looking file IS staged or untracked-and-unignored, stop, fix `.gitignore`, and tell the user before committing.
3. Stage: `git add -A`.
4. Commit with a message that explicitly states WHAT was changed: one concise subject line, then short bullets for each notable change (feature / bug fix / refactor / docs). Reference PLAN.md phase or file names where useful. Use a heredoc for the message. If the user passed arguments, fold them in: $ARGUMENTS
5. Push: `git push` (first time on a new machine: `git push -u origin main`).
6. Report back: commit hash, subject line, push result, and anything you deliberately did NOT commit.

House rule (also in AGENTS.md): run this after every major change, feature implementation, and bug fix — not in between.
