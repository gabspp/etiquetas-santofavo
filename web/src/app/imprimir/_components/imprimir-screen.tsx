"use client";

// Fluxo de cozinha, mobile-first: selecionar o item → conservação (a
// validade sai do prazo do modo, ajustável) → responsável → cópias →
// imprimir. Uma coluna, alvos grandes, botão de imprimir fixo na base.

import { useMemo, useState } from "react";
import {
  calcularValidade,
  formatarDataISO,
  MODO_LABEL,
  modosDisponiveis,
  parseDataISO,
  type ModoConservacao,
} from "@/lib/validade/calcular-validade";
import { formatarDataBR, type EtiquetaSnapshot } from "@/lib/zpl/gerar-zpl";
import { registrarEtiqueta } from "../actions";
import { ProductPicker } from "./product-picker";
import { ConservacaoPicker } from "./conservacao-picker";
import { QtyStepper } from "./qty-stepper";
import { ResponsavelPicker } from "@/components/responsavel-picker";
import { LabelPreview } from "./label-preview";
import { PrintButton } from "./print-button";
import { AppNav } from "@/components/app-nav";
import type { ItemCatalogo, Responsavel } from "./types";

function hojeISO(): string {
  const agora = new Date();
  return formatarDataISO(new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())));
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest text-ink-muted mb-2">{titulo}</h2>
      {children}
    </section>
  );
}

type ImprimirScreenProps = {
  itens: ItemCatalogo[];
  responsaveis: Responsavel[];
  lojaCodigo: string;
};

