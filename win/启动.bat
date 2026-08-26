@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 工地台账

if not exist "node\node.exe" (
  echo 缺少 node\node.exe，请重新解压完整压缩包。
  pause
  exit /b 1
)
if not exist "app\server\index.mjs" (
  echo 缺少 app\server\index.mjs，请重新解压完整压缩包。
  pause
  exit /b 1
)

mkdir "data\accounts" 2>nul
mkdir "data\books" 2>nul
mkdir "data\backups" 2>nul
mkdir "data\templates" 2>nul
mkdir "data\photos\id" 2>nul
mkdir "data\photos\bank" 2>nul
mkdir "data\photos\ic" 2>nul
mkdir "data\photos\报量单" 2>nul
mkdir "data\photos\发票" 2>nul
mkdir "data\photos\收款回单" 2>nul
mkdir "data\photos\考勤影像" 2>nul

set "GONGDI_HOME=%~dp0"
set GONGDI_PORTABLE=1
set UPDATE_REPO=qq987985/gongdi-ledger
set "DATA_DIR=%~dp0data"
set "PHOTO_DIR=%~dp0data\photos"
set "PHOTO_ID_DIR=%~dp0data\photos\id"
set "PHOTO_BANK_DIR=%~dp0data\photos\bank"
set "PHOTO_IC_DIR=%~dp0data\photos\ic"
set NITRO_HOST=0.0.0.0
set NITRO_PORT=8501
set HOST=0.0.0.0
set PORT=8501
set NODE_ENV=production

echo 工地台账已启动
echo 浏览器打开: http://127.0.0.1:8501
echo 关掉本窗口即停止。数据在 data 文件夹。
echo.

start "" "http://127.0.0.1:8501"
"%~dp0node\node.exe" "%~dp0app\server\index.mjs"
echo.
echo 已停止。
pause
