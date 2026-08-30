@echo off
rem One-time (and re-runnable) setup for the Clipper Uploader venv.
setlocal
cd /d "%~dp0\.."
if not exist "uploader\.venv" (
  echo Creating uploader venv ^(Python 3.11^) ...
  py -3.11 -m venv uploader\.venv
  if errorlevel 1 py -3 -m venv uploader\.venv
  if errorlevel 1 python -m venv uploader\.venv
)
uploader\.venv\Scripts\python.exe -m pip install --disable-pip-version-check -r uploader\requirements.txt
if errorlevel 1 exit /b 1
echo.
uploader\.venv\Scripts\python.exe -m uploader doctor
echo.
echo Next: uploader.bat check   ^(shows each platform's one-time credential steps^)
