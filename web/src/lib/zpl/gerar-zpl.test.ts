import { describe, expect, it } from "vitest";
import { gerarZPL, type EtiquetaSnapshot } from "./gerar-zpl";

const base: EtiquetaSnapshot = {
  produtoNome: "Ganache de Chocolate",
  conservacao: "Refrigerado 0–4 °C",
  lojaCodigo: "26",
  dataManipulacao: "2026-03-05",
  dataValidade: "2026-03-12",
  responsavelNome: "Maria",
};

describe("gerarZPL", () => {
  it("gera o ZPL do caso normal", () => {
    expect(gerarZPL(base)).toMatchSnapshot();
  });

  it("gera o ZPL com nome de produto longo (quebra em 2 linhas)", () => {
    const snapshot: EtiquetaSnapshot = {
      ...base,
      produtoNome: "Ganache de chocolate meio amargo 70% com flor de sal artesanal",
    };
    expect(gerarZPL(snapshot)).toMatchSnapshot();
  });

  it("gera o ZPL congelado com virada de ano", () => {
    const snapshot: EtiquetaSnapshot = {
      ...base,
      conservacao: "Congelado -18 °C",
      dataManipulacao: "2026-12-28",
      dataValidade: "2027-03-28",
    };
    expect(gerarZPL(snapshot)).toMatchSnapshot();
  });

  it("sempre abre com ^XA^SZ2 e fecha com um único ^XZ final", () => {
    const zpl = gerarZPL(base);
    expect(zpl.startsWith("^XA\n^SZ2\n")).toBe(true);
    expect(zpl.trimEnd().endsWith("^XZ")).toBe(true);
    expect(zpl.match(/\^XZ/g)?.length).toBe(1);
  });

  it("nunca inclui QR code, código de barras ou lote", () => {
    const zpl = gerarZPL(base);
    expect(zpl).not.toMatch(/\^BQ/);
    expect(zpl).not.toMatch(/\^BC/);
    expect(zpl.toLowerCase()).not.toContain("lote");
  });

  it("aplica ^PQ com o número de cópias solicitado", () => {
    expect(gerarZPL(base, 4)).toContain("^PQ4");
  });

  it("nome do produto sempre em caixa alta e escapado de caracteres de controle", () => {
    const snapshot: EtiquetaSnapshot = { ...base, produtoNome: "trufa ^especial~ de maracujá" };
    const zpl = gerarZPL(snapshot);
    expect(zpl).toContain("TRUFA  ESPECIAL  DE MARACUJÁ");
  });
});
