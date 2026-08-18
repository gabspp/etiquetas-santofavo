"use server";

import { createClient } from "@/lib/supabase/server";
import type { OrigemCatalogo, Responsavel } from "@/types/models";

async function exigirSessao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  return supabase;
}

// ─── Validade dos itens ──────────────────────────────────────────

export type AtualizarValidadeInput = {
  origem: OrigemCatalogo;
  id: string;
  dias_ambiente: number | null;
  dias_refrigerado: number | null;
  dias_congelado: number | null;
  dias_apos_abertura: number | null;
};

/**
 * Só atualiza as colunas de prazo por conservação — nunca nome, categoria,
 * estoque ou qualquer outro campo. Criar/editar/apagar o produto ou a
 * receita em si continua sendo papel do estoque-santofavo e do
 * fichas-tecnicas, não desta tela.
 */
export async function atualizarValidade(input: AtualizarValidadeInput): Promise<void> {
  const supabase = await exigirSessao();

  const dados = {
    dias_ambiente: input.dias_ambiente,
    dias_refrigerado: input.dias_refrigerado,
    dias_congelado: input.dias_congelado,
    dias_apos_abertura: input.dias_apos_abertura,
  };

  const tabela = input.origem === "product" ? "products" : "recipes";
  const { data, error } = await supabase.from(tabela).update(dados).eq("id", input.id).select("id");

  if (error || !data?.length) {
    throw new Error("Não foi possível salvar a validade.");
  }
}

// ─── Responsáveis ────────────────────────────────────────────────

export async function criarResponsavel(nome: string, pin: string | null): Promise<Responsavel> {
  const supabase = await exigirSessao();

  const nomeLimpo = nome.trim();
  if (!nomeLimpo) throw new Error("Informe o nome do responsável.");
  if (pin && !/^\d{4}$/.test(pin)) throw new Error("O PIN deve ter 4 dígitos.");

  const { data: minhaLoja } = await supabase.from("usuarios_loja").select("loja_id").single();
  if (!minhaLoja) throw new Error("Não foi possível identificar a loja deste tablet.");

  const { data, error } = await supabase
    .from("responsaveis")
    .insert({ nome: nomeLimpo, pin: pin || null, loja_id: minhaLoja.loja_id })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Não foi possível criar o responsável.");
  }
  return data;
}

export type RemocaoResultado = "removido" | "desativado";

/**
 * Tenta remover de vez; se o responsável já tem etiquetas registradas
 * (FK), apenas desativa — o histórico de impressões/baixas precisa
 * continuar apontando para ele.
 */
export async function removerResponsavel(id: string): Promise<RemocaoResultado> {
  const supabase = await exigirSessao();

  const { error: deleteError } = await supabase.from("responsaveis").delete().eq("id", id);
  if (!deleteError) return "removido";

  const { error: updateError } = await supabase
    .from("responsaveis")
    .update({ ativo: false })
    .eq("id", id);
  if (updateError) {
    throw new Error("Não foi possível remover o responsável.");
  }
  return "desativado";
}

// ─── Fila de impressão ───────────────────────────────────────────

/**
 * Volta um item com erro para "pendente" — o agente da loja pega de novo
 * na próxima varredura (Realtime não dispara em UPDATE, só em INSERT; o
 * polling de 20s do agente cobre isso). Só mexe em itens que já são desta
 * loja (RLS), e só faz sentido chamar em itens com status "erro".
 */
export async function tentarNovamente(id: string): Promise<void> {
  const supabase = await exigirSessao();

  const { data, error } = await supabase
    .from("fila_impressao")
    .update({ status: "pendente", erro: null })
    .eq("id", id)
    .eq("status", "erro")
    .select("id");

  if (error || !data?.length) {
    throw new Error("Não foi possível reenviar para a fila.");
  }
}
