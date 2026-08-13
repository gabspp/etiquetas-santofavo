# Supabase — etiquetas-santofavo

Este app usa o **mesmo projeto Supabase** do `estoque-santofavo` e do `fichas-tecnicas`
(`pnpoyhwdjconuillhfcz.supabase.co`) — não é um projeto isolado. `stores` (lojas),
`products` (insumos) e `recipes` (preparações) já existem e são reaproveitados.

Por ser um banco compartilhado com dados reais de outros apps, o DDL é aplicado **pelo
usuário** via SQL Editor do Supabase Studio, colando os arquivos em ordem — nunca via CLI
com a senha do banco. Depois de aplicar, regerar os tipos TypeScript (à mão, ver
`web/src/types/database.ts` — este ambiente não tem Docker para
`supabase gen types typescript --local`).

## Migrations, na ordem

1. `responsaveis` — tabela nova (sem equivalente no banco existente). `pin` é só
   atribuição rápida no tablet, não autenticação.
2. `extend_products_recipes_validade` — histórica: adicionava `conservacao` +
   `dias_fabricacao/manipulacao/abertura` em `products`/`recipes`. **Substituída** pela
   migration 7 abaixo (modelo trocado de "tipo de data" para "modo de conservação").
3. `etiquetas` — tabela nova, `produto_id` XOR `recipe_id` (mesmo padrão de
   `element_ingredients.product_id`/`sub_recipe_id` já usado neste banco).
4. `auth_loja_mapping` — tabela `usuarios_loja` (conta de tablet → loja) + função
   `get_my_loja_id()`. **Não** toca em `get_my_role()`, que já existe e é usada pela RLS
   das Fichas Técnicas.
5. `rls_policies` — RLS nas tabelas novas (`usuarios_loja`, `responsaveis`, `etiquetas`).
   RLS de `products`/`recipes`/`stores`/`user_roles` fica como estava.
6. `recipes_update_policy` — `recipes` já tinha uma policy de update restrita a
   admin/editor (`get_my_role()`); como `user_roles` está vazia, nenhuma conta de tablet
   passava. Policy adicional (permissiva, somam-se com OR) liberando update para
   qualquer `authenticated` — mesmo padrão já usado em `products` neste banco.
7. `modelo_conservacao` — **o modelo atual**: troca `dias_fabricacao/manipulacao/abertura`
   por `dias_ambiente/refrigerado/congelado` em `products`/`recipes` (prazo por modo de
   armazenagem, não por tipo de data). `etiquetas` perde `tipo_data`/`validade_fabricante`/
   `quantidade`/`unidade` e ganha `conservacao text not null` (o modo escolhido na
   impressão, congelado no snapshot). Adiciona policy de `delete` em `responsaveis`.
8. `fila_impressao` — tabela nova: o app enfileira o ZPL pronto em vez de falar com a
   impressora direto (é isso que permite imprimir do celular). RLS por `loja_id` +
   `alter publication supabase_realtime add table fila_impressao` para o agente de
   impressão (`agente-impressao/`) escutar em tempo real.

## Passo pós-deploy: provisionar contas de tablet

`usuarios_loja` não é semeado por migration — depende de contas Supabase Auth reais.
`stores` já tem as duas lojas (`Loja 26` / code `26`, `Loja 248` / code `248`).

Para cada loja, criar/reaproveitar um usuário Auth (via `supabase.auth.admin.createUser`
ou reaproveitando um já existente neste projeto — nunca em um caminho de request normal
do app) e inserir:

```sql
insert into usuarios_loja (user_id, loja_id)
values ('<uuid do usuário>', (select id from stores where code = '26'));
```

Script pronto para isso: `web/scripts/provisionar-conta-loja.mjs`.

## Impressão

Ver `agente-impressao/README.md` — o app nunca fala com a impressora diretamente; ele
grava o ZPL em `fila_impressao` e o agente (rodando no PC de cada loja) despacha.
