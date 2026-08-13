-- ============================================================
-- Santo Favo — Etiquetas de Validade — Validade padrão em products/recipes
--
-- Em vez de duplicar o catálogo numa tabela `produtos` própria, estendemos
-- as duas tabelas que já existem neste banco (compartilhado com
-- estoque-santofavo e fichas-tecnicas):
--   - products  → itens comprados ("Insumos")
--   - recipes   → preparações feitas na casa ("Bases"/"Recheios"/"Produção")
--
-- Todas as colunas são nullable e sem default — puramente aditivo, não
-- afeta nenhuma linha existente nem quebra `select *` de outros apps.
-- Um item só aparece no seletor de etiquetas quando pelo menos um
-- dias_* é preenchido (isso substitui a necessidade de um campo
-- "ativo para etiqueta" separado).
-- ============================================================

alter table products add column conservacao text;
alter table products add column dias_fabricacao int;
alter table products add column dias_manipulacao int;
alter table products add column dias_abertura int;

alter table recipes add column conservacao text;
alter table recipes add column dias_fabricacao int;
alter table recipes add column dias_manipulacao int;
alter table recipes add column dias_abertura int;
