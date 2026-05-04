@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\generate-audio-manifest.ps1"
echo.
echo Lista de canciones actualizada.
pause
