-- ============================================================
-- Santo Favo — Etiquetas de Validade — Policy de update em recipes
--
-- `recipes` já tem uma policy de update das Fichas Técnicas
-- ("Admin e editor podem editar receitas", using get_my_role() in
-- ('admin','editor')). Como user_roles está vazia hoje, nenhuma conta
-- de tablet passa nessa checagem — testado empiricamente: um update
-- autenticado nas colunas de validade retornava 0 linhas, sem erro.
--
-- Esta policy é adicional (múltiplas policies permissivas na mesma
-- tabela/ação são combinadas com OR pelo Postgres) — não remove nem
-- substitui a policy de admin/editor já existente, só abre mais um
-- caminho de acesso.
--
-- Nota: RLS do Postgres não restringe por coluna. Esta policy libera
-- update em QUALQUER coluna de `recipes` para autenticados, não só as
-- 4 colunas de validade — nosso server action nunca envia outras
-- colunas, mas fica registrado como risco residual caso alguém chame
-- a API diretamente. Aceitável aqui porque os tablets são dispositivos
-- confiáveis (não acesso público), e `products` já usa esse mesmo
-- padrão permissivo neste banco.
-- ============================================================

create policy "Autenticados podem atualizar receitas (etiquetas)"
  on recipes for update
  to authenticated using (true) with check (true);
