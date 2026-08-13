import type { Database } from "./database";

export type Responsavel = Database["public"]["Tables"]["responsaveis"]["Row"];
export type Etiqueta = Database["public"]["Tables"]["etiquetas"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Recipe = Database["public"]["Tables"]["recipes"]["Row"];

export type OrigemCatalogo = "product" | "recipe";

/**
 * Formato unificado para as telas escolherem entre `products` (insumos
 * comprados) e `recipes` (preparações feitas na casa) sem precisar saber
 * de onde cada item veio até a hora de gravar a etiqueta.
 */
export type ItemCatalogo = {
  origem: OrigemCatalogo;
  id: string;
  nome: string;
  grupo: string | null;
  dias_ambiente: number | null;
  dias_refrigerado: number | null;
  dias_congelado: number | null;
};

export function produtoParaItemCatalogo(p: Product): ItemCatalogo {
  return {
    origem: "product",
    id: p.id,
    nome: p.name,
    grupo: p.category,
    dias_ambiente: p.dias_ambiente,
    dias_refrigerado: p.dias_refrigerado,
    dias_congelado: p.dias_congelado,
  };
}

export function receitaParaItemCatalogo(r: Recipe): ItemCatalogo {
  return {
    origem: "recipe",
    id: r.id,
    nome: r.title,
    grupo: r.category,
    dias_ambiente: r.dias_ambiente,
    dias_refrigerado: r.dias_refrigerado,
    dias_congelado: r.dias_congelado,
  };
}

export function mesmoItem(a: ItemCatalogo | null, b: ItemCatalogo): boolean {
  return a != null && a.origem === b.origem && a.id === b.id;
}

/**
 * Categorias de `products` que entram no catálogo de etiquetas. Embalagens,
 * material de apoio e material de consumo não têm validade — lista de
 * inclusão (só Insumos*) para uma categoria nova não-alimentar nunca vazar
 * para a cozinha por engano.
 */
export function categoriaEhAlimenticia(categoria: string | null): boolean {
  return categoria != null && categoria.toLowerCase().startsWith("insumos");
}
