@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js не найден. Установите его с https://nodejs.org и запустите файл снова.
  pause
  exit /b 1
)
node start-all.js
pause
