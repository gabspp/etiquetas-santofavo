"use client";

// Tela de cadastro: prazos de validade dos itens + responsáveis da loja,
// em duas abas. Mobile-first, mesma coluna única das outras telas.

import { useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";
import { mesmoItem, type ItemCatalogo, type Responsavel } from "@/types/models";
import type { Database } from "@/types/database";
import { atualizarValidade } from "../actions";
import { ItemRow } from "./item-row";
import { ValidadeForm } from "./validade-form";
import { ResponsaveisManager } from "./responsaveis-manager";
import { FilaImpressao } from "./fila-impressao";

const GRUPO_SEM_NOME = "Outros";

type Aba = "itens" | "responsaveis" | "fila";

type ProdutosScreenProps = {
  itensIniciais: ItemCatalogo[];
  responsaveisIniciais: Responsavel[];
  filaInicial: Database["public"]["Tables"]["fila_impressao"]["Row"][];
};

export function ProdutosScreen({ itensIniciais, responsaveisIniciais, filaInicial }: ProdutosScreenProps) {
  const [aba, setAba] = useState<Aba>("itens");
  const [itens, setItens] = useState(itensIniciais);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<ItemCatalogo | null>(null);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = termo ? itens.filter((i) => i.nome.toLowerCase().includes(termo)) : itens;

    const mapa = new Map<string, ItemCatalogo[]>();
    for (const item of filtrados) {
      const grupo = item.grupo || GRUPO_SEM_NOME;
      const lista = mapa.get(grupo) ?? [];
      lista.push(item);
      mapa.set(grupo, lista);
    }
    return Array.from(mapa.entries());
  }, [itens, busca]);

  async function handleSalvar(dados: {
    dias_ambiente: number | null;
    dias_refrigerado: number | null;
    dias_congelado: number | null;
  }) {
    if (!selecionado) return;
    await atualizarValidade({ origem: selecionado.origem, id: selecionado.id, ...dados });
    setItens((atual) => atual.map((i) => (mesmoItem(i, selecionado) ? { ...i, ...dados } : i)));
    setSelecionado((atual) => (atual ? { ...atual, ...dados } : atual));
  }

  const abaBtn = (ativa: boolean) =>
    `flex-1 min-h-[44px] rounded-pill px-4 py-2 text-sm font-medium border transition-[transform,border-color,background-color] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96] ${
      ativa ? "bg-ink text-bg border-ink" : "bg-bg-card text-ink-soft border-rule-soft hover:border-ink"
    }`;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto w-full max-w-lg px-4 pt-4 pb-8">
        <header className="mb-5 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h1 className="font-serif text-xl text-ink">Cadastro</h1>
            <span className="text-xs text-ink-muted">{itens.length} itens</span>
          </div>
          <AppNav />
        </header>

        <div className="flex gap-2 mb-5">
          <button type="button" onClick={() => setAba("itens")} className={abaBtn(aba === "itens")}>
            Validades
          </button>
          <button
            type="button"
            onClick={() => setAba("responsaveis")}
            className={abaBtn(aba === "responsaveis")}
          >
            Responsáveis
          </button>
          <button type="button" onClick={() => setAba("fila")} className={abaBtn(aba === "fila")}>
            Fila
          </button>
        </div>

        {aba === "responsaveis" ? (
          <ResponsaveisManager responsaveisIniciais={responsaveisIniciais} />
        ) : aba === "fila" ? (
          <FilaImpressao filaInicial={filaInicial} />
        ) : selecionado ? (
          <ValidadeForm
            key={`${selecionado.origem}:${selecionado.id}`}
            item={selecionado}
            onSalvar={handleSalvar}
            onFechar={() => setSelecionado(null)}
          />
        ) : (
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
                  {lista.map((item) => (
                    <ItemRow
                      key={`${item.origem}:${item.id}`}
                      item={item}
                      selecionado={false}
                      onClick={() => setSelecionado(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {grupos.length === 0 && (
              <p className="text-ink-muted text-sm text-center py-8">Nenhum item encontrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
