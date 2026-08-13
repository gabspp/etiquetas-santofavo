"use client";

import type { FiltroValidade } from "./types";

const LABELS: Record<FiltroValidade, string> = {
  vencidos: "Vencidas",
  hoje: "Hoje",
  "48h": "48h",
  tudo: "Tudo",
};

const ORDEM: FiltroValidade[] = ["vencidos", "hoje", "48h", "tudo"];

type FiltroTabsProps = {
  selecionado: FiltroValidade;
  onSelecionar: (filtro: FiltroValidade) => void;
};

export function FiltroTabs({ selecionado, onSelecionar }: FiltroTabsProps) {
  return (
    <div className="flex gap-2">
      {ORDEM.map((filtro) => {
        const ativo = selecionado === filtro;
        return (
          <button
            key={filtro}
            type="button"
            onClick={() => onSelecionar(filtro)}
            className={`flex-1 min-h-[44px] rounded-pill px-3 py-2 text-sm font-medium border transition-[transform,border-color,background-color] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96] ${
              ativo
                ? "bg-ink text-bg border-ink"
                : "bg-bg-card text-ink-soft border-rule-soft hover:border-ink"
            }`}
          >
            {LABELS[filtro]}
          </button>
        );
      })}
    </div>
  );
}
