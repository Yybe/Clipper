@echo off
rem Clipper Uploader - self-hosted posting to YouTube / Instagram / Bilibili.
rem DRY-RUN by default. Real post (human gate, same rule as post-clip.ps1):
rem   uploader.bat list --job <job_id>
rem   uploader.bat post --job <job_id> --clip <N> --post
rem One-time setup: uploader\setup-deps.bat, then: uploader.bat check
setlocal
cd /d "%~dp0"
set "PY=%~dp0uploader\.venv\Scripts\python.exe"
if not exist "%PY%" (
  echo Uploader venv not found. Run: uploader\setup-deps.bat
  exit /b 1
)
"%PY%" -m uploader %*
