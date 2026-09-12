@echo off
rem Postiz self-hosted scheduler stack (docker compose). Bilibili NOT supported - that stays on uploader.bat.
rem   postiz.bat start | stop | restart | logs | status | update
rem UI: http://localhost:4007   Public API: http://localhost:4007/api/public/v1
rem First run: copy postiz\.env.example to postiz\.env, set POSTIZ_JWT_SECRET.
setlocal
cd /d "%~dp0postiz"
set "COMPOSE=docker compose -f docker-compose.yaml"
if "%~1"=="" goto usage
if /i "%~1"=="stop"   ( %COMPOSE% down & exit /b 0 )
if /i "%~1"=="restart" goto restart
if /i "%~1"=="logs"   ( %COMPOSE% logs -f postiz & exit /b 0 )
if /i "%~1"=="status" ( %COMPOSE% ps & exit /b 0 )
if /i "%~1"=="update" ( %COMPOSE% pull & %COMPOSE% up -d & exit /b 0 )
if /i not "%~1"=="start" goto usage

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker is not running - start Docker Desktop first ^(or run start.bat^).
  exit /b 1
)
if not exist .env (
  echo Missing postiz\.env - copy postiz\.env.example to postiz\.env and set POSTIZ_JWT_SECRET first.
  exit /b 1
)
%COMPOSE% up -d
echo Postiz UI: http://localhost:4007 - waiting for backend, first boot takes a couple of minutes...
rem Known Postiz boot race: backend can lose the port-3000 bind at container
rem start and sit "online" in pm2 while dead (UI stuck, all API calls 502).
rem Probe the API through nginx and kick pm2 when it happens.
set /a tries=0
:waitloop
ping -n 11 127.0.0.1 >nul
set "CODE=000"
for /f "delims=" %%i in ('curl -s -o nul -m 5 -w "%%{http_code}" -X POST "http://localhost:4007/api/auth/login" -H "Content-Type: application/json" -d "{}"') do set "CODE=%%i"
if not "%CODE%"=="502" if not "%CODE%"=="000" goto up_ok
set /a tries+=1
echo Probe %tries%: backend not answering yet (%CODE%).
if %tries% geq 3 (
  echo Restarting backend inside the container...
  docker exec postiz pm2 restart backend >nul 2>&1
  ping -n 21 127.0.0.1 >nul
)
if %tries% lss 8 goto waitloop
echo WARNING: backend did not come up after 8 probes - check postiz.bat logs
exit /b 1
:up_ok
echo Postiz is up: http://localhost:4007
exit /b 0

:restart
%COMPOSE% down
call "%~f0" start
exit /b %ERRORLEVEL%

:usage
echo Usage: postiz.bat start^|stop^|restart^|logs^|status^|update
exit /b 1
