@echo off
rem ============================================================
rem Clipper - START the whole project (OpenShorts in Docker)
rem Usage: double-click, or run from a terminal: start.bat
rem ============================================================

setlocal
set PROJECT=%~dp0

echo [1/3] Checking Docker Desktop...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        echo       Docker engine not running - starting Docker Desktop...
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    ) else (
        echo ERROR: Docker Desktop not found at C:\Program Files\Docker\Docker\
        echo        Install Docker Desktop first.
        pause
        exit /b 1
    )
)

echo [2/3] Waiting for the Docker engine to come up (up to ~2 min)...
set /a tries=0
:waitloop
timeout /t 5 /nobreak >nul
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    set /a tries+=1
    if %tries% lss 24 goto waitloop
    echo ERROR: Docker engine did not start in time. Open Docker Desktop manually and retry.
    pause
    exit /b 1
)
echo       Docker engine is up.

echo [3/3] Starting OpenShorts (backend :8000, web UI :5175, renderer :3100)...
cd /d "%PROJECT%openshorts"
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: docker-compose failed. See output above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Project is UP.
echo    Web UI (review queue, jobs):  http://localhost:5175
echo    API / docs:                   http://localhost:8000/docs
echo  First start after a reboot may take a minute to go healthy.
echo ============================================================
pause
