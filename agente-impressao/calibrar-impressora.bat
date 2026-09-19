@echo off
setlocal
title Calibrar impressora - Santo Favo
cd /d "%~dp0"

echo Calibrando o sensor de etiquetas da impressora...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0calibrar-impressora.ps1"
echo.
pause
