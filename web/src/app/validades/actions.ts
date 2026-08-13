"use server";

import { createClient } from "@/lib/supabase/server";

export type StatusBaixa = "consumida" | "descartada";

export async function darBaixa(
  etiquetaId: string,
  status: StatusBaixa,
  responsavelId: string
): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  // O filtro por status 'ativa' evita dar baixa duas vezes na mesma
  // etiqueta (ex. dois toques rápidos) — a segunda tentativa não encontra
  // linha para atualizar.
  const { data, error } = await supabase
    .from("etiquetas")
    .update({
      status,
      baixada_em: new Date().toISOString(),
      baixada_por: responsavelId,
    })
    .eq("id", etiquetaId)
    .eq("status", "ativa")
    .select("id");

  if (error) {
    throw new Error("Não foi possível dar baixa nesta etiqueta.");
  }
  if (!data || data.length === 0) {
    throw new Error("Etiqueta já foi baixada por outra pessoa.");
  }
}
