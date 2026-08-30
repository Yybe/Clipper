@echo off
rem Check the Upload-Post key and which platforms are connected (read-only).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\check-social.ps1"
pause
