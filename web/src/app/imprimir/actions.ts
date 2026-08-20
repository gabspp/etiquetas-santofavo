"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calcularValidade,
  formatarDataISO,
  MODO_LABEL,
  modosDisponiveis,
  parseDataISO,
  temPrazoAbertura,
  TIPO_EVENTO_LABEL,
  type ModoConservacao,
  type TipoEvento,
} from "@/lib/validade/calcular-validade";
import {
  comQuantidade,
  gerarZPL,
  type EtiquetaSnapshot,
  type QuantidadeValores,
} from "@/lib/zpl/gerar-zpl";
import type { Database } from "@/types/database";
import type { OrigemCatalogo } from "@/types/models";

type Cliente = SupabaseClient<Database>;

async function exigirSessaoELoja(supabase: Cliente) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  const { data: minhaLoja, error } = await supabase
    .from("usuarios_loja")
    .select("loja_id")
    .single();
  if (error || !minhaLoja) {
    throw new Error("Não foi possível identificar a loja deste tablet.");
  }
  return { lojaId: minhaLoja.loja_id };
}

type DadosEtiqueta = {
  loja_id: string;
  produto_id: string | null;
  recipe_id: string | null;
  nome_livre: string | null;
  responsavel_id: string;
  conservacao: string;
  data_base: string;
  data_validade: string;
  copias: number;
};

/**
 * Grava a etiqueta e enfileira o ZPL pronto — compartilhado pelos dois
 * fluxos (catálogo e livre). Se a fila falhar, cancela a etiqueta recém-
 * registrada para o operador poder tentar de novo sem duplicar.
 */
async function gravarEEnfileirar(
  supabase: Cliente,
  dados: DadosEtiqueta,
  snapshot: EtiquetaSnapshot
): Promise<string> {
  const { data: etiqueta, error: insertError } = await supabase
    .from("etiquetas")
    .insert({ ...dados, snapshot })
    .select("id")
    .single();

  if (insertError || !etiqueta) {
    throw new Error("Não foi possível registrar a etiqueta.");
  }

  const { error: filaError } = await supabase.from("fila_impressao").insert({
    loja_id: dados.loja_id,
    etiqueta_id: etiqueta.id,
    zpl: gerarZPL(snapshot, dados.copias),
  });

  if (filaError) {
    await supabase.from("etiquetas").update({ status: "cancelada" }).eq("id", etiqueta.id);
    throw new Error("Não foi possível enviar para a impressora. Tente novamente.");
  }

  return etiqueta.id;
}

// ─── Catálogo (products/recipes) ──────────────────────────────────

