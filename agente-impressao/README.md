# Agente de impressão — Santo Favo Etiquetas

Roda no computador Windows de cada loja (o que tem a impressora térmica no
USB). Fica escutando a fila de impressão no Supabase e despacha cada
etiqueta para a impressora — é isso que permite imprimir a partir do
celular: o celular enfileira, o agente imprime.

Não precisa de QZ Tray: o agente fala direto com o spooler do Windows
(modo RAW, via `imprimir-raw.ps1`).

## Instalação (uma vez por loja)

1. Instalar o driver da impressora no Windows (Zebra ZD220: driver
   "ZDesigner" do site da Zebra; Elgin L42 Pro: driver do site da Elgin).
   Imprimir uma página de teste do próprio Windows para confirmar.
2. Instalar o [Node.js LTS](https://nodejs.org) se ainda não tiver.
3. Nesta pasta:
   ```
   npm install
   npm run listar          # mostra o nome exato das impressoras
   copy .env.example .env  # e preencher o .env
   ```
   No `.env`: a anon key do Supabase (mesma do app), o email/senha da conta
   de tablet **desta** loja, e o nome exato da impressora que apareceu no
   `npm run listar`.

   **Importante:** o agente só lê o `.env` uma vez, na hora que liga. Se
   editar o `.env` (trocar de impressora, de conta, senha) com o agente já
   rodando, ele continua usando o valor antigo até ser reiniciado — sem
   avisar, sem erro, só imprimindo (ou não) com a config velha. Depois de
   qualquer edição no `.env`: feche a janela do agente e abra de novo.
4. Rodar (ver "Rodando como serviço" abaixo para produção — isto aqui é só
   para testar antes de instalar o serviço):
   ```
   npm start
   ```
   Deixe a janela aberta. Toda etiqueta impressa no app (de qualquer
   celular/computador logado nesta loja) sai na impressora em ~1 segundo.

## Rodando como serviço do Windows (recomendado para produção)

O modo `npm start`/janela de console é frágil: alguém pode fechar a janela
sem querer, e se o processo cair (crash, update do Windows) nada o
reinicia — a fila fica acumulando `pendente` silenciosamente até alguém
notar que as etiquetas pararam de sair. Foi exatamente o que aconteceu na
loja 26 em 25/08/2026 (ver commit desta mudança).

Solução: rodar como serviço do Windows via [NSSM](https://nssm.cc) — sem
janela para fechar, sobe sozinho no boot mesmo sem login, e reinicia
sozinho se cair.

Instalação (uma vez por loja, requer privilégio de administrador):

```powershell
choco install nssm -y   # ou baixar de nssm.cc se não tiver chocolatey

$svc  = "SantoFavoAgenteImpressao"
$dir  = "<caminho completo desta pasta agente-impressao>"
$node = (Get-Command node).Source

nssm install $svc $node agente.mjs
nssm set $svc AppDirectory $dir
nssm set $svc AppStdout (Join-Path $dir "service-stdout.log")
nssm set $svc AppStderr (Join-Path $dir "service-stderr.log")
nssm set $svc AppRotateFiles 1
nssm set $svc AppRotateBytes 1048576
nssm set $svc Start SERVICE_AUTO_START
nssm set $svc AppExit Default Restart   # reinicia sozinho se o processo cair
nssm set $svc AppRestartDelay 5000
nssm start $svc
```

Se antes você tinha configurado o atalho de `iniciar-agente.bat` em
`shell:startup` (seção antiga abaixo), **desative-o** depois de instalar o
serviço — os dois rodando ao mesmo tempo processam a mesma fila e podem
imprimir a etiqueta duas vezes. Renomeie o `.lnk` para `.lnk.disabled` (não
precisa apagar).

Diagnóstico do serviço:
```powershell
nssm status SantoFavoAgenteImpressao     # deve dizer SERVICE_RUNNING
nssm restart SantoFavoAgenteImpressao    # reinicia manualmente (ex.: depois de editar o .env)
type service-stdout.log                  # log de "logado como..." / "impressa <id>"
type service-stderr.log                  # erros do processo, se houver
```
Assim como no modo console: se você editar o `.env`, precisa reiniciar o
serviço (`nssm restart ...`) para ele pegar os novos valores.

## Iniciar junto com o Windows (modo console — só se não usar o serviço acima)

Criar um atalho para `iniciar-agente.bat` (nesta pasta) dentro de
`shell:startup` (Win+R → `shell:startup` → colar o atalho). O agente sobe
sozinho quando o PC liga — mas só no login, e continua vulnerável a
alguém fechar a janela ou o processo cair sem ninguém notar. Prefira o
serviço NSSM acima.

## Como funciona

- Autentica com a conta de tablet da loja — a RLS por `loja_id` vale para
  o agente também: o agente da loja 26 não vê a fila da 248.
- Escuta `fila_impressao` via Supabase Realtime (aviso instantâneo) e, por
  segurança, revisa a fila a cada 20 s (pega o que ficou pendente se a
  conexão caiu ou se o PC estava desligado).
- Cada item vira `pendente → impressa` (ou `erro`, com a mensagem gravada
  na própria linha da fila para diagnóstico).

## Diagnóstico

`node check-fila.mjs` mostra os últimos 5 itens da fila de impressão desta
loja (status, erro, horários) — útil para conferir se um item enfileirado
pelo app está sendo pego pelo agente sem precisar abrir o Supabase Studio.
Usa o mesmo `.env` do agente.
