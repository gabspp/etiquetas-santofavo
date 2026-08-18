"use client";

// Formulário de prazos por modo de conservação: para cada modo em que o
// item pode ser guardado, quantos dias ele dura. Campo vazio = o item não
// pode ser guardado daquele jeito (o modo não aparece na tela Imprimir).
// "Depois de aberto" é um prazo à parte — não depende do modo, e liga o
// alternador "Embalagem aberta" na tela Imprimir.

import { useState } from "react";
import { MODO_LABEL, type ModoConservacao } from "@/lib/validade/calcular-validade";
import type { ItemCatalogo } from "@/types/models";

type Prazos = {
  dias_ambiente: number | null;
  dias_refrigerado: number | null;
  dias_congelado: number | null;
  dias_apos_abertura: number | null;
};

type ValidadeFormProps = {
  item: ItemCatalogo;
  onSalvar: (dados: Prazos) => Promise<void>;
  onFechar: () => void;
};

const CAMPOS: { modo: ModoConservacao; chave: keyof Omit<Prazos, "dias_apos_abertura"> }[] = [
  { modo: "ambiente", chave: "dias_ambiente" },
  { modo: "refrigerado", chave: "dias_refrigerado" },
  { modo: "congelado", chave: "dias_congelado" },
];

function paraNumeroOuNull(texto: string): number | null {
  if (texto.trim() === "") return null;
  const n = Number(texto);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

const campoInputCls =
  "w-20 rounded-md border border-rule-soft bg-bg-card px-2.5 py-2 text-base text-ink text-center tabular-nums focus:outline-none focus:border-ink";

export function ValidadeForm({ item, onSalvar, onFechar }: ValidadeFormProps) {
  const [valores, setValores] = useState<Record<keyof Prazos, string>>({
    dias_ambiente: item.dias_ambiente?.toString() ?? "",
    dias_refrigerado: item.dias_refrigerado?.toString() ?? "",
    dias_congelado: item.dias_congelado?.toString() ?? "",
    dias_apos_abertura: item.dias_apos_abertura?.toString() ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const nenhumPrazo = CAMPOS.every(({ chave }) => valores[chave].trim() === "");

  function setCampo(chave: keyof Prazos, valor: string) {
    setValores((v) => ({ ...v, [chave]: valor }));
    setSalvo(false);
  }

  async function handleSalvar() {
    setSalvando(true);
    setErro(null);
    setSalvo(false);
    try {
      await onSalvar({
        dias_ambiente: paraNumeroOuNull(valores.dias_ambiente),
        dias_refrigerado: paraNumeroOuNull(valores.dias_refrigerado),
        dias_congelado: paraNumeroOuNull(valores.dias_congelado),
        dias_apos_abertura: paraNumeroOuNull(valores.dias_apos_abertura),
      });
      setSalvo(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-ink bg-bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg text-ink leading-snug">{item.nome}</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            {item.grupo ?? "Sem categoria"} · {item.origem === "product" ? "Insumo" : "Receita"}
          </p>
        </div>
        <button
          type="button"
          onClick={onFechar}
          className="shrink-0 rounded-pill border border-rule px-3.5 py-1.5 text-xs uppercase tracking-wider text-ink-soft transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96]"
        >
          Fechar
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {CAMPOS.map(({ modo, chave }) => (
          <label
            key={modo}
            className="flex items-center justify-between gap-3 rounded-md border border-rule-soft bg-bg px-3.5 py-2.5"
          >
            <span className="text-sm text-ink">{MODO_LABEL[modo]}</span>
            <span className="flex items-baseline gap-1.5 shrink-0">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={valores[chave]}
                onChange={(e) => setCampo(chave, e.target.value)}
                placeholder="—"
                className={campoInputCls}
              />
              <span className="text-xs text-ink-muted">dias</span>
            </span>
          </label>
        ))}
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">
          Depois de aberto
        </p>
        <label className="flex items-center justify-between gap-3 rounded-md border border-rule-soft bg-bg px-3.5 py-2.5">
          <span className="text-sm text-ink">Independente de como está guardado</span>
          <span className="flex items-baseline gap-1.5 shrink-0">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={valores.dias_apos_abertura}
              onChange={(e) => setCampo("dias_apos_abertura", e.target.value)}
              placeholder="—"
              className={campoInputCls}
            />
            <span className="text-xs text-ink-muted">dias</span>
          </span>
        </label>
      </div>

      {nenhumPrazo && (
        <p className="text-xs text-ink-muted">
          Sem nenhum prazo de conservação preenchido, este item não aparece na tela Imprimir
          (mesmo com prazo de abertura configurado).
        </p>
      )}
      {erro && <p className="text-sm text-brand-rosa">{erro}</p>}
      {salvo && !erro && <p className="text-sm text-brand-verde">Salvo.</p>}

      <button
        type="button"
        disabled={salvando}
        onClick={handleSalvar}
        className="w-full min-h-[52px] rounded-lg bg-ink text-bg text-base font-medium transition-[transform,opacity] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
