@echo off
rem ============================================================
rem Clipper - post/schedule a finished clip (Upload-Post).
rem Default is a DRY-RUN listing; posting needs -Post + -Profile.
rem Usage: post-clip.bat <job_id> [-ClipIndex 0 -Post -Profile <name>]
rem ============================================================
setlocal
if "%~1"=="" (
    echo Usage: post-clip.bat ^<job_id^> [-ClipIndex N -Post -Profile ^<upload-post-profile^>]
    echo        Without -Post this just lists the job's clips and copy (dry-run).
    pause
    exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\post-clip.ps1" %*
pause
