@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Alibi needs Node.js 20 or newer. Install Node.js, then try again.
  pause
  exit /b 1
)
if not defined PORT set PORT=3000
start "Alibi" "http://localhost:%PORT%"
node server.mjs
pause
