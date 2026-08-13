-- ============================================================
-- Santo Favo — Etiquetas de Validade — Mapeamento Auth → Loja
--
-- Modelo de login: uma conta Supabase Auth por loja/tablet (não por
-- funcionário). O tablet fica autenticado o dia todo; o campo
-- `responsaveis.pin` é só atribuição rápida de quem imprimiu/deu
-- baixa, não uma segunda camada de autenticação.
--
-- IMPORTANTE: este banco já tem `public.get_my_role()` (usado pela RLS
-- das Fichas Técnicas, lendo de `user_roles`) — não tocamos nele. Nossa
-- função de loja tem nome próprio para não colidir.
-- ============================================================

create table usuarios_loja (
  user_id uuid primary key references auth.users(id) on delete cascade,
  loja_id uuid not null references stores(id) on delete restrict
);

create or replace function public.get_my_loja_id()
returns uuid
language sql
security definer
stable
as $$
  select loja_id from public.usuarios_loja where user_id = auth.uid();
$$;
