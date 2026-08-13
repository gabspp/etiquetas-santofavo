import type { Etiqueta } from "@/types/models";

export type EtiquetaComProduto = Etiqueta & {
  products: { name: string } | null;
  recipes: { title: string } | null;
};

export type FiltroValidade = "vencidos" | "hoje" | "48h" | "tudo";
