# Recalibra o sensor de etiquetas da impressora termica (comando ZPL ~JC).
# Usar depois de trocar o rolo de etiquetas, ou quando saem etiquetas em
# branco / o conteudo sai fora de posicao. Nao precisa de administrador.
# Uso: calibrar-impressora.ps1 [-SoTestar]   (-SoTestar nao envia nada)
param([switch]$SoTestar)

$ErrorActionPreference = "Stop"
$dir = $PSScriptRoot

$cfg = @{}
Get-Content (Join-Path $dir ".env") | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
    $i = $_.IndexOf('=')
    $cfg[$_.Substring(0, $i).Trim()] = $_.Substring($i + 1).Trim()
}

$impressora = $cfg["IMPRESSORA"]
if (-not $impressora) { throw "Falta IMPRESSORA no .env desta pasta." }

if ($SoTestar) {
    Write-Host "Teste: enviaria ~JC para a impressora '$impressora'."
    return
}

$tmp = Join-Path $env:TEMP "calibrar-etiquetas.zpl"
[IO.File]::WriteAllText($tmp, "~JC", (New-Object System.Text.UTF8Encoding($false)))
try {
    & (Join-Path $dir "imprimir-raw.ps1") -Printer $impressora -Path $tmp
} finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Calibracao enviada para '$impressora'."
Write-Host "A impressora vai puxar algumas etiquetas (podem sair em branco) e parar sozinha."
Write-Host "Espere uns 15 segundos antes de imprimir de novo."
