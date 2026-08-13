"use client";

// NOVO: visão operacional da fila de impressão — o app nunca fala com a
// impressora direto (ver agente-impressao/), então isso é o único lugar
// para ver se um pedido travou e reenviar sem precisar abrir o Supabase
// Studio.

import { useState } from "react";
import type { Database } from "@/types/database";
import { tentarNovamente } from "../actions";

type FilaItem = Database["public"]["Tables"]["fila_impressao"]["Row"];

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  impressa: "Impressa",
  erro: "Erro",
};

const STATUS_COR: Record<string, string> = {
  pendente: "border-l-accent",
  impressa: "border-l-brand-verde",
  erro: "border-l-brand-rosa",
};

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Primeira linha ^FD.../^FS do ZPL, só pra dar contexto de qual etiqueta é. */
function resumoZPL(zpl: string): string {
  const nome = zpl.match(/\^FD([^^]+)\^FS/g)?.[1]?.replace(/\^FD|\^FS/g, "");
  return nome ?? "Etiqueta";
}

type FilaImpressaoProps = {
  filaInicial: FilaItem[];
};

export function FilaImpressao({ filaInicial }: FilaImpressaoProps) {
  const [fila, setFila] = useState(filaInicial);
  const [reenviandoId, setReenviandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function handleReenviar(id: string) {
    setReenviandoId(id);
    setErro(null);
    try {
      await tentarNovamente(id);
      setFila((atual) =>
        atual.map((f) => (f.id === id ? { ...f, status: "pendente", erro: null } : f))
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao reenviar.");
    } finally {
      setReenviandoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-ink-muted -mt-1 mb-1">
        Últimos 50 envios desta loja. O agente roda no computador da impressora — se ficar
        &ldquo;Pendente&rdquo; por muito tempo, confira se ele está ligado.
      </p>

      {erro && <p className="text-sm text-brand-rosa">{erro}</p>}

      {fila.map((item) => (
        <div
          key={item.id}
          className={`rounded-lg border border-rule-soft border-l-4 ${STATUS_COR[item.status] ?? "border-l-rule-soft"} bg-bg-card px-4 py-3`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{resumoZPL(item.zpl)}</p>
              <p className="text-xs text-ink-muted">
                {STATUS_LABEL[item.status] ?? item.status} · {formatarHora(item.criada_em)}
              </p>
            </div>
            {item.status === "erro" && (
              <button
                type="button"
                disabled={reenviandoId === item.id}
                onClick={() => handleReenviar(item.id)}
                className="shrink-0 rounded-md border border-rule-soft px-3.5 py-2 text-sm text-ink-soft transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96] disabled:opacity-40"
              >
                {reenviandoId === item.id ? "Reenviando..." : "Tentar de novo"}
              </button>
            )}
          </div>
          {item.status === "erro" && item.erro && (
            <p className="text-xs text-brand-rosa mt-1.5 break-words">{item.erro}</p>
          )}
        </div>
      ))}

      {fila.length === 0 && (
        <p className="text-ink-muted text-sm text-center py-8">Nenhuma impressão ainda.</p>
      )}
    </div>
  );
}
