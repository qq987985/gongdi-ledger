@echo off
chcp 65001 >nul
taskkill /F /FI "WINDOWTITLE eq 工地台账*" >nul 2>nul
echo 已停止工地台账。
pause
