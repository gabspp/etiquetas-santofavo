import { createClient } from "@/lib/supabase/server";
import {
  categoriaEhAlimenticia,
  produtoParaItemCatalogo,
  receitaParaItemCatalogo,
} from "@/types/models";
import { ProdutosScreen } from "./_components/produtos-screen";

export default async function ProdutosPage() {
  const supabase = await createClient();

  // Aqui buscamos TODOS os itens etiquetáveis (com ou sem prazo configurado)
  // — é justamente onde os prazos são configurados. Embalagens e materiais
  // de apoio/consumo ficam de fora: não têm validade.
  const [{ data: products }, { data: recipes }, { data: responsaveis }, { data: fila }] =
    await Promise.all([
      supabase.from("products").select("*").order("category").order("name"),
      supabase.from("recipes").select("*").order("category").order("title"),
      supabase.from("responsaveis").select("*").eq("ativo", true).order("nome"),
      supabase
        .from("fila_impressao")
        .select("*")
        .order("criada_em", { ascending: false })
        .limit(50),
    ]);

  const itens = [
    ...(products ?? [])
      .filter((p) => categoriaEhAlimenticia(p.category))
      .map(produtoParaItemCatalogo),
    ...(recipes ?? []).map(receitaParaItemCatalogo),
  ];

  return (
    <ProdutosScreen
      itensIniciais={itens}
      responsaveisIniciais={responsaveis ?? []}
      filaInicial={fila ?? []}
    />
  );
}
