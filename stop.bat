@echo off
rem ============================================================
rem Clipper - STOP the whole project (containers only; Docker
rem Desktop itself keeps running unless you also close it)
rem Usage: double-click, or run from a terminal: stop.bat
rem ============================================================

setlocal
set PROJECT=%~dp0

echo [1/2] Stopping OpenShorts containers...
cd /d "%PROJECT%openshorts"
docker-compose stop
if %errorlevel% neq 0 (
    echo ERROR: docker-compose stop failed. Is Docker Desktop running?
    pause
    exit /b 1
)

echo [2/2] Done. Containers are stopped.
echo   - All clips, jobs and settings are kept on disk (openshorts\output, openshorts\.env).
echo   - To also close Docker Desktop itself, right-click its tray icon and Quit,
echo     or run: stop-full.bat
pause
