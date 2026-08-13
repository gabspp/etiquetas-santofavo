"use client";

// NOVO: lista de linhas largas otimizada para toque (celular/tablet em pé) —
// cada linha ocupa a largura toda com alvo de 56px+, agrupada por categoria,
// com busca no topo. Sem equivalente em Fichas Técnicas.

import { useMemo, useState } from "react";
import { modosDisponiveis, MODO_LABEL } from "@/lib/validade/calcular-validade";
import type { ItemCatalogo } from "./types";

const GRUPO_SEM_NOME = "Outros";

type ProductPickerProps = {
  itens: ItemCatalogo[];
  onSelecionar: (item: ItemCatalogo) => void;
};

export function ProductPicker({ itens, onSelecionar }: ProductPickerProps) {
  const [busca, setBusca] = useState("");

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = termo
      ? itens.filter((p) => p.nome.toLowerCase().includes(termo))
      : itens;

    const mapa = new Map<string, ItemCatalogo[]>();
    for (const item of filtrados) {
      const grupo = item.grupo || GRUPO_SEM_NOME;
      const lista = mapa.get(grupo) ?? [];
      lista.push(item);
      mapa.set(grupo, lista);
    }
    return Array.from(mapa.entries());
  }, [itens, busca]);

  return (
    <div className="flex flex-col gap-5">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar insumo ou receita..."
        className="w-full rounded-lg border border-rule-soft bg-bg-card px-4 py-3.5 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
      />

      {grupos.map(([grupo, lista]) => (
        <section key={grupo}>
          <h2 className="text-xs uppercase tracking-widest text-ink-muted mb-2">{grupo}</h2>
          <div className="flex flex-col gap-2">
            {lista.map((item) => {
              const modos = modosDisponiveis(item);
              return (
                <button
                  key={`${item.origem}:${item.id}`}
                  type="button"
                  onClick={() => onSelecionar(item)}
                  className="w-full min-h-[60px] rounded-lg border border-rule-soft bg-bg-card px-4 py-3 text-left transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.98]"
                >
                  <span className="block text-base font-medium text-ink leading-snug">
                    {item.nome}
                  </span>
                  <span className="block text-xs text-ink-muted mt-0.5">
                    {modos.map((m) => MODO_LABEL[m]).join(" · ")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {grupos.length === 0 && (
        <p className="text-ink-muted text-sm text-center py-8">
          {busca
            ? "Nenhum item encontrado."
            : "Nenhum item com validade configurada ainda — configure em Cadastro."}
        </p>
      )}
    </div>
  );
}
