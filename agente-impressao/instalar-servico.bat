@echo off
setlocal
title Instalar servico do agente de impressao - Santo Favo

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Pedindo permissao de administrador do Windows...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" >nul 2>&1
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar-servico.ps1"
echo.
pause
