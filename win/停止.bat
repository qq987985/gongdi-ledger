@echo off
chcp 65001 >nul
cd /d "%~dp0.."
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*app/server/index.mjs*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
if %errorlevel% equ 0 (
  echo GongDi Ledger stopped.
) else (
  echo No running GongDi Ledger process found.
)
pause
