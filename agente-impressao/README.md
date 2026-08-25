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
sozinho se cair (testado de verdade: matar o processo na mão, o serviço
sobe outro em ~5s).

### Instalar (ou reinstalar do zero)

Dar dois cliques em **`instalar-servico.bat`** (nesta pasta). Ele pede
permissão de administrador (UAC) e faz tudo sozinho: instala o NSSM via
chocolatey se não tiver, configura o serviço, desativa o atalho antigo de
`shell:startup` se existir (pra não rodar dois agentes em paralelo — ver
"Bug real" acima) e inicia. **É idempotente** — rodar de novo a qualquer
momento reconfigura do zero, sem quebrar nada. Use isso também para
configurar o agente numa loja nova (ex.: loja 248): copiar esta pasta,
preencher o `.env`, dar os dois cliques.

Precisa ter Node.js instalado e o `.env` já preenchido antes (passos 1-3
acima).

### No dia a dia — dois cliques, sem PowerShell

- **`verificar-status.bat`** — mostra se o serviço está rodando e os
  últimos itens da fila (equivalente a `nssm status` + `check-fila.mjs`
  num só clique). Não precisa de admin.
- **`reiniciar-agente.bat`** — reinicia o serviço. Pede UAC. Use depois de
  editar o `.env`, ou sempre que `verificar-status.bat` mostrar algo
  estranho (serviço parado, item preso em `pendente`).

Dica: crie atalhos desses dois `.bat` na Área de Trabalho (arrastar com o
botão direito → "Criar atalho aqui") para quem estiver na loja não precisar
nem abrir esta pasta.

### Comandos manuais (se preferir não usar os `.bat`)

```powershell
nssm status SantoFavoAgenteImpressao     # deve dizer SERVICE_RUNNING
nssm restart SantoFavoAgenteImpressao    # reinicia manualmente (ex.: depois de editar o .env)
type service-stdout.log                  # log de "logado como..." / "impressa <id>"
type service-stderr.log                  # erros do processo, se houver
```
Assim como no modo console: se você editar o `.env`, precisa reiniciar o
serviço (`reiniciar-agente.bat` ou `nssm restart ...`) para ele pegar os
novos valores.

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
Usa o mesmo `.env` do agente. (`verificar-status.bat` roda isso mesmo, com
dois cliques.)

Se o item mais recente aparecer `impressa` (sem `erro`) mas nada saiu da
impressora de verdade: o agente fez a parte dele (mandou os bytes pro
spooler do Windows com sucesso) — o problema está na impressora física
(etiqueta/fita fora, USB solto, cabeça de impressão aberta), não no
agente. `Get-Printer -Name "<nome>"` no PowerShell mostra o status e a
fila de impressão do Windows (`Get-PrintJob`) se quiser confirmar.