export function ImprimirScreen({ itens, responsaveis, lojaCodigo }: ImprimirScreenProps) {
  const [item, setItem] = useState<ItemCatalogo | null>(null);
  const [modo, setModo] = useState<ModoConservacao | null>(null);
  const [dataManipulacao, setDataManipulacao] = useState(hojeISO());
  const [validadeManual, setValidadeManual] = useState<string | null>(null);
  const [ajustandoDatas, setAjustandoDatas] = useState(false);
  const [copias, setCopias] = useState(1);
  const [responsavel, setResponsavel] = useState<Responsavel | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const modos = useMemo(() => (item ? modosDisponiveis(item) : []), [item]);

  function selecionarItem(novo: ItemCatalogo) {
    const modosDoItem = modosDisponiveis(novo);
    setItem(novo);
    setModo(modosDoItem.length === 1 ? modosDoItem[0] : null);
    setValidadeManual(null);
    setAjustandoDatas(false);
    setErro(null);
    setSucesso(null);
  }

  function trocarItem() {
    setItem(null);
    setModo(null);
    setValidadeManual(null);
    setAjustandoDatas(false);
    setErro(null);
  }

  function selecionarModo(novoModo: ModoConservacao) {
    setModo(novoModo);
    setValidadeManual(null);
  }

  function mudarDataManipulacao(iso: string) {
    setDataManipulacao(iso);
    setValidadeManual(null); // recalcula a validade a partir da nova data
  }

  const validadeCalculada = useMemo(() => {
    if (!item || !modo || !dataManipulacao) return null;
    try {
      return formatarDataISO(calcularValidade(modo, parseDataISO(dataManipulacao), item));
    } catch {
      return null;
    }
  }, [item, modo, dataManipulacao]);

  const validadeEfetiva = validadeManual ?? validadeCalculada;

  const previewSnapshot: EtiquetaSnapshot | null = useMemo(() => {
    if (!item || !modo || !validadeEfetiva) return null;
    return {
      produtoNome: item.nome,
      conservacao: MODO_LABEL[modo],
      lojaCodigo,
      dataManipulacao,
      dataValidade: validadeEfetiva,
      responsavelNome: responsavel?.nome ?? "",
    };
  }, [item, modo, validadeEfetiva, dataManipulacao, responsavel, lojaCodigo]);

  const podeImprimir =
    !!item && !!modo && !!validadeEfetiva && !!responsavel && !carregando;

  async function handleImprimir() {
    if (!item || !modo || !responsavel) return;
    setCarregando(true);
    setErro(null);
    setSucesso(null);
    try {
      // O server action registra a etiqueta e enfileira o ZPL — o agente
      // de impressão da loja despacha para a impressora térmica.
      await registrarEtiqueta({
        origem: item.origem,
        itemId: item.id,
        modo,
        dataManipulacao,
        dataValidadeAjustada: validadeManual,
        copias,
        responsavelId: responsavel.id,
      });

      // Pronto para a próxima: mantém o responsável (o mesmo operador
      // tende a imprimir várias em sequência).
      setSucesso(`${item.nome} — ${copias} ${copias === 1 ? "etiqueta enviada para a impressora" : "etiquetas enviadas para a impressora"}.`);
      setItem(null);
      setModo(null);
      setCopias(1);
      setValidadeManual(null);
      setAjustandoDatas(false);
      setDataManipulacao(hojeISO());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao imprimir a etiqueta.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className={`mx-auto w-full max-w-lg px-4 pt-4 ${item ? "pb-32" : "pb-8"}`}>
        <header className="mb-5 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h1 className="font-serif text-xl text-ink">Imprimir etiqueta</h1>
            <span className="text-xs uppercase tracking-widest text-ink-muted">
              Santo Favo {lojaCodigo}
            </span>
          </div>
          <AppNav />
        </header>

        {sucesso && !item && (
          <p className="mb-4 rounded-lg border border-brand-verde bg-bg-card px-4 py-3 text-sm text-ink">
            {sucesso}
          </p>
        )}

        {!item ? (
          <ProductPicker itens={itens} onSelecionar={selecionarItem} />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Item selecionado */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ink bg-bg-card px-4 py-3">
              <span className="text-lg font-medium text-ink leading-snug">{item.nome}</span>
              <button
                type="button"
                onClick={trocarItem}
                className="shrink-0 rounded-pill border border-rule px-3.5 py-1.5 text-xs uppercase tracking-wider text-ink-soft transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96]"
              >
                Trocar
              </button>
            </div>

            <Secao titulo="Conservação">
              <ConservacaoPicker
                modos={modos}
                prazos={item}
                selecionado={modo}
                onSelecionar={selecionarModo}
              />
            </Secao>

            {modo && validadeEfetiva && (
              <Secao titulo="Validade">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-rule-soft bg-bg-card px-4 py-3">
                  <span className="text-lg font-medium text-ink tabular-nums">
                    {formatarDataBR(validadeEfetiva)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAjustandoDatas((v) => !v)}
                    className="shrink-0 rounded-pill border border-rule px-3.5 py-1.5 text-xs uppercase tracking-wider text-ink-soft transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96]"
                  >
                    {ajustandoDatas ? "Fechar" : "Ajustar"}
                  </button>
                </div>
                {ajustandoDatas && (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-ink-soft mb-1.5">Manipulação</label>
                      <input
                        type="date"
                        value={dataManipulacao}
                        onChange={(e) => mudarDataManipulacao(e.target.value)}
                        className="w-full rounded-md border border-rule-soft bg-bg-card px-3 py-2.5 text-base text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-soft mb-1.5">Validade</label>
                      <input
                        type="date"
                        value={validadeEfetiva}
                        min={dataManipulacao}
                        onChange={(e) => setValidadeManual(e.target.value)}
                        className="w-full rounded-md border border-rule-soft bg-bg-card px-3 py-2.5 text-base text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>
                )}
              </Secao>
            )}

            <Secao titulo="Responsável">
              <ResponsavelPicker
                responsaveis={responsaveis}
                selecionado={responsavel}
                onSelecionar={setResponsavel}
              />
            </Secao>

            <Secao titulo="Cópias">
              <QtyStepper value={copias} onChange={setCopias} />
            </Secao>

            {previewSnapshot && (
              <Secao titulo="Etiqueta">
                <LabelPreview snapshot={previewSnapshot} />
              </Secao>
            )}

            {erro && <p className="text-sm text-brand-rosa">{erro}</p>}
          </div>
        )}
      </div>

      {/* Barra de impressão fixa — só com item selecionado */}
      {item && (
        <div className="fixed inset-x-0 bottom-0 border-t border-rule-soft bg-bg">
          <div className="mx-auto w-full max-w-lg px-4 py-3">
            <PrintButton
              disabled={!podeImprimir}
              carregando={carregando}
              copias={copias}
              onClick={handleImprimir}
            />
          </div>
        </div>
      )}
    </div>
  );
}
