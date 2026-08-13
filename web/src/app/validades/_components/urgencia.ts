import { parseDataISO } from "@/lib/validade/calcular-validade";
import type { FiltroValidade } from "./types";

export type Urgencia = "vencido" | "hoje" | "proximo" | "normal";

/** Dias corridos entre hoje e a data de validade (negativo = já venceu). */
export function diasAteVencer(dataValidadeISO: string, agora: Date = new Date()): number {
  const hojeUTC = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
  const validade = parseDataISO(dataValidadeISO);
  return Math.round((validade.getTime() - hojeUTC.getTime()) / 86_400_000);
}

export function classificarUrgencia(diffDias: number): Urgencia {
  if (diffDias < 0) return "vencido";
  if (diffDias === 0) return "hoje";
  if (diffDias <= 2) return "proximo"; // dentro de 48h
  return "normal";
}

export function passaNoFiltro(diffDias: number, filtro: FiltroValidade): boolean {
  switch (filtro) {
    case "vencidos":
      return diffDias < 0;
    case "hoje":
      return diffDias === 0;
    case "48h":
      return diffDias >= 0 && diffDias <= 2;
    case "tudo":
      return true;
  }
}
