"use client";

// NOVO: gestão dos responsáveis da loja — adicionar (nome + PIN opcional)
// e remover. Remover cai para "desativar" quando o responsável já tem
// etiquetas registradas, preservando o histórico de impressões/baixas.

import { useState } from "react";
import type { Responsavel } from "@/types/models";
import { criarResponsavel, removerResponsavel } from "../actions";

type ResponsaveisManagerProps = {
  responsaveisIniciais: Responsavel[];
};

export function ResponsaveisManager({ responsaveisIniciais }: ResponsaveisManagerProps) {
  const [responsaveis, setResponsaveis] = useState(responsaveisIniciais);
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [removendoId, setRemovendoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const novo = await criarResponsavel(nome, pin || null);
      setResponsaveis((atual) =>
        [...atual, novo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
      );
      setNome("");
      setPin("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao adicionar.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(responsavel: Responsavel) {
    setRemovendoId(responsavel.id);
    setConfirmandoId(null);
    setErro(null);
    setAviso(null);
    try {
      const resultado = await removerResponsavel(responsavel.id);
      setResponsaveis((atual) => atual.filter((r) => r.id !== responsavel.id));
      if (resultado === "desativado") {
        setAviso(
          `${responsavel.nome} tinha etiquetas registradas — foi desativado (o histórico continua no relatório).`
        );
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao remover.");
    } finally {
      setRemovendoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={handleAdicionar} className="flex flex-col gap-2.5 rounded-lg border border-rule-soft bg-bg-card p-4">
        <span className="text-xs uppercase tracking-widest text-ink-muted">Novo responsável</span>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          className="w-full rounded-md border border-rule-soft bg-bg px-3.5 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink"
        />
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="PIN de 4 dígitos (opcional)"
          className="w-full rounded-md border border-rule-soft bg-bg px-3.5 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink tabular-nums"
        />
        <button
          type="submit"
          disabled={salvando || !nome.trim()}
          className="w-full min-h-[52px] rounded-lg bg-ink text-bg text-base font-medium transition-[transform,opacity] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-40"
        >
          {salvando ? "Adicionando..." : "Adicionar"}
        </button>
      </form>

      {erro && <p className="text-sm text-brand-rosa">{erro}</p>}
      {aviso && <p className="text-sm text-ink-soft">{aviso}</p>}

      <div className="flex flex-col gap-2">
        {responsaveis.map((responsavel) => (
          <div
            key={responsavel.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-rule-soft bg-bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-base font-medium text-ink">{responsavel.nome}</p>
              <p className="text-xs text-ink-muted">
                {responsavel.pin ? "Com PIN" : "Sem PIN"}
              </p>
            </div>
            {confirmandoId === responsavel.id ? (
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRemover(responsavel)}
                  className="rounded-md border border-brand-rosa px-3.5 py-2 text-sm font-medium text-brand-rosa transition-[transform] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96]"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoId(null)}
                  className="rounded-md border border-rule-soft px-3.5 py-2 text-sm text-ink-soft transition-[transform,border-color] hover:border-ink active:scale-[0.96]"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={removendoId === responsavel.id}
                onClick={() => setConfirmandoId(responsavel.id)}
                className="shrink-0 rounded-md border border-rule-soft px-3.5 py-2 text-sm text-ink-soft transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96] disabled:opacity-40"
              >
                {removendoId === responsavel.id ? "Removendo..." : "Remover"}
              </button>
            )}
          </div>
        ))}
        {responsaveis.length === 0 && (
          <p className="text-ink-muted text-sm text-center py-6">
            Nenhum responsável cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
