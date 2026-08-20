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
4. Rodar:
   ```
   npm start
   ```
   Deixe a janela aberta. Toda etiqueta impressa no app (de qualquer
   celular/computador logado nesta loja) sai na impressora em ~1 segundo.

## Iniciar junto com o Windows

Criar um atalho para `iniciar-agente.bat` (nesta pasta) dentro de
`shell:startup` (Win+R → `shell:startup` → colar o atalho). O agente sobe
sozinho quando o PC liga.

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
