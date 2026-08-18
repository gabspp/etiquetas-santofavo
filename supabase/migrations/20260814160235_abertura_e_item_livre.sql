-- ============================================================
-- Santo Favo — Etiquetas de Validade — Abertura + item livre
--
-- 1) "Aberto": prazo único por item (independente do modo de
--    conservação) para embalagens já guardadas que foram abertas hoje.
--    É um evento (abertura) ortogonal à conservação — o item continua
--    guardado de um jeito (ambiente/refrigerado/congelado), só que a
--    contagem de validade passa a usar este prazo em vez do prazo do
--    modo.
--
-- 2) "Item livre": etiqueta para algo que ainda não está cadastrado em
--    products/recipes. `nome_livre` guarda o nome digitado na hora; a
--    validade é sempre digitada manualmente (não tem prazo cadastrado
--    pra calcular a partir de quê).
-- ============================================================

alter table products add column dias_apos_abertura int;
alter table recipes add column dias_apos_abertura int;

alter table etiquetas add column nome_livre text;

alter table etiquetas drop constraint produto_xor_recipe;

alter table etiquetas add constraint origem_etiqueta check (
  (case when produto_id is not null then 1 else 0 end) +
  (case when recipe_id is not null then 1 else 0 end) +
  (case when nome_livre is not null then 1 else 0 end) = 1
);
