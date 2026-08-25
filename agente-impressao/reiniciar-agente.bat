@echo off
setlocal
title Reiniciar agente de impressao - Santo Favo

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Pedindo permissao de administrador do Windows...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" >nul 2>&1
    exit /b
)

cd /d "%~dp0"
echo.
echo Reiniciando o servico de impressao...
echo.
nssm restart SantoFavoAgenteImpressao
echo.
echo Status atual:
nssm status SantoFavoAgenteImpressao
echo.
echo Se aparecer SERVICE_RUNNING acima, o agente esta de pe e escutando a fila.
echo Se nao imprimir mesmo assim, confira a impressora: ligada, com etiqueta e fita, USB conectado.
echo.
pause
