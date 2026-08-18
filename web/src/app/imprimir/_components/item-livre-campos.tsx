"use client";

// NOVO: campos de um item fora do catálogo (products/recipes). Sem prazo
// cadastrado pra calcular nada — nome, conservação e validade são sempre
// digitados/ajustados à mão.

import { MODO_LABEL } from "@/lib/validade/calcular-validade";
import { AberturaToggle } from "./abertura-toggle";

const CONSERVACAO_ATALHOS = Object.values(MODO_LABEL);

export type ItemLivreValores = {
  nome: string;
  conservacao: string;
  aberto: boolean;
  dataEvento: string;
  validade: string;
};

type ItemLivreCamposProps = {
  valores: ItemLivreValores;
  onChange: (valores: ItemLivreValores) => void;
};

const inputCls =
  "w-full rounded-md border border-rule-soft bg-bg-card px-3.5 py-3 text-base text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink";

export function ItemLivreCampos({ valores, onChange }: ItemLivreCamposProps) {
  function set<K extends keyof ItemLivreValores>(chave: K, valor: ItemLivreValores[K]) {
    onChange({ ...valores, [chave]: valor });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5">Nome do item</label>
        <input
          type="text"
          value={valores.nome}
          onChange={(e) => set("nome", e.target.value)}
          placeholder="ex: Farinha de amêndoas (novo fornecedor)"
          className={inputCls}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-soft mb-1.5">Conservação</label>
        <input
          type="text"
          value={valores.conservacao}
          onChange={(e) => set("conservacao", e.target.value)}
          placeholder="ex: Temperatura ambiente"
          className={`${inputCls} mb-2`}
        />
        <div className="flex flex-wrap gap-2">
          {CONSERVACAO_ATALHOS.map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => set("conservacao", valor)}
              className="rounded-pill border border-rule-soft px-3 py-1.5 text-xs text-ink-soft hover:border-ink transition-colors"
            >
              {valor}
            </button>
          ))}
        </div>
      </div>

      <AberturaToggle aberto={valores.aberto} onChange={(aberto) => set("aberto", aberto)} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5">
            {valores.aberto ? "Abertura" : "Manipulação"}
          </label>
          <input
            type="date"
            value={valores.dataEvento}
            onChange={(e) => set("dataEvento", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Validade</label>
          <input
            type="date"
            value={valores.validade}
            min={valores.dataEvento}
            onChange={(e) => set("validade", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
