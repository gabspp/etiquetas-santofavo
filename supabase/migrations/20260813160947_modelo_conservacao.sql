-- ============================================================
-- Santo Favo — Etiquetas de Validade — Modelo por conservação
--
-- Troca o modelo "tipo de data" (fabricação/manipulação/abertura)
-- pelo modelo real de cozinha: a validade padrão depende de COMO o
-- item vai ser guardado. Ex.: Ganache dura 7 dias refrigerada e 90
-- congelada. Na impressão o operador escolhe o modo de conservação
-- e a validade sai do prazo configurado para aquele modo.
--
-- Modos: Temperatura ambiente / Refrigerado 0–4 °C / Congelado -18 °C.
-- Adicionar um modo novo no futuro = mais uma coluna dias_<modo>.
--
-- As colunas antigas (conservacao, dias_fabricacao/manipulacao/
-- abertura) foram criadas por este mesmo app hoje e só continham
-- valores de teste — seguro removê-las.
-- ============================================================

alter table products
  drop column if exists conservacao,
  drop column if exists dias_fabricacao,
  drop column if exists dias_manipulacao,
  drop column if exists dias_abertura;

alter table products
  add column dias_ambiente int,
  add column dias_refrigerado int,
  add column dias_congelado int;

alter table recipes
  drop column if exists conservacao,
  drop column if exists dias_fabricacao,
  drop column if exists dias_manipulacao,
  drop column if exists dias_abertura;

alter table recipes
  add column dias_ambiente int,
  add column dias_refrigerado int,
  add column dias_congelado int;

-- etiquetas: guarda a conservação escolhida na impressão (texto do
-- rótulo, congelado no tempo junto com o snapshot). tipo_data e
-- validade_fabricante saem; quantidade/unidade saem da etiqueta
-- (o fluxo de cozinha é: item → conservação → responsável → cópias).
delete from etiquetas; -- só existem linhas de teste de hoje

alter table etiquetas
  drop column tipo_data,
  drop column validade_fabricante,
  drop column quantidade,
  drop column unidade,
  add column conservacao text not null;

-- responsaveis: a loja pode remover os seus (a UI tenta delete e cai
-- para ativo=false quando o responsável já tem etiquetas registradas)
create policy "Loja remove seus responsáveis"
  on responsaveis for delete
  to authenticated using (loja_id = public.get_my_loja_id());

-- Valores de exemplo para os itens já usados no teste — AJUSTAR com os
-- prazos reais da operação:
update products set dias_ambiente = 180
  where name in ('Chocolate Amargo', 'Amendoim');
update recipes set dias_refrigerado = 7, dias_congelado = 90
  where title = 'Ganache de Chocolate';
update recipes set dias_ambiente = 30
  where title = 'Biscoito Crocante - Pailleté Feuilletine';