export type RegistrarEtiquetaInput = {
  origem: OrigemCatalogo;
  itemId: string;
  modo: ModoConservacao;
  /** Embalagem já guardada que foi aberta hoje — usa dias_apos_abertura em
   * vez do prazo do modo; a conservação impressa continua sendo `modo`. */
  aberto: boolean;
  /** ISO 'YYYY-MM-DD' — data do evento (manipulação ou abertura). */
  dataEvento: string;
  /** ISO 'YYYY-MM-DD' — null usa o prazo calculado; preenchido quando o
   * operador ajustou a validade manualmente na UI. */
  dataValidadeAjustada: string | null;
  /** Impressa junto do nome — "AMENDOIM (1KG)" — ver comQuantidade. */
  quantidade: QuantidadeValores;
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
  const { lojaId } = await exigirSessaoELoja(supabase);

  // Item lido fresco no momento do insert — nunca confiar em dados vindos
  // do client, para o snapshot sempre refletir o cadastro real no instante
  // da impressão.
  let nome: string;
  let prazos: {
    dias_ambiente: number | null;
    dias_refrigerado: number | null;
    dias_congelado: number | null;
    dias_apos_abertura: number | null;
  };

  if (input.origem === "product") {
    const { data: produto, error } = await supabase
      .from("products")
      .select("name, dias_ambiente, dias_refrigerado, dias_congelado, dias_apos_abertura")
      .eq("id", input.itemId)
      .single();
    if (error || !produto) throw new Error("Produto não encontrado.");
    nome = produto.name;
    prazos = produto;
  } else {
    const { data: receita, error } = await supabase
      .from("recipes")
      .select("title, dias_ambiente, dias_refrigerado, dias_congelado, dias_apos_abertura")
      .eq("id", input.itemId)
      .single();
    if (error || !receita) throw new Error("Receita não encontrada.");
    nome = receita.title;
    prazos = receita;
  }

  if (!modosDisponiveis(prazos).includes(input.modo)) {
    throw new Error("Este item não tem prazo configurado para essa conservação.");
  }
  if (input.aberto && !temPrazoAbertura(prazos)) {
    throw new Error("Este item não tem prazo configurado para embalagem aberta.");
  }

  const { data: responsavel, error: responsavelError } = await supabase
    .from("responsaveis")
    .select("id, nome")
    .eq("id", input.responsavelId)
    .single();
  if (responsavelError || !responsavel) {
    throw new Error("Responsável não encontrado.");
  }

  const dataEvento = parseDataISO(input.dataEvento);
  const dataValidadeISO =
    input.dataValidadeAjustada ??
    formatarDataISO(calcularValidade(input.modo, dataEvento, prazos, input.aberto));

  if (parseDataISO(dataValidadeISO).getTime() < dataEvento.getTime()) {
    throw new Error("A validade não pode ser anterior à data do evento.");
  }

  const tipoEvento: TipoEvento = input.aberto ? "abertura" : "manipulacao";
  const snapshot: EtiquetaSnapshot = {
    produtoNome: comQuantidade(nome, input.quantidade),
    conservacao: MODO_LABEL[input.modo],
    tipoEvento: TIPO_EVENTO_LABEL[tipoEvento],
    dataEvento: input.dataEvento,
    dataValidade: dataValidadeISO,
    responsavelNome: responsavel.nome,
  };

  const etiquetaId = await gravarEEnfileirar(
    supabase,
    {
      loja_id: lojaId,
      produto_id: input.origem === "product" ? input.itemId : null,
      recipe_id: input.origem === "recipe" ? input.itemId : null,
      nome_livre: null,
      responsavel_id: responsavel.id,
      conservacao: MODO_LABEL[input.modo],
      data_base: input.dataEvento,
      data_validade: dataValidadeISO,
      copias: input.copias,
    },
    snapshot
  );

  return { etiquetaId, snapshot };
}

// ─── Item livre (fora do catálogo) ────────────────────────────────

export type RegistrarEtiquetaLivreInput = {
  nome: string;
  /** Texto livre — não vem de um prazo cadastrado, é só o que sai impresso. */
  conservacao: string;
  tipoEvento: TipoEvento;
  /** ISO 'YYYY-MM-DD' */
  dataEvento: string;
  /** ISO 'YYYY-MM-DD' — sempre manual: não existe prazo cadastrado pra calcular. */
  dataValidade: string;
  /** Impressa junto do nome — "AMENDOIM (1KG)" — ver comQuantidade. */
  quantidade: QuantidadeValores;
  copias: number;
  responsavelId: string;
};

export async function registrarEtiquetaLivre(
  input: RegistrarEtiquetaLivreInput
): Promise<RegistrarEtiquetaResultado> {
  const supabase = await createClient();
  const { lojaId } = await exigirSessaoELoja(supabase);

  const nome = input.nome.trim();
  const conservacao = input.conservacao.trim();
  if (!nome) throw new Error("Informe o nome do item.");
  if (!conservacao) throw new Error("Informe a conservação.");

  const dataEvento = parseDataISO(input.dataEvento);
  const dataValidade = parseDataISO(input.dataValidade);
  if (dataValidade.getTime() < dataEvento.getTime()) {
    throw new Error("A validade não pode ser anterior à data do evento.");
  }

  const { data: responsavel, error: responsavelError } = await supabase
    .from("responsaveis")
    .select("id, nome")
    .eq("id", input.responsavelId)
    .single();
  if (responsavelError || !responsavel) {
    throw new Error("Responsável não encontrado.");
  }

  const snapshot: EtiquetaSnapshot = {
    produtoNome: comQuantidade(nome, input.quantidade),
    conservacao,
    tipoEvento: TIPO_EVENTO_LABEL[input.tipoEvento],
    dataEvento: input.dataEvento,
    dataValidade: input.dataValidade,
    responsavelNome: responsavel.nome,
  };

  const etiquetaId = await gravarEEnfileirar(
    supabase,
    {
      loja_id: lojaId,
      produto_id: null,
      recipe_id: null,
      nome_livre: nome,
      responsavel_id: responsavel.id,
      conservacao,
      data_base: input.dataEvento,
      data_validade: input.dataValidade,
      copias: input.copias,
    },
    snapshot
  );

  return { etiquetaId, snapshot };
}
