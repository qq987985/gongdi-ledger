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
  mkdir "data\photos\报量单"
  mkdir "data\photos\发票"
  mkdir "data\photos\收款回单"
  mkdir "data\photos\考勤影像"
  mkdir "data\photos\合同扫描件"
  mkdir "data\photos\报销凭证"
  mkdir "data\photos\报销打款"
  mkdir "data\photos\保险合同"
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

REM Start Node and show output in this window
REM Open browser after a short delay
timeout /t 2 /nobreak >nul 2>&1
start "" "http://127.0.0.1:8501"

REM Run Node (this blocks until user closes window)
"%CD%\node\node.exe" "%CD%\app\server\index.mjs"

echo.
echo Stopped.
timeout /t 2 >nul
