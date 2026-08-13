"use server";

import { createClient } from "@/lib/supabase/server";
import {
  calcularValidade,
  formatarDataISO,
  MODO_LABEL,
  modosDisponiveis,
  parseDataISO,
  type ModoConservacao,
} from "@/lib/validade/calcular-validade";
import { gerarZPL, type EtiquetaSnapshot } from "@/lib/zpl/gerar-zpl";
import type { OrigemCatalogo } from "@/types/models";

export type RegistrarEtiquetaInput = {
  origem: OrigemCatalogo;
  itemId: string;
  modo: ModoConservacao;
  /** ISO 'YYYY-MM-DD' — data de manipulação (padrão: hoje). */
  dataManipulacao: string;
  /** ISO 'YYYY-MM-DD' — null usa o prazo padrão do modo; preenchido quando
   * o operador ajustou a validade manualmente na UI. */
  dataValidadeAjustada: string | null;
  copias: number;
  responsavelId: string;
};

export type RegistrarEtiquetaResultado = {
  etiquetaId: string;
  snapshot: EtiquetaSnapshot;
};

export async function registrarEtiqueta(
  input: RegistrarEtiquetaInput
): Promise<RegistrarEtiquetaResultado> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data: minhaLoja, error: lojaError } = await supabase
    .from("usuarios_loja")
    .select("loja_id, stores(code)")
    .single();
  if (lojaError || !minhaLoja) {
    throw new Error("Não foi possível identificar a loja deste tablet.");
  }
  const lojaCodigo = (minhaLoja.stores as { code: string } | null)?.code ?? "?";

  // Item lido fresco no momento do insert — nunca confiar em dados vindos
  // do client, para o snapshot sempre refletir o cadastro real no instante
  // da impressão.
  let nome: string;
  let prazos: { dias_ambiente: number | null; dias_refrigerado: number | null; dias_congelado: number | null };

  if (input.origem === "product") {
    const { data: produto, error } = await supabase
      .from("products")
      .select("name, dias_ambiente, dias_refrigerado, dias_congelado")
      .eq("id", input.itemId)
      .single();
    if (error || !produto) throw new Error("Produto não encontrado.");
    nome = produto.name;
    prazos = produto;
  } else {
    const { data: receita, error } = await supabase
      .from("recipes")
      .select("title, dias_ambiente, dias_refrigerado, dias_congelado")
      .eq("id", input.itemId)
      .single();
    if (error || !receita) throw new Error("Receita não encontrada.");
    nome = receita.title;
    prazos = receita;
  }

  if (!modosDisponiveis(prazos).includes(input.modo)) {
    throw new Error("Este item não tem prazo configurado para essa conservação.");
  }

  const { data: responsavel, error: responsavelError } = await supabase
    .from("responsaveis")
    .select("id, nome")
    .eq("id", input.responsavelId)
    .single();
  if (responsavelError || !responsavel) {
    throw new Error("Responsável não encontrado.");
  }

  const dataManipulacao = parseDataISO(input.dataManipulacao);
  const dataValidadeISO =
    input.dataValidadeAjustada ??
    formatarDataISO(calcularValidade(input.modo, dataManipulacao, prazos));

  if (parseDataISO(dataValidadeISO).getTime() < dataManipulacao.getTime()) {
    throw new Error("A validade não pode ser anterior à data de manipulação.");
  }

  const snapshot: EtiquetaSnapshot = {
    produtoNome: nome,
    conservacao: MODO_LABEL[input.modo],
    lojaCodigo,
    dataManipulacao: input.dataManipulacao,
    dataValidade: dataValidadeISO,
    responsavelNome: responsavel.nome,
  };

  const { data: etiqueta, error: insertError } = await supabase
    .from("etiquetas")
    .insert({
      loja_id: minhaLoja.loja_id,
      produto_id: input.origem === "product" ? input.itemId : null,
      recipe_id: input.origem === "recipe" ? input.itemId : null,
      responsavel_id: responsavel.id,
      conservacao: MODO_LABEL[input.modo],
      data_base: input.dataManipulacao,
      data_validade: dataValidadeISO,
      copias: input.copias,
      snapshot,
    })
    .select("id")
    .single();

  if (insertError || !etiqueta) {
    throw new Error("Não foi possível registrar a etiqueta.");
  }

  // Enfileira o ZPL pronto — o agente de impressão da loja despacha para
  // a impressora térmica. Se a fila falhar, cancela a etiqueta recém-
  // registrada para o operador poder tentar de novo sem duplicar.
  const { error: filaError } = await supabase.from("fila_impressao").insert({
    loja_id: minhaLoja.loja_id,
    etiqueta_id: etiqueta.id,
    zpl: gerarZPL(snapshot, input.copias),
  });

  if (filaError) {
    await supabase.from("etiquetas").update({ status: "cancelada" }).eq("id", etiqueta.id);
    throw new Error("Não foi possível enviar para a impressora. Tente novamente.");
  }

  return { etiquetaId: etiqueta.id, snapshot };
}
