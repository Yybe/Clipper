@echo off
rem ============================================================
rem Clipper - STOP everything INCLUDING Docker Desktop itself
rem (frees the most RAM; use when you're done for the day)
rem ============================================================

setlocal
set PROJECT=%~dp0

echo [1/2] Stopping OpenShorts containers...
cd /d "%PROJECT%openshorts"
docker-compose stop

echo [2/2] Quitting Docker Desktop...
taskkill /f /im "Docker Desktop.exe" >nul 2>&1
taskkill /f /im "com.docker.backend.exe" >nul 2>&1

echo.
echo  Everything is stopped. Start again with start.bat
pause
