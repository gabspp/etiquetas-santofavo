import { describe, expect, it } from "vitest";
import {
  FORMATO,
  FORMATO_50x30,
  FORMATO_60x40,
  comQuantidade,
  conteudoLargura,
  gerarZPL,
  quebrarNome,
  type EtiquetaSnapshot,
  type FormatoEtiqueta,
} from "./gerar-zpl";

const base: EtiquetaSnapshot = {
  produtoNome: "Ganache de Chocolate",
  conservacao: "Refrigerado 0–4 °C",
  tipoEvento: "Manipulação",
  dataEvento: "2026-03-05",
  dataValidade: "2026-03-12",
  responsavelNome: "Maria",
};

/**
 * Percorre o ZPL e devolve o que estoura os limites físicos do rolo. É a
 * regressão que motivou os perfis: o layout de 60 × 40 mm mandado para um
 * rolo de 50 × 30 mm perdia metade do bloco de validade e a linha inteira
 * do responsável, e nada no código acusava.
 */
function estouros(zpl: string, formato: FormatoEtiqueta): string[] {
  const problemas: string[] = [];

  for (const linha of zpl.split("\n")) {
    const fo = linha.match(/\^FO(\d+),(\d+)/);
    if (!fo) continue;
    const x = Number(fo[1]);
    const y = Number(fo[2]);

    if (x > formato.pw) problemas.push(`^FO x=${x} > ^PW${formato.pw}: ${linha}`);
    if (y > formato.ll) problemas.push(`^FO y=${y} > ^LL${formato.ll}: ${linha}`);

    // ^GBl,a — retângulo desenhado a partir do ^FO
    const gb = linha.match(/\^GB(\d+),(\d+)/);
    if (gb) {
      const larg = Number(gb[1]);
      const alt = Number(gb[2]);
      if (x + larg > formato.pw)
        problemas.push(`^GB estoura a largura (${x}+${larg} > ${formato.pw}): ${linha}`);
      if (y + alt > formato.ll)
        problemas.push(`^GB estoura a altura (${y}+${alt} > ${formato.ll}): ${linha}`);
    }

    // ^FBl — caixa de texto: a largura conta a partir do ^FO
    const fb = linha.match(/\^FB(\d+),(\d+),(\d+)/);
    const fonte = linha.match(/\^A0N,(\d+),(\d+)/);
    if (fb) {
      const larg = Number(fb[1]);
      if (x + larg > formato.pw)
        problemas.push(`^FB estoura a largura (${x}+${larg} > ${formato.pw}): ${linha}`);

      if (fonte) {
        const altura = Number(fonte[1]);
        const nLinhas = Number(fb[2]);
        const espaco = Number(fb[3]);
        const alturaTotal = nLinhas * altura + (nLinhas - 1) * espaco;
        if (y + alturaTotal > formato.ll)
          problemas.push(
            `^FB estoura a altura (${y}+${alturaTotal} > ${formato.ll}): ${linha}`
          );
      }
    } else if (fonte) {
      const altura = Number(fonte[1]);
      if (y + altura > formato.ll)
        problemas.push(`texto estoura a altura (${y}+${altura} > ${formato.ll}): ${linha}`);
    }
  }

  return problemas;
}

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
      dataEvento: "2026-12-28",
      dataValidade: "2027-03-28",
    };
    expect(gerarZPL(snapshot)).toMatchSnapshot();
  });

  it("gera o ZPL de abertura, com rótulo ABERTURA em vez de MANIPULAÇÃO", () => {
    const snapshot: EtiquetaSnapshot = {
      ...base,
      tipoEvento: "Abertura",
      dataEvento: "2026-08-14",
      dataValidade: "2026-08-19",
    };
    const zpl = gerarZPL(snapshot);
    expect(zpl).toContain("ABERTURA");
    expect(zpl).not.toContain("MANIPULAÇÃO");
    expect(zpl).toMatchSnapshot();
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
    // ^ e ~ viraram espaço, então nenhum comando ZPL novo foi criado
    expect(zpl).not.toContain("^ESPECIAL");
    expect(zpl).not.toContain("ESPECIAL~");
    // e o nome sai em caixa alta, distribuído nas linhas do formato
    expect(zpl).toContain("^FDTRUFA ESPECIAL DE^FS");
    expect(zpl).toContain("^FDMARACUJÁ^FS");
  });
});

describe("quebrarNome", () => {
  // A regressão veio do papel: na ZD220 o ^FB multilinha não descarta o
  // excedente, ele imprime sobreposto na última linha e vira borrão.
  const longo = "GANACHE DE CHOCOLATE MEIO AMARGO 70% COM FLOR DE SAL ARTESANAL";

  it.each([
    ["50x30", FORMATO_50x30],
    ["60x40", FORMATO_60x40],
  ])("%s: nunca devolve mais linhas que maxLinhas", (_nome, formato) => {
    expect(quebrarNome(longo, formato).length).toBeLessThanOrEqual(formato.produto.maxLinhas);
  });

  it("marca o texto cortado com reticências", () => {
    const linhas = quebrarNome(longo, FORMATO_50x30);
    expect(linhas.at(-1)?.endsWith("...")).toBe(true);
  });

  it("não mexe no nome que já cabe", () => {
    expect(quebrarNome("BOLO DE CHOCOLATE", FORMATO_50x30)).toEqual(["BOLO DE CHOCOLATE"]);
  });

  it("quebra em duas linhas o nome que não cabe em uma", () => {
    expect(quebrarNome("GANACHE DE CHOCOLATE", FORMATO_50x30)).toEqual([
      "GANACHE DE",
      "CHOCOLATE",
    ]);
  });

  it("parte palavra única maior que a linha em vez de deixar vazar", () => {
    const linhas = quebrarNome("SUPERCALIFRAGILISTICEXPIALIDOCIOUS", FORMATO_50x30);
    expect(linhas.length).toBeLessThanOrEqual(FORMATO_50x30.produto.maxLinhas);
    expect(linhas.every((l) => l.length <= 17)).toBe(true);
  });

  it("o ZPL emite uma linha ^FO por linha de nome, sem ^FB multilinha", () => {
    const zpl = gerarZPL({ ...base, produtoNome: longo });
    // ^FB com mais de 1 linha é justamente o que causava a sobreposição
    expect(zpl).not.toMatch(/\^FB\d+,[2-9]/);
    const linhasNome = quebrarNome(longo.toUpperCase(), FORMATO_50x30);
    for (const linha of linhasNome) expect(zpl).toContain(`^FD${linha}^FS`);
  });
});

