"use client";

// NOVO: seleção do modo de conservação — só os modos que o item aceita,
// botões altos empilhados no celular. O prazo de cada modo aparece no
// próprio botão para o operador ver o que vai acontecer antes de tocar.

import {
  MODO_LABEL,
  type ModoConservacao,
  type PrazosConservacao,
} from "@/lib/validade/calcular-validade";

const DIAS_POR_MODO: Record<ModoConservacao, keyof PrazosConservacao> = {
  ambiente: "dias_ambiente",
  refrigerado: "dias_refrigerado",
  congelado: "dias_congelado",
};

type ConservacaoPickerProps = {
  modos: ModoConservacao[];
  prazos: PrazosConservacao;
  selecionado: ModoConservacao | null;
  onSelecionar: (modo: ModoConservacao) => void;
};

export function ConservacaoPicker({ modos, prazos, selecionado, onSelecionar }: ConservacaoPickerProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {modos.map((modo) => {
        const ativo = selecionado === modo;
        const dias = prazos[DIAS_POR_MODO[modo]];
        return (
          <button
            key={modo}
            type="button"
            onClick={() => onSelecionar(modo)}
            className={`flex-1 min-h-[56px] rounded-lg border px-4 py-2.5 text-left sm:text-center transition-[transform,border-color,background-color] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.98] ${
              ativo
                ? "bg-ink text-bg border-ink"
                : "bg-bg-card text-ink border-rule-soft hover:border-ink"
            }`}
          >
            <span className="block text-base font-medium leading-snug">{MODO_LABEL[modo]}</span>
            <span className={`block text-xs mt-0.5 ${ativo ? "text-bg/70" : "text-ink-muted"}`}>
              {dias} {dias === 1 ? "dia" : "dias"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
