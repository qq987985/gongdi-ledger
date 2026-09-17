@echo off
chcp 65001 >nul
REM 这份 bat 在 zip 里有两份（同一个文件）：zip 根目录（= 安装根）与 win\ 子目录，见 win/pack.sh。
REM 所以不能无条件 cd 到上一级：先判断 %~dp0 自己是不是程序根目录，不是才上跳一级。
REM （原来固定 cd 到上一级：放在 zip 根的那份会切到安装根的上一层，随后报「请重新解压」这种误报；
REM  在线更新后的重启（src/lib/update/apply.ts）启动的正是 zip 根那份。）
if exist "%~dp0app\server\index.mjs" (
  cd /d "%~dp0"
) else (
  cd /d "%~dp0.."
)
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

REM Start Node in background (output stays in this window)
start "" /b "%CD%\node\node.exe" "%CD%\app\server\index.mjs"

REM Wait until the service is healthy (up to 60s), then open browser
setlocal enabledelayedexpansion
set READY=0
for /l %%i in (1,1,60) do (
  timeout /t 1 /nobreak >nul 2>&1
  for /f %%c in ('curl -s -o nul -w "%%{http_code}" http://127.0.0.1:8501/api/health 2^>nul') do if "%%c"=="200" set "READY=1"
  if "!READY!"=="1" goto ready
)
:ready
start "" "http://127.0.0.1:8501"

REM Keep this window open; Node runs in it until the window is closed
echo Node is running. Closing this window stops the service.
pause >nul

echo.
echo Stopped.
timeout /t 2 >nul
