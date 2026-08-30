@echo off
rem ============================================================
rem Clipper - run a URL through the VERIFIED VIRAL FORMAT profile
rem (PLAN.md section 2: hook overlay, 15-34s band, punch-ins,
rem auto layouts, karaoke captions, loop-aware prompts).
rem Usage: viral-clip.bat <video-or-stream-url> [extra args]
rem   e.g. viral-clip.bat <url> -MaxSourceHeight 1080
rem Source download defaults to a 720p cap (root .env
rem MAX_SOURCE_HEIGHT); extra args override per job.
rem ============================================================
setlocal
set URLARG=%~1
if "%URLARG%"=="" (
    set /p URLARG=Paste the video/stream URL:
)
shift
set REST=
:nextarg
if [%1]==[] goto :forward
set REST=%REST% %1
shift
goto :nextarg
:forward
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\viral-job.ps1" -Url "%URLARG%"%REST%
pause
