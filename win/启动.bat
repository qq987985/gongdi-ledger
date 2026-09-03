@echo off
chcp 65001 >nul
cd /d "%~dp0.."
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

if exist "data\VERSION.txt" (
  echo 清理 data\VERSION.txt 旧挂载残留...
  rmdir /S /Q "data\VERSION.txt" 2>nul
  del /F /Q "data\VERSION.txt" 2>nul
)

echo 正在初始化数据目录...
if not exist "data" (
  echo 首次运行，创建 data 目录结构...
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
  echo 目录创建完成。
) else (
  echo data 目录已存在，跳过创建。
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
echo  工地台账已启动
echo  浏览器打开: http://127.0.0.1:8501
echo  关掉本窗口即停止。数据在 data 文件夹。
echo ========================================
echo.
echo 等待服务启动...

REM 先启动 Node 服务（后台），然后等待一下再打开浏览器
start /b "" "%CD%\node\node.exe" "%CD%\app\server\index.mjs"

REM 等待服务启动（最多等 5 秒）
set /a count=0
:wait_loop
timeout /t 1 /nobreak >nul 2>&1
set /a count+=1
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8501/api/health' -TimeoutSec 2 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% == 0 goto service_ready
if %count% lss 5 goto wait_loop

:service_ready
REM 服务已就绪，打开浏览器
start "" "http://127.0.0.1:8501"

REM 等待 Node 进程结束
echo.
echo 服务运行中，按任意键停止...
pause >nul

REM 停止 Node 进程
taskkill /F /IM node.exe >nul 2>&1
echo.
echo 已停止。
timeout /t 2 >nul
