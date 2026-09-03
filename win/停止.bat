@echo off
chcp 65001 >nul
cd /d "%~dp0.."
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*app/server/index.mjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
if %errorlevel% equ 0 (
  echo 已停止工地台账。
) else (
  echo 未找到运行中的工地台账进程。
)
pause
