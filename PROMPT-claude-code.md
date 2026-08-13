# Sistema de etiquetas de validade — Santo Favo

Construa um app interno de impressão de etiquetas de validade para uma fábrica-loja de
chocolate bean-to-bar com duas unidades (26 e 248). Substitui um SaaS pago.
O operador é um funcionário de cozinha usando tablet com as mãos ocupadas: a tela
principal precisa resolver em poucos toques, sem digitação, com alvos grandes.

## Antes de escrever código

1. Leia o repositório do design system da Santo Favo e use os tokens, componentes e
   tipografia de lá. Não invente uma identidade nova; se faltar um componente, crie-o
   seguindo as convenções existentes e comente que é novo.
2. Rode `supabase migration new` para cada bloco de schema em vez de editar tabelas pelo
   painel — as migrations precisam ficar versionadas no repo.
3. Proponha o plano de arquivos antes de gerar tudo, e espere confirmação.

## Stack

- Next.js (App Router, TypeScript), mesmo padrão dos projetos Fichas Técnicas e Malta
- Supabase: Postgres, Auth, RLS
- Impressão: Zebra ZD220 ou Elgin L42 Pro via ZPL, com QZ Tray fazendo a ponte
  navegador → impressora. Encapsule isso atrás de uma interface `Printer` para que
  trocar de estratégia (print server local, PDF) não vaze para o resto do app.

## Schema

```sql
create table lojas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,          -- '26', '248'
  nome text not null,
  cnpj text,
  criado_em timestamptz default now()
);

create table responsaveis (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id) on delete cascade,
  nome text not null,
  pin text,                             -- 4 dígitos, identificação rápida no tablet
  ativo boolean default true
);

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  grupo text,                           -- Insumos | Bases | Recheios | Produção
  conservacao text not null,            -- 'Temperatura ambiente' | 'Refrigerado 0–4 °C'
  unidade text default 'kg',            -- kg | L | un
  fornecedor text,
  dias_fabricacao int,                  -- null = tipo de data não se aplica
  dias_manipulacao int,
  dias_abertura int,
  ficha_tecnica_id uuid,                -- link opcional para Fichas Técnicas
  ativo boolean default true,
  constraint prazo_minimo check (
    coalesce(dias_fabricacao, dias_manipulacao, dias_abertura) is not null
  )
);

create table etiquetas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references lojas(id),
  produto_id uuid references produtos(id),
  responsavel_id uuid references responsaveis(id),
  tipo_data text not null check (tipo_data in ('fabricacao','manipulacao','abertura')),
  data_base date not null,
  data_validade date not null,
  validade_fabricante date,             -- teto: a validade nunca a ultrapassa
  quantidade numeric(10,3),
  unidade text,
  copias int default 1,
  status text default 'ativa' check (status in ('ativa','consumida','descartada','cancelada')),
  baixada_em timestamptz,
  baixada_por uuid references responsaveis(id),
  impressa_em timestamptz default now(),
  snapshot jsonb not null               -- nome, conservação e prazo vigentes na impressão
);

create index etiquetas_validade_idx on etiquetas (loja_id, data_validade)
  where status = 'ativa';
```

`snapshot` é obrigatório e não-negociável: se o prazo de um produto mudar, as etiquetas já
impressas precisam continuar contando a história correta numa auditoria sanitária. Nunca
renderize uma etiqueta a partir do cadastro atual — sempre a partir do snapshot.

RLS: todo acesso filtrado por `loja_id` do usuário autenticado. Um operador da 26 não lê
nem escreve dados da 248.

## Regra de cálculo

`data_validade = data_base + dias_<tipo_data>`, limitada por `validade_fabricante` quando
informada. Se o teto cortar o prazo, a interface avisa antes de imprimir — silenciosamente
encurtar a validade confunde a equipe.

## Telas

**Imprimir** (principal, otimizada para tablet)
Lista de produtos agrupada com busca; seleção de tipo de data (só os tipos que o produto
aceita); data com padrão hoje; quantidade; cópias com botões grandes; responsável.
Pré-visualização fiel da etiqueta ao lado. Um botão de impressão dominante.

**Validades**
Contadores de vencidos e vencem hoje; filtros vencidos / hoje / 48 h / tudo; lista ordenada
por vencimento com faixa colorida. Cada item permite dar baixa como consumido ou
descartado — esse registro alimenta o relatório de perdas, que é o dado mais valioso do
sistema e o que o SaaS não entrega bem.

**Produtos**
CRUD do catálogo, restrito a administradores.

## Layout da etiqueta (ZPL)

Etiqueta térmica de 40 × 60 mm. Faixa horizontal: nome do produto em caixa alta e grande,
conservação abaixo, linha com tipo de data + data + quantidade + responsável, e a data de
validade em bloco invertido (fundo preto, texto branco) ocupando a lateral direita — é o
campo que precisa ser lido a três metros de distância.

Sem QR code, sem lote, sem código: a operação não usa nenhum dos três.
Inclua `SANTO FAVO <código da loja>` em corpo pequeno no topo.

Gere o ZPL no servidor e cubra com testes de snapshot, comparando string. Fixe o modo com
`^XA^SZ2^XZ` no início em vez de confiar na autodetecção de linguagem da impressora.

## Fora de escopo nesta versão

Recebimento com registro de temperatura, contagem de estoque, alerta de estoque mínimo,
dashboard multiunidade. Não implemente nada disso, nem deixe hooks preparando o terreno.

## Critérios de aceite

- Um operador imprime uma etiqueta em até cinco toques a partir da tela inicial.
- Mudar o prazo de um produto não altera nenhuma etiqueta já impressa.
- Um usuário da loja 26 não consegue ler etiquetas da 248, nem via API direta.
- O ZPL gerado imprime na Zebra e na Elgin sem alteração de código.
- A data de validade nunca ultrapassa `validade_fabricante`.

## Como trabalhar

Comece pelo schema e pelas migrations, depois o cálculo de validade com testes, depois o
gerador de ZPL com testes, e só então a interface. Não gere as três telas de uma vez;
entregue a tela Imprimir funcionando ponta a ponta antes de seguir.
