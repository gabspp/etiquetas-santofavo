-- ============================================================
-- Santo Favo — Etiquetas de Validade — Row Level Security
--
-- Só nas tabelas novas (usuarios_loja, responsaveis, etiquetas).
-- products/recipes/stores/user_roles ficam exatamente como estão —
-- não alteramos RLS de tabelas que outros apps já usam em produção.
--
-- Todo acesso a responsaveis/etiquetas é filtrado por loja_id do
-- usuário autenticado via get_my_loja_id(). Um operador da loja 26
-- não lê nem escreve dados da loja 248, nem via API direta.
-- ============================================================

alter table usuarios_loja enable row level security;
alter table responsaveis  enable row level security;
alter table etiquetas     enable row level security;

-- ---------- usuarios_loja ----------
-- Uma conta de tablet só precisa resolver seu próprio mapeamento.
-- Sem insert/update/delete pela aplicação — provisionamento é feito
-- via cliente service-role, fora do caminho de request normal.
create policy "Usuário vê seu próprio mapeamento de loja"
  on usuarios_loja for select
  to authenticated using (user_id = auth.uid());

-- ---------- responsaveis ----------
create policy "Loja vê seus responsáveis"
  on responsaveis for select
  to authenticated using (loja_id = public.get_my_loja_id());

create policy "Loja cria seus responsáveis"
  on responsaveis for insert
  to authenticated with check (loja_id = public.get_my_loja_id());

create policy "Loja edita seus responsáveis"
  on responsaveis for update
  to authenticated using (loja_id = public.get_my_loja_id());

-- ---------- etiquetas ----------
-- Sem policy de delete: baixa (consumida/descartada) é update de
-- status, não remoção — mantém rastro para auditoria e relatório de
-- perdas.
create policy "Loja vê suas etiquetas"
  on etiquetas for select
  to authenticated using (loja_id = public.get_my_loja_id());

create policy "Loja cria suas etiquetas"
  on etiquetas for insert
  to authenticated with check (loja_id = public.get_my_loja_id());

create policy "Loja atualiza suas etiquetas"
  on etiquetas for update
  to authenticated using (loja_id = public.get_my_loja_id());
