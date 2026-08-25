@echo off
setlocal
title Status do agente de impressao - Santo Favo
cd /d "%~dp0"

echo === Servico ===
powershell -NoProfile -Command "try { 'Status: ' + (Get-Service SantoFavoAgenteImpressao -ErrorAction Stop).Status } catch { 'Servico nao encontrado - rode instalar-servico.bat' }"
echo.
echo === Ultimos itens da fila ===
call node check-fila.mjs
echo.
echo -----------------------------------------------------------------
echo Se o servico estiver RUNNING e o item mais recente estiver "impressa"
echo mas nada saiu da impressora: confira etiqueta/fita/USB na impressora.
echo Se o servico NAO estiver RUNNING, ou algum item ficar "pendente" por
echo mais de 1 minuto: rode reiniciar-agente.bat (nesta mesma pasta).
echo -----------------------------------------------------------------
echo.
pause
