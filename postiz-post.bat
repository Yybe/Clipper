@echo off
rem Clipper - post/schedule a finished clip through the LOCAL self-hosted Postiz.
rem DRY-RUN by default (lists clips + connected Postiz channels, sends nothing).
rem Real post needs:  postiz-post.bat <job_id> -ClipIndex <N> -Post
rem Schedule instead: add  -ScheduledDate "2026-09-13T12:30:00"  (local time, converted to UTC)
rem Safe API test (no social network touched): add -Draft
rem Bilibili not supported by Postiz - use uploader.bat for that.
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\postiz-post.ps1" %*
