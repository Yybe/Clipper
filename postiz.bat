@echo off
rem Postiz self-hosted scheduler stack (docker compose). Bilibili NOT supported - that stays on uploader.bat.
rem   postiz.bat start | stop | restart | logs | status | update
rem UI: http://localhost:4007   Public API: http://localhost:4007/api/public/v1
rem First run: copy postiz\.env.example to postiz\.env, set POSTIZ_JWT_SECRET.
setlocal
cd /d "%~dp0postiz"
set "COMPOSE=docker compose -f docker-compose.yaml"
if "%~1"=="" goto usage

if /i "%~1"=="start" (
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
  echo Postiz UI: http://localhost:4007  ^(first boot takes a couple of minutes^)
  exit /b 0
)
if /i "%~1"=="stop"   ( %COMPOSE% down & exit /b 0 )
if /i "%~1"=="restart" ( %COMPOSE% down & %COMPOSE% up -d & exit /b 0 )
if /i "%~1"=="logs"   ( %COMPOSE% logs -f postiz & exit /b 0 )
if /i "%~1"=="status" ( %COMPOSE% ps & exit /b 0 )
if /i "%~1"=="update" ( %COMPOSE% pull & %COMPOSE% up -d & exit /b 0 )

:usage
echo Usage: postiz.bat start^|stop^|restart^|logs^|status^|update
exit /b 1