describe("comQuantidade", () => {
  it("junta valor e unidade entre parênteses", () => {
    expect(comQuantidade("Amendoim", { valor: "1", unidade: "kg" })).toBe("Amendoim (1kg)");
    expect(comQuantidade("Barrinha de Chocolate", { valor: "16", unidade: "un" })).toBe(
      "Barrinha de Chocolate (16un)"
    );
  });

  it("devolve o nome sem alteração quando o valor está vazio ou em branco", () => {
    expect(comQuantidade("Amendoim", { valor: "", unidade: "kg" })).toBe("Amendoim");
    expect(comQuantidade("Amendoim", { valor: "   ", unidade: "kg" })).toBe("Amendoim");
    expect(comQuantidade("Amendoim", null)).toBe("Amendoim");
  });

  it("apara espaços em volta do valor digitado", () => {
    expect(comQuantidade("Amendoim", { valor: " 500 ", unidade: "g" })).toBe("Amendoim (500g)");
  });
});

describe("formatos de etiqueta", () => {
  it("o formato em uso é o rolo de 50 × 30 mm", () => {
    expect(FORMATO).toBe(FORMATO_50x30);
    const zpl = gerarZPL(base);
    expect(zpl).toContain("^PW400");
    expect(zpl).toContain("^LL240");
  });

  it("gera o ZPL no formato 60 × 40 quando o perfil é passado explicitamente", () => {
    const zpl = gerarZPL(base, 1, FORMATO_60x40);
    expect(zpl).toContain("^PW480");
    expect(zpl).toContain("^LL320");
    expect(zpl).toMatchSnapshot();
  });

  it.each([
    ["50x30", FORMATO_50x30],
    ["60x40", FORMATO_60x40],
  ])("%s: ^PW/^LL correspondem aos milímetros do rolo a 203 dpi", (_nome, formato) => {
    expect(formato.pw).toBe(formato.larguraMm * 8);
    expect(formato.ll).toBe(formato.alturaMm * 8);
    expect(conteudoLargura(formato)).toBeGreaterThan(0);
  });

  // O caso longo é o que mais empurra o layout para baixo e para a direita.
  const casos: Array<[string, EtiquetaSnapshot]> = [
    ["normal", base],
    [
      "nome longo",
      { ...base, produtoNome: "Ganache de chocolate meio amargo 70% com flor de sal artesanal" },
    ],
    ["conservação mais longa", { ...base, conservacao: "Temperatura ambiente" }],
    // O rótulo do meio é dado dinâmico desde a etiqueta de abertura, então
    // ele também precisa caber na faixa de conteúdo.
    ["abertura", { ...base, tipoEvento: "Abertura", dataEvento: "2026-08-14" }],
  ];

  for (const [nomeFormato, formato] of [
    ["50x30", FORMATO_50x30],
    ["60x40", FORMATO_60x40],
  ] as Array<[string, FormatoEtiqueta]>) {
    for (const [nomeCaso, snapshot] of casos) {
      it(`${nomeFormato} / ${nomeCaso}: nenhum elemento sai dos limites do rolo`, () => {
        expect(estouros(gerarZPL(snapshot, 1, formato), formato)).toEqual([]);
      });
    }
  }

  it.each([
    ["50x30", FORMATO_50x30],
    ["60x40", FORMATO_60x40],
  ])("%s: o nome do produto nunca passa do divisor", (_nome, formato) => {
    const zpl = gerarZPL(
      { ...base, produtoNome: "Ganache de chocolate meio amargo 70% com flor de sal artesanal" },
      1,
      formato
    );
    const ysDoNome = [...zpl.matchAll(/\^FO\d+,(\d+)\^A0N,(\d+)/g)]
      .map(([, y, altura]) => [Number(y), Number(altura)] as const)
      .filter(([, altura]) => altura === formato.produto.fonte);

    expect(ysDoNome.length).toBeGreaterThan(0);
    for (const [y, altura] of ysDoNome) {
      expect(y + altura).toBeLessThanOrEqual(formato.divisor.y);
    }
  });

  it("o layout de 60 × 40 realmente estouraria um rolo de 50 × 30", () => {
    // Guarda o inverso: confirma que o detector acima tem dente, e registra
    // por que trocar de rolo exige trocar de perfil em vez de só o ^PW/^LL.
    const zpl = gerarZPL(base, 1, FORMATO_60x40);
    expect(estouros(zpl, FORMATO_50x30).length).toBeGreaterThan(0);
  });
});
