"use client";

import { useMemo, useState } from "react";
import { ResponsavelPicker } from "@/components/responsavel-picker";
import { AppNav } from "@/components/app-nav";
import type { Responsavel } from "@/types/models";
import { darBaixa, type StatusBaixa } from "../actions";
import { Contadores } from "./contadores";
import { FiltroTabs } from "./filtro-tabs";
import { EtiquetaItem } from "./etiqueta-item";
import { diasAteVencer, passaNoFiltro } from "./urgencia";
import type { EtiquetaComProduto, FiltroValidade } from "./types";

type ValidadesScreenProps = {
  etiquetasIniciais: EtiquetaComProduto[];
  responsaveis: Responsavel[];
};

type BaixaPendente = {
  etiqueta: EtiquetaComProduto;
  status: StatusBaixa;
};

export function ValidadesScreen({ etiquetasIniciais, responsaveis }: ValidadesScreenProps) {
  const [etiquetas, setEtiquetas] = useState(etiquetasIniciais);
  const [filtro, setFiltro] = useState<FiltroValidade>("tudo");
  const [baixaPendente, setBaixaPendente] = useState<BaixaPendente | null>(null);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const { vencidos, vencemHoje } = useMemo(() => {
    let v = 0;
    let h = 0;
    for (const e of etiquetas) {
      const diff = diasAteVencer(e.data_validade);
      if (diff < 0) v++;
      else if (diff === 0) h++;
    }
    return { vencidos: v, vencemHoje: h };
  }, [etiquetas]);

  const listaFiltrada = useMemo(
    () => etiquetas.filter((e) => passaNoFiltro(diasAteVencer(e.data_validade), filtro)),
    [etiquetas, filtro]
  );

  function pedirBaixa(etiqueta: EtiquetaComProduto, status: StatusBaixa) {
    setErro(null);
    setBaixaPendente({ etiqueta, status });
  }

  async function confirmarBaixa(responsavel: Responsavel) {
    if (!baixaPendente) return;
    const { etiqueta, status } = baixaPendente;
    setProcessandoId(etiqueta.id);
    setBaixaPendente(null);
    try {
      await darBaixa(etiqueta.id, status, responsavel.id);
      setEtiquetas((atual) => atual.filter((e) => e.id !== etiqueta.id));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao dar baixa.");
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto w-full max-w-lg px-4 pt-4 pb-8">
      <header className="mb-5 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-xl text-ink">Validades</h1>
          <span className="text-xs text-ink-muted">{etiquetas.length} etiquetas ativas</span>
        </div>
        <AppNav />
      </header>

      {baixaPendente ? (
        <div className="max-w-sm mx-auto flex flex-col gap-4 items-center py-8">
          <p className="text-base text-ink text-center">
            Quem está dando baixa em{" "}
            <span className="font-medium">
              {baixaPendente.etiqueta.products?.name ??
                baixaPendente.etiqueta.recipes?.title ??
                baixaPendente.etiqueta.nome_livre}
            </span>{" "}
            como <span className="font-medium">{baixaPendente.status === "consumida" ? "consumido" : "descartado"}</span>?
          </p>
          <ResponsavelPicker responsaveis={responsaveis} selecionado={null} onSelecionar={confirmarBaixa} />
          <button
            type="button"
            onClick={() => setBaixaPendente(null)}
            className="text-sm text-ink-soft underline underline-offset-2"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Contadores vencidos={vencidos} vencemHoje={vencemHoje} />
          <FiltroTabs selecionado={filtro} onSelecionar={setFiltro} />

          {erro && <p className="text-brand-rosa text-sm">{erro}</p>}

          <div className="flex flex-col gap-2">
            {listaFiltrada.map((etiqueta) => (
              <EtiquetaItem
                key={etiqueta.id}
                etiqueta={etiqueta}
                processando={processandoId === etiqueta.id}
                onConsumir={() => pedirBaixa(etiqueta, "consumida")}
                onDescartar={() => pedirBaixa(etiqueta, "descartada")}
              />
            ))}
            {listaFiltrada.length === 0 && (
              <p className="text-ink-muted text-sm text-center py-8">
                Nenhuma etiqueta nesse filtro.
              </p>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
