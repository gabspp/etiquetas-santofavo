import { describe, expect, it } from "vitest";
import {
  calcularValidade,
  formatarDataISO,
  modosDisponiveis,
  parseDataISO,
  ValidadeError,
  type PrazosConservacao,
} from "./calcular-validade";

const dataBase = new Date(Date.UTC(2026, 0, 1)); // 2026-01-01

const prazosCompletos: PrazosConservacao = {
  dias_ambiente: 30,
  dias_refrigerado: 7,
  dias_congelado: 90,
};

describe("calcularValidade", () => {
  it("calcula validade para temperatura ambiente", () => {
    const r = calcularValidade("ambiente", dataBase, prazosCompletos);
    expect(formatarDataISO(r)).toBe("2026-01-31");
  });

  it("calcula validade para refrigerado", () => {
    const r = calcularValidade("refrigerado", dataBase, prazosCompletos);
    expect(formatarDataISO(r)).toBe("2026-01-08");
  });

  it("calcula validade para congelado", () => {
    const r = calcularValidade("congelado", dataBase, prazosCompletos);
    expect(formatarDataISO(r)).toBe("2026-04-01");
  });

  it("vira mês e ano corretamente", () => {
    const r = calcularValidade(
      "refrigerado",
      new Date(Date.UTC(2026, 11, 28)),
      { dias_ambiente: null, dias_refrigerado: 7, dias_congelado: null }
    );
    expect(formatarDataISO(r)).toBe("2027-01-04");
  });

  it("lança erro quando o modo pedido não tem prazo configurado", () => {
    const prazos: PrazosConservacao = { dias_ambiente: 30, dias_refrigerado: null, dias_congelado: null };
    expect(() => calcularValidade("refrigerado", dataBase, prazos)).toThrow(ValidadeError);
  });
});

describe("modosDisponiveis", () => {
  it("retorna só os modos com prazo preenchido, na ordem da UI", () => {
    const prazos: PrazosConservacao = { dias_ambiente: null, dias_refrigerado: 7, dias_congelado: 90 };
    expect(modosDisponiveis(prazos)).toEqual(["refrigerado", "congelado"]);
  });

  it("retorna vazio quando nenhum modo é suportado", () => {
    expect(
      modosDisponiveis({ dias_ambiente: null, dias_refrigerado: null, dias_congelado: null })
    ).toEqual([]);
  });
});

describe("parseDataISO / formatarDataISO", () => {
  it("faz ida e volta sem deslocar o dia", () => {
    expect(formatarDataISO(parseDataISO("2026-08-13"))).toBe("2026-08-13");
  });
});
