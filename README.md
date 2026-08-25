# Etiquetas — Santo Favo

App interno de etiquetas de validade para as duas unidades (26 e 248). Substitui o SaaS
pago. Ver `design-tokens-santofavo.md` para a origem dos tokens visuais.

> `PROMPT-claude-code.md` é o spec histórico — o modelo de validade mudou depois dele:
> em vez de "tipo de data" (fabricação/manipulação/abertura), cada item tem um **prazo
> por modo de conservação** (Temperatura ambiente / Refrigerado 0–4 °C / Congelado
> -18 °C), e o operador escolhe o modo na hora de imprimir.

## Arquitetura

```
celular/PC (navegador)
   └── web/            Next.js 16, mobile-first — Imprimir · Validades · Cadastro
         └── Supabase  (projeto compartilhado com estoque-santofavo e fichas-tecnicas)
               ├── products/recipes  + dias_ambiente/refrigerado/congelado (aditivo)
               ├── etiquetas         snapshot congelado por impressão (auditoria)
               ├── responsaveis      atribuição rápida (PIN opcional, não é autenticação)
               ├── usuarios_loja     conta de tablet → loja (RLS por loja_id)
               └── fila_impressao    ZPL pronto, status pendente/impressa/erro
                     └── agente-impressao/   roda no PC da loja, escuta via Realtime
                           └── impressora térmica USB (Zebra ZD220 / Elgin L42 Pro,
                               spooler RAW do Windows — sem QZ Tray)
```

Imprimir de qualquer celular funciona porque o navegador nunca fala com a impressora:
o app enfileira o ZPL e o agente da loja despacha (~1 s). Login: uma conta Supabase
Auth por loja; o tablet/celular fica logado e a RLS isola os dados por `loja_id`.

## Rodando o app (dev)

```bash
cd web
npm install
npm run test    # calcular-validade + gerar-zpl (snapshot)
npm run dev     # http://localhost:3000 — celulares na mesma rede: http://<ip-do-pc>:3000
```

`web/.env.local` já aponta para o projeto Supabase compartilhado. Migrations em
`supabase/migrations/` são aplicadas pelo usuário via SQL Editor do Studio (banco
compartilhado de produção — ver `supabase/README.md`).

## Impressora (uma vez por loja)

Ver `agente-impressao/README.md`: instalar o driver da impressora no Windows, preencher
o `.env` do agente (conta da loja + nome da impressora) e rodar o agente **como serviço
do Windows via NSSM** (seção "Rodando como serviço do Windows" no README do agente) —
o modo `npm start`/janela de console fica só para teste, é frágil em produção (janela
pode ser fechada, processo não reinicia sozinho se cair).

## Status de verificação

- Testado de verdade: fluxo completo no banco real (imprimir → fila → agente → status
  `impressa`/`erro`), isolamento RLS entre lojas, telas em viewport de celular e desktop,
  15 testes unitários + lint + typecheck + build, impressão física na Zebra da loja 26
  (agente rodando como serviço NSSM, com restart automático testado).
- **Ainda não validado**: agente/serviço na loja 248 (só a 26 tem o serviço NSSM
  instalado até agora); layout ZPL pode precisar de ajuste fino conforme mais etiquetas
  reais saem.
