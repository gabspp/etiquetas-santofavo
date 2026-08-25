-- ============================================================
-- fila_impressao — novo status "imprimindo" para claim atomico
--
-- Bug real (25/08/2026, loja 26): dois processos do agente rodando ao
-- mesmo tempo (um orfao de sessao antiga + o servico novo) leram o
-- mesmo item "pendente" antes de qualquer um marcar como impresso, e
-- os dois despacharam para a impressora -> etiqueta saiu duplicada.
--
-- Fix: o agente agora faz um UPDATE condicional (WHERE status =
-- 'pendente') para "reivindicar" o item antes de imprimir. Esse UPDATE
-- e atomico no Postgres — mesmo com dois agentes rodando, so um
-- consegue afetar a linha; o outro ve 0 linhas afetadas e pula. Isso
-- exige um estado intermediario (nem pendente, nem impressa) para o
-- claim nao se confundir com sucesso real.
-- ============================================================

alter table fila_impressao drop constraint if exists fila_impressao_status_check;

alter table fila_impressao add constraint fila_impressao_status_check
  check (status in ('pendente', 'imprimindo', 'impressa', 'erro'));
