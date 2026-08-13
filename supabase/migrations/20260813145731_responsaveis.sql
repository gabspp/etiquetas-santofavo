-- ============================================================
-- Santo Favo — Etiquetas de Validade — Responsáveis
--
-- Sem equivalente no banco existente (que já tem `stores` para lojas).
-- pin: 4 dígitos, apenas identificação rápida no tablet — não é
-- credencial de autenticação. A fronteira de segurança é a sessão
-- Supabase Auth do tablet (ver migration auth_loja_mapping).
-- ============================================================

create table responsaveis (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references stores(id) on delete cascade,
  nome text not null,
  pin text,
  ativo boolean default true
);
