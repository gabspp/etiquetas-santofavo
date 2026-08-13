# Design tokens — Santo Favo

Este app não tem acesso a um pacote compartilhado de design system — o
projeto irmão `fichas-tecnicas` também não tem um (é copy-paste entre
projetos, não um monorepo). Este arquivo documenta exatamente o que foi
copiado de lá, para que futuras mudanças de marca não fiquem sem rastro.

**Fonte**: `fichas-tecnicas/web/src/app/globals.css` e `layout.tsx`
(lidos diretamente, não resumidos por terceiros).

## Princípio

"Marrom sobre creme, não preto sobre branco." Sem sombras, sem
gradientes, sem emojis na UI, sem `rounded-full` fora de casos muito
específicos. Hierarquia por linha fina + tipografia + contraste de fundo,
não por sombra.

## Onde estão os tokens neste projeto

- `web/src/app/globals.css` — bloco `:root` / `[data-theme="dark"]` /
  `@theme inline`, copiado verbatim.
- `web/src/app/layout.tsx` — carregamento de fontes via `next/font/google`
  (Newsreader + DM Sans). Inter é proibido.

## Valores (copiados, não reinventados)

```
--bg:        #F8F1E0   --ink:       #72381C   --accent: #FFCC1C
--bg-soft:   #F2E9D2   --ink-soft:  #8C4820
--bg-card:   #FBF6E9   --ink-muted: #A88560
--rule:      rgba(114,56,28,.5)   --rule-soft: rgba(114,56,28,.15)
--radius-sm: 3px  --radius-md: 4px  --radius-lg: 6px  --radius-pill: 100px
```

`--brand-rosa` ganhou um uso definido neste app: erros de formulário e a
faixa de "vencido" na tela Validades (em vez de vermelho puro, que o
princípio de marca proíbe). `--brand-verde` e `--brand-roxo` seguem sem
uso — evitar usá-las sem necessidade clara (ex. não inventar categorias
coloridas).

## Componentes novos (não existem em Fichas Técnicas, criados aqui)

Marcados com comentário `// NOVO` no código-fonte quando introduzidos:

- Grid de cards grandes para seleção de produto (`imprimir/_components/product-picker.tsx`).
- Stepper de quantidade/cópias com botões grandes (`imprimir/_components/qty-stepper.tsx`).
- Teclado numérico grande para PIN (`components/responsavel-picker.tsx` — compartilhado
  entre Imprimir e Validades, por isso vive fora da rota).
- Navegação em pill entre telas (`components/app-nav.tsx`) — só existe porque agora há
  mais de uma tela.
- Faixa colorida por urgência na lista de Validades (`validades/_components/etiqueta-item.tsx`):
  borda esquerda `--brand-rosa` (vencido), `--accent` (hoje), `--brand-marrom` (≤48h),
  `--rule-soft` (normal).

Seguem o mesmo tom visual dos componentes existentes (bordas finas,
`rounded-md`/`rounded-lg`, sem sombra, pill apenas em botões de ação
secundária como em `export-zip-button.tsx`).
