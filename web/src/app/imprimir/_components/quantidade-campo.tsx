"use client";

// NOVO: quantidade opcional impressa junto do nome — "AMENDOIM (1KG)",
// "BARRINHA DE CHOCOLATE (16UN)". Campo em branco não aparece na etiqueta
// (ver comQuantidade em gerar-zpl.ts).

import type { QuantidadeValores, UnidadeQuantidade } from "@/lib/zpl/gerar-zpl";

const UNIDADES: UnidadeQuantidade[] = ["un", "g", "kg"];

type QuantidadeCampoProps = {
  valores: QuantidadeValores;
  onChange: (valores: QuantidadeValores) => void;
};

export function QuantidadeCampo({ valores, onChange }: QuantidadeCampoProps) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        inputMode="decimal"
        value={valores.valor}
        onChange={(e) => onChange({ ...valores, valor: e.target.value })}
        placeholder="ex: 1"
        className="w-24 min-h-[52px] rounded-lg border border-rule-soft bg-bg-card px-3.5 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
      />
      <div className="flex flex-1 gap-2">
        {UNIDADES.map((unidade) => {
          const ativo = valores.unidade === unidade;
          return (
            <button
              key={unidade}
              type="button"
              onClick={() => onChange({ ...valores, unidade })}
              className={`flex-1 min-h-[52px] rounded-lg border text-base font-medium uppercase transition-[transform,border-color,background-color] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.97] ${
                ativo
                  ? "bg-ink text-bg border-ink"
                  : "bg-bg-card text-ink border-rule-soft hover:border-ink"
              }`}
            >
              {unidade}
            </button>
          );
        })}
      </div>
    </div>
  );
}
