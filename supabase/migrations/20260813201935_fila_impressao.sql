-- ============================================================
-- Santo Favo — Etiquetas de Validade — Fila de impressão
--
-- Impressão pelo celular: o app não fala com a impressora. Ao tocar
-- "Imprimir", o server action grava o ZPL pronto aqui; o agente de
-- impressão (agente-impressao/, rodando no PC de cada loja) escuta a
-- fila via Realtime e despacha para a impressora térmica local.
--
-- O agente autentica com a MESMA conta de tablet da loja, então a RLS
-- por loja_id vale para ele também: o agente da 26 nunca vê (nem
-- imprime) etiquetas da 248.
-- ============================================================

create table fila_impressao (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references stores(id),
  etiqueta_id uuid references etiquetas(id),
  zpl text not null,                     -- pronto para a impressora (^PQ já embutido)
  status text not null default 'pendente' check (status in ('pendente','impressa','erro')),
  erro text,
  criada_em timestamptz not null default now(),
  impressa_em timestamptz
);

create index fila_impressao_pendentes_idx on fila_impressao (loja_id, criada_em)
  where status = 'pendente';

alter table fila_impressao enable row level security;

create policy "Loja vê sua fila"
  on fila_impressao for select
  to authenticated using (loja_id = public.get_my_loja_id());

create policy "Loja enfileira suas impressões"
  on fila_impressao for insert
  to authenticated with check (loja_id = public.get_my_loja_id());

create policy "Loja atualiza sua fila"
  on fila_impressao for update
  to authenticated using (loja_id = public.get_my_loja_id());

-- Habilita o Realtime na tabela — é assim que o agente fica sabendo de
-- um novo item na hora, sem polling agressivo.
alter publication supabase_realtime add table fila_impressao;
