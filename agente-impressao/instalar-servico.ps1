# Instala/repara o agente de impressao como servico do Windows (NSSM).
# Idempotente: pode rodar de novo a qualquer momento para reconfigurar
# do zero (ex.: depois de mover a pasta, trocar de PC, ou se o servico
# ficar em estado estranho). Ver agente-impressao/README.md.

$ErrorActionPreference = "Stop"
$svc  = "SantoFavoAgenteImpressao"
$dir  = $PSScriptRoot

function AchandoNssm {
    $existente = Get-Command nssm.exe -ErrorAction SilentlyContinue
    if ($existente) { return $existente.Source }

    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "Instalando NSSM via chocolatey..."
        choco install nssm -y | Out-Host
        $depois = Get-Command nssm.exe -ErrorAction SilentlyContinue
        if ($depois) { return $depois.Source }
    }

    throw "NSSM nao encontrado e nao ha chocolatey neste PC para instalar. " +
          "Baixe manualmente em https://nssm.cc/download, extraia nssm.exe " +
          "(pasta win64) para dentro de '$dir', e rode este script de novo."
}

$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) {
    throw "Node.js nao encontrado. Instale o Node.js LTS (nodejs.org) antes de rodar este script."
}
if (-not (Test-Path (Join-Path $dir ".env"))) {
    throw "Falta o arquivo .env nesta pasta (copie .env.example e preencha antes de instalar o servico)."
}

$nssm = AchandoNssm
Write-Host "nssm: $nssm"
Write-Host "node: $node"
Write-Host "pasta: $dir"

$jaExiste = (& $nssm status $svc 2>$null)
if ($jaExiste -and $jaExiste -notmatch "does not exist") {
    Write-Host "Servico ja existe - parando e removendo para reconfigurar do zero..."
    & $nssm stop $svc 2>$null | Out-Null
    & $nssm remove $svc confirm | Out-Host
}

& $nssm install $svc $node "agente.mjs" | Out-Host
& $nssm set $svc AppDirectory $dir | Out-Host
& $nssm set $svc AppStdout (Join-Path $dir "service-stdout.log") | Out-Host
& $nssm set $svc AppStderr (Join-Path $dir "service-stderr.log") | Out-Host
& $nssm set $svc AppRotateFiles 1 | Out-Host
& $nssm set $svc AppRotateBytes 1048576 | Out-Host
& $nssm set $svc Start SERVICE_AUTO_START | Out-Host
& $nssm set $svc AppExit Default Restart | Out-Host
& $nssm set $svc AppRestartDelay 5000 | Out-Host
& $nssm set $svc DisplayName "Santo Favo - Agente de Impressao de Etiquetas" | Out-Host
& $nssm set $svc Description "Escuta a fila_impressao no Supabase e despacha ZPL para a impressora termica da loja. Ver agente-impressao/README.md" | Out-Host

# O atalho antigo de shell:startup (se existir) rodaria em paralelo com o
# servico e duplicaria impressoes - desativa se ainda estiver la.
$atalho = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\Agente de impressao - Santo Favo.lnk"
if (Test-Path $atalho) {
    Rename-Item $atalho "$atalho.disabled" -Force
    Write-Host "Atalho antigo de inicializacao desativado (rodaria em paralelo com o servico)."
}

& $nssm start $svc | Out-Host
Start-Sleep -Seconds 3
Write-Host ""
Write-Host "Status final:"
& $nssm status $svc | Out-Host
