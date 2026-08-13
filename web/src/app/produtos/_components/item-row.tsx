"use client";

import { modosDisponiveis, MODO_LABEL } from "@/lib/validade/calcular-validade";
import type { ItemCatalogo } from "@/types/models";

type ItemRowProps = {
  item: ItemCatalogo;
  selecionado: boolean;
  onClick: () => void;
};

export function ItemRow({ item, selecionado, onClick }: ItemRowProps) {
  const modos = modosDisponiveis(item);
  const configurado = modos.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-[transform,border-color,background-color] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.98] ${
        selecionado
          ? "bg-ink text-bg border-ink"
          : "bg-bg-card text-ink border-rule-soft hover:border-ink"
      }`}
    >
      <div className="min-w-0">
        <p className="text-base font-medium leading-snug">{item.nome}</p>
        <p className={`text-xs mt-0.5 ${selecionado ? "text-bg/70" : "text-ink-muted"}`}>
          {configurado
            ? modos.map((m) => MODO_LABEL[m]).join(" · ")
            : "Sem validade configurada"}
        </p>
      </div>
      {!configurado && (
        <span
          className={`shrink-0 w-2 h-2 rounded-full ${selecionado ? "bg-bg/60" : "bg-brand-rosa"}`}
          aria-label="Sem validade configurada"
        />
      )}
    </button>
  );
}
