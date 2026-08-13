-- ============================================================
-- Santo Favo — Etiquetas de Validade — Etiquetas
--
-- produto_id XOR recipe_id: mesmo padrão já usado por
-- element_ingredients (product_id / sub_recipe_id) neste banco — uma
-- etiqueta vem de um item comprado (products) ou de uma preparação
-- feita na casa (recipes), nunca dos dois.
--
-- snapshot é obrigatório e não-negociável: se o prazo de um produto/
-- receita mudar, as etiquetas já impressas precisam continuar contando
-- a história correta numa auditoria sanitária. Nunca renderize uma
-- etiqueta a partir do cadastro atual — sempre a partir do snapshot.
-- ============================================================

create table etiquetas (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references stores(id),
  produto_id uuid references products(id),
  recipe_id uuid references recipes(id),
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
  snapshot jsonb not null,              -- nome, conservação e prazo vigentes na impressão
  constraint produto_xor_recipe check (
    (produto_id is not null and recipe_id is null) or
    (produto_id is null and recipe_id is not null)
  )
);

create index etiquetas_validade_idx on etiquetas (loja_id, data_validade)
  where status = 'ativa';
