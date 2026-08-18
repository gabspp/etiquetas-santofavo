"use client";

import { formatarDataBR } from "@/lib/zpl/gerar-zpl";
import type { EtiquetaComProduto } from "./types";
import { classificarUrgencia, diasAteVencer, type Urgencia } from "./urgencia";

const COR_FAIXA: Record<Urgencia, string> = {
  vencido: "border-l-brand-rosa",
  hoje: "border-l-accent",
  proximo: "border-l-brand-marrom",
  normal: "border-l-rule-soft",
};

const TEXTO_PRAZO: Record<Urgencia, (dias: number) => string> = {
  vencido: (d) => (d === -1 ? "venceu ontem" : `vencida há ${-d} dias`),
  hoje: () => "vence hoje",
  proximo: (d) => (d === 1 ? "vence amanhã" : `vence em ${d} dias`),
  normal: (d) => `vence em ${d} dias`,
};

type EtiquetaItemProps = {
  etiqueta: EtiquetaComProduto;
  onConsumir: () => void;
  onDescartar: () => void;
  processando: boolean;
};

export function EtiquetaItem({ etiqueta, onConsumir, onDescartar, processando }: EtiquetaItemProps) {
  const diff = diasAteVencer(etiqueta.data_validade);
  const urgencia = classificarUrgencia(diff);
  const nomeProduto =
    etiqueta.products?.name ?? etiqueta.recipes?.title ?? etiqueta.nome_livre ?? "Produto removido";

  const btn =
    "flex-1 sm:flex-none rounded-md border border-rule-soft bg-bg px-3.5 py-2.5 text-sm font-medium text-ink transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.97] disabled:opacity-40";

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-rule-soft border-l-4 ${COR_FAIXA[urgencia]} bg-bg-card px-4 py-3`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-ink leading-snug">{nomeProduto}</p>
        <p className="text-xs text-ink-muted mt-0.5">
          {formatarDataBR(etiqueta.data_validade)} · {TEXTO_PRAZO[urgencia](diff)}
        </p>
        <p className="text-xs text-ink-muted">{etiqueta.conservacao}</p>
      </div>

      <div className="flex gap-2 shrink-0">
        <button type="button" disabled={processando} onClick={onConsumir} className={btn}>
          Consumido
        </button>
        <button type="button" disabled={processando} onClick={onDescartar} className={btn}>
          Descartado
        </button>
      </div>
    </div>
  );
}
