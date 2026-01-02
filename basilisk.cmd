@echo off
setlocal

REM Simple double-click launcher for Windows.
REM It installs dependencies if needed, then starts the Electron window.

pushd "%~dp0"
where npm >nul 2>&1
if errorlevel 1 (
  echo Node.js + npm are required. Download from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  npm install
  if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
  )
)

echo Launching Basilisk Lite...
npm start
popd
endlocal
