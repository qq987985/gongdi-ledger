@echo off
chcp 65001 >nul
cd /d "%~dp0.."
title GongDi Ledger

if not exist "node\node.exe" (
  echo [ERROR] Missing node\node.exe. Please re-extract the full package.
  pause
  exit /b 1
)
if not exist "app\server\index.mjs" (
  echo [ERROR] Missing app\server\index.mjs. Please re-extract the full package.
  pause
  exit /b 1
)

if exist "data\VERSION.txt" (
  echo Cleaning up old data\VERSION.txt mount residue...
  rmdir /S /Q "data\VERSION.txt" 2>nul
  del /F /Q "data\VERSION.txt" 2>nul
)

echo Initializing data directory...
if not exist "data" (
  echo First run, creating data directory structure...
  mkdir "data"
  mkdir "data\accounts"
  mkdir "data\books"
  mkdir "data\backups"
  mkdir "data\templates"
  mkdir "data\photos\id"
  mkdir "data\photos\bank"
  mkdir "data\photos\ic"
  mkdir "data\photos\report"
  mkdir "data\photos\invoice"
  mkdir "data\photos\receipt"
  mkdir "data\photos\attendance"
  mkdir "data\photos\contract"
  mkdir "data\photos\expense"
  mkdir "data\photos\payout"
  echo Directory creation complete.
) else (
  echo data directory exists, skipping creation.
)

set "GONGDI_HOME=%CD%"
set GONGDI_PORTABLE=1
set UPDATE_REPO=qq987985/gongdi-ledger
set "DATA_DIR=%CD%\data"
set "PHOTO_DIR=%CD%\data\photos"
set "PHOTO_ID_DIR=%CD%\data\photos\id"
set "PHOTO_BANK_DIR=%CD%\data\photos\bank"
set "PHOTO_IC_DIR=%CD%\data\photos\ic"
set NITRO_HOST=127.0.0.1
set HOST=127.0.0.1
set NITRO_PORT=8501
set PORT=8501
set NODE_ENV=production

echo.
echo ========================================
echo  GongDi Ledger
echo  http://127.0.0.1:8501
echo  Close this window to stop
echo ========================================
echo.

REM Start Node in background, wait for ready, then open browser
start /b "" "%CD%\node\node.exe" "%CD%\app\server\index.mjs" >"%CD%\node.log" 2>&1

REM Wait for service to be ready (check up to 10 seconds)
set /a count=0
:wait_loop
timeout /t 1 /nobreak >nul 2>&1
set /a count+=1
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8501/api/health' -TimeoutSec 2 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% == 0 goto service_ready
if %count% lss 10 goto wait_loop

echo [WARN] Service may still be starting, opening browser anyway...

:service_ready
REM Service ready, open browser
start "" "http://127.0.0.1:8501"

echo.
echo Service running. Press any key to stop...
pause >nul

REM Stop Node process
taskkill /F /IM node.exe >nul 2>&1
echo Stopped.
timeout /t 2 >nul
