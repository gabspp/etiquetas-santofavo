"use client";

// NOVO: grid de nomes grandes + teclado numérico grande para o PIN. O PIN
// aqui é só atribuição rápida (não autenticação) — o teclado existe para
// confirmar "é você mesmo" sem exigir digitação em campo de texto comum.
// Compartilhado entre Imprimir (quem imprimiu) e Validades (quem deu baixa).

import { useState } from "react";
import type { Responsavel } from "@/types/models";

type ResponsavelPickerProps = {
  responsaveis: Responsavel[];
  selecionado: Responsavel | null;
  onSelecionar: (responsavel: Responsavel) => void;
};

export function ResponsavelPicker({ responsaveis, selecionado, onSelecionar }: ResponsavelPickerProps) {
  const [pendente, setPendente] = useState<Responsavel | null>(null);
  const [pinDigitado, setPinDigitado] = useState("");
  const [erroPin, setErroPin] = useState(false);

  function tocarResponsavel(responsavel: Responsavel) {
    if (!responsavel.pin) {
      onSelecionar(responsavel);
      return;
    }
    setPendente(responsavel);
    setPinDigitado("");
    setErroPin(false);
  }

  function tocarDigito(digito: string) {
    if (!pendente) return;
    const proximo = (pinDigitado + digito).slice(0, 4);
    setPinDigitado(proximo);
    setErroPin(false);

    if (proximo.length === 4) {
      if (proximo === pendente.pin) {
        onSelecionar(pendente);
        setPendente(null);
        setPinDigitado("");
      } else {
        setErroPin(true);
        setPinDigitado("");
      }
    }
  }

  if (pendente) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-base text-ink-soft">
          PIN de <span className="font-medium text-ink">{pendente.nome}</span>
        </p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-8 h-10 rounded-md border flex items-center justify-center text-xl ${
                erroPin ? "border-brand-rosa" : "border-rule-soft"
              }`}
            >
              {pinDigitado[i] ? "•" : ""}
            </span>
          ))}
        </div>
        {erroPin && <p className="text-brand-rosa text-sm">PIN incorreto, tente novamente.</p>}
        <div className="grid grid-cols-3 gap-2 max-w-xs">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((tecla, i) =>
            tecla === "" ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() =>
                  tecla === "⌫"
                    ? setPinDigitado((p) => p.slice(0, -1))
                    : tocarDigito(tecla)
                }
                className="w-16 h-14 rounded-md border border-rule-soft bg-bg-card text-ink text-xl font-medium hover:border-ink transition-colors"
              >
                {tecla}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => setPendente(null)}
          className="text-sm text-ink-soft underline underline-offset-2"
        >
          Trocar responsável
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {responsaveis.map((responsavel) => {
        const ativo = selecionado?.id === responsavel.id;
        return (
          <button
            key={responsavel.id}
            type="button"
            onClick={() => tocarResponsavel(responsavel)}
            className={`min-h-[56px] rounded-lg border px-3 py-3 text-base font-medium transition-colors ${
              ativo
                ? "bg-ink text-bg border-ink"
                : "bg-bg-card text-ink border-rule-soft hover:border-ink"
            }`}
          >
            {responsavel.nome}
          </button>
        );
      })}
      {responsaveis.length === 0 && (
        <p className="text-ink-muted text-sm col-span-full">Nenhum responsável cadastrado.</p>
      )}
    </div>
  );
}
