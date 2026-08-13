import { createClient } from "@/lib/supabase/server";
import {
  categoriaEhAlimenticia,
  produtoParaItemCatalogo,
  receitaParaItemCatalogo,
} from "@/types/models";
import { ImprimirScreen } from "./_components/imprimir-screen";

export default async function ImprimirPage() {
  const supabase = await createClient();

  // Só itens com pelo menos um modo de conservação configurado entram no
  // fluxo de impressão — é isso que separa o que é etiquetável do resto.
  const comPrazo = "dias_ambiente.not.is.null,dias_refrigerado.not.is.null,dias_congelado.not.is.null";

  const [{ data: products }, { data: recipes }, { data: responsaveis }, { data: minhaLoja }] =
    await Promise.all([
      supabase.from("products").select("*").or(comPrazo).order("name"),
      supabase.from("recipes").select("*").or(comPrazo).order("title"),
      supabase.from("responsaveis").select("*").eq("ativo", true).order("nome"),
      supabase.from("usuarios_loja").select("loja_id, stores(code)").single(),
    ]);

  const itens = [
    ...(products ?? [])
      .filter((p) => categoriaEhAlimenticia(p.category))
      .map(produtoParaItemCatalogo),
    ...(recipes ?? []).map(receitaParaItemCatalogo),
  ];

  const lojaCodigo = (minhaLoja?.stores as { code: string } | null)?.code ?? "?";

  return (
    <ImprimirScreen itens={itens} responsaveis={responsaveis ?? []} lojaCodigo={lojaCodigo} />
  );
}
