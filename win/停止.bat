@echo off
chcp 65001 >nul
REM 与 启动.bat 同一套判定：zip 根目录（= 安装根）与 win\ 子目录下都能用（见 win/pack.sh）
if exist "%~dp0app\server\index.mjs" (
  cd /d "%~dp0"
) else (
  cd /d "%~dp0.."
)
powershell -NoProfile -Command "$p = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*app/server/index.mjs*' }; if ($p) { $p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; exit 0 }; exit 1" >nul 2>nul
if %errorlevel% equ 0 (
  echo GongDi Ledger stopped.
) else (
  echo No running GongDi Ledger process found.
)
pause
