/**
 * Formato congelado no momento da impressão — é o único tipo que a função
 * de geração aceita. Não existe forma de passar uma linha viva de
 * products/recipes aqui: isso impede estruturalmente renderizar uma
 * etiqueta a partir do cadastro atual em vez do snapshot gravado.
 */
export type EtiquetaSnapshot = {
  produtoNome: string;
  /** Texto do modo de conservação como sai impresso (MODO_LABEL). */
  conservacao: string;
  /** Rótulo do evento que a data abaixo representa — "Manipulação" ou
   * "Abertura" (TIPO_EVENTO_LABEL). */
  tipoEvento: string;
  lojaCodigo: string;
  /** ISO 'YYYY-MM-DD' — data do evento (manipulação ou abertura). */
  dataEvento: string;
  /** ISO 'YYYY-MM-DD' */
  dataValidade: string;
  responsavelNome: string;
};

// 203 dpi (8 dots/mm) — resolução comum tanto na Zebra ZD220 quanto na
// Elgin L42 Pro. Todas as medidas dos perfis abaixo estão em dots.
const DOTS_POR_MM = 8;

/**
 * Geometria completa de um tamanho de etiqueta. Existe como perfil (e não
 * como constantes soltas) porque o consumível troca: cada rolo tem seu
 * próprio conjunto de posições já ajustado, e mudar de formato é trocar
 * qual perfil o `FORMATO` aponta — sem recalcular coordenada nenhuma.
 */
export type FormatoEtiqueta = {
  /** Só para diagnóstico/legenda — não entra no ZPL. */
  nome: string;
  larguraMm: number;
  alturaMm: number;
  /** ^PW — largura útil em dots. */
  pw: number;
  /** ^LL — comprimento da etiqueta em dots. */
  ll: number;
  margem: number;
  /** Largura do bloco invertido da validade, encostado na direita. */
  boxLargura: number;
  header: { y: number; fonte: number };
  produto: { y: number; fonte: number; maxLinhas: number; espacoLinhas: number };
  divisor: { y: number };
  /** Os três pares rótulo/valor: conservação, evento (manipulação ou
   * abertura) e responsável. */
  linhas: {
    ys: readonly [number, number, number];
    rotuloFonte: number;
    valorFonte: number;
    /** Distância do rótulo até o valor logo abaixo dele. */
    valorOffset: number;
  };
  validade: {
    rotuloY: number;
    rotuloFonte: number;
    diaMesY: number;
    diaMesAltura: number;
    diaMesLargura: number;
    anoY: number;
    anoAltura: number;
    anoLargura: number;
  };
};

/** Rolo de 60 × 40 mm — geometria original, validada em snapshot. */
export const FORMATO_60x40: FormatoEtiqueta = {
  nome: "60x40",
  larguraMm: 60,
  alturaMm: 40,
  pw: 60 * DOTS_POR_MM, // 480
  ll: 40 * DOTS_POR_MM, // 320
  margem: 14,
  boxLargura: 156,
  header: { y: 10, fonte: 18 },
  produto: { y: 34, fonte: 38, maxLinhas: 2, espacoLinhas: 2 },
  divisor: { y: 124 },
  linhas: { ys: [138, 198, 258], rotuloFonte: 16, valorFonte: 28, valorOffset: 19 },
  validade: {
    rotuloY: 34,
    rotuloFonte: 22,
    diaMesY: 120,
    diaMesAltura: 70,
    diaMesLargura: 58,
    anoY: 200,
    anoAltura: 56,
    anoLargura: 48,
  },
};

/**
 * Rolo de 50 × 30 mm (gap de 2 mm) — o consumível em uso hoje. Não é o
 * 60 × 40 reescalado: em 30 mm de altura o conteúdo não cabe por regra de
 * três (os 305 dots de conteúdo do original teriam que virar 240), então
 * corpos de fonte e respiros foram reapertados um a um. O nome do produto
 * continua com até 2 linhas, mas cabe menos texto antes de truncar.
 */
export const FORMATO_50x30: FormatoEtiqueta = {
  nome: "50x30",
  larguraMm: 50,
  alturaMm: 30,
  pw: 50 * DOTS_POR_MM, // 400
  ll: 30 * DOTS_POR_MM, // 240
  margem: 12,
  boxLargura: 130,
  header: { y: 8, fonte: 14 },
  produto: { y: 24, fonte: 26, maxLinhas: 2, espacoLinhas: 2 },
  divisor: { y: 86 },
  linhas: { ys: [94, 142, 190], rotuloFonte: 13, valorFonte: 20, valorOffset: 16 },
  validade: {
    rotuloY: 25,
    rotuloFonte: 16,
    diaMesY: 88,
    diaMesAltura: 48,
    diaMesLargura: 38,
    anoY: 150,
    anoAltura: 38,
    anoLargura: 32,
  },
};

/**
 * Formato em uso. ⬅ Trocar esta linha (e só ela) ao mudar de rolo:
 * `FORMATO_60x40` quando o consumível de 60 × 40 mm voltar.
 * O preview na tela lê o mesmo perfil, então acompanha sozinho.
 */
export const FORMATO: FormatoEtiqueta = FORMATO_50x30;

/** Faixa livre à esquerda do bloco de validade, descontadas as margens. */
export function conteudoLargura(formato: FormatoEtiqueta): number {
  return formato.pw - formato.boxLargura - formato.margem * 2;
}

/**
 * Largura média de caractere como fração do parâmetro de largura do ^A0
 * (fonte 0 é proporcional, então não há valor exato). Calibrado contra
 * impressão real no rolo de 50 × 30: "BOLO DE CHOCOLATE" (17 caracteres)
 * cabe nos 246 dots a corpo 26 e "GANACHE DE CHOCOLATE" (20) não cabe, o
 * que põe a razão entre 0,47 e 0,56.
 */
const LARGURA_CARACTERE = 0.55;

/** Reticências em três pontos: a fonte da impressora não tem o glifo "…". */
const RETICENCIAS = "...";

/**
 * Quebra o nome do produto nas linhas que caibem na faixa de conteúdo,
 * truncando com reticências no que passar de `maxLinhas`.
 *
 * A quebra é feita aqui, e não pelo ^FB do ZPL, porque o ^FB não trunca de
 * forma confiável: numa ZD220 o texto que excede o número de linhas sai
 * *sobreposto* na última linha em vez de ser descartado, virando um borrão
 * preto ilegível. Impressão real confirmou o comportamento.
 *
 * Exportada para o preview quebrar exatamente igual — é o mesmo texto nas
 * mesmas linhas na tela e no papel.
 */
export function quebrarNome(nome: string, formato: FormatoEtiqueta = FORMATO): string[] {
  const { fonte, maxLinhas } = formato.produto;
  const maxChars = Math.max(
    1,
    Math.floor(conteudoLargura(formato) / (fonte * LARGURA_CARACTERE))
  );

  const linhas: string[] = [];
  let atual = "";

  const fechar = () => {
    if (atual) linhas.push(atual);
    atual = "";
  };

  for (const palavra of nome.split(/\s+/).filter(Boolean)) {
    // Palavra que não cabe nem sozinha na linha: parte em pedaços duros.
    if (palavra.length > maxChars) {
      fechar();
      for (let i = 0; i < palavra.length; i += maxChars) {
        linhas.push(palavra.slice(i, i + maxChars));
      }
      continue;
    }
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (tentativa.length <= maxChars) atual = tentativa;
    else {
      fechar();
      atual = palavra;
    }
  }
  fechar();

  if (linhas.length <= maxLinhas) return linhas;

  // Sobrou texto: corta nas linhas disponíveis e marca com reticências,
  // abrindo espaço para elas dentro do limite da última linha.
  const mantidas = linhas.slice(0, maxLinhas);
  const ultima = mantidas[maxLinhas - 1];
  mantidas[maxLinhas - 1] =
    ultima.length + RETICENCIAS.length <= maxChars
      ? ultima + RETICENCIAS
      : ultima.slice(0, Math.max(0, maxChars - RETICENCIAS.length)).trimEnd() + RETICENCIAS;
  return mantidas;
}

/** ^ e ~ são caracteres de controle ZPL — nunca deixar dado dinâmico quebrar o formato. */
function zplEscape(texto: string): string {
  return texto.replace(/[\^~]/g, " ").replace(/[\r\n]/g, " ").trim();
}

/** Exportado para o label-preview usar exatamente a mesma formatação do ZPL impresso. */
export function formatarDataBR(isoDate: string): string {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function splitDataValidade(isoDate: string): { diaMes: string; ano: string } {
  const [ano, mes, dia] = isoDate.split("-");
  return { diaMes: `${dia}/${mes}`, ano };
}

/**
 * Gera o ZPL de uma etiqueta a partir do snapshot congelado. Função pura,
 * sem I/O — só string. Sem QR code, sem lote, sem código de barras.
 *
 * O layout distribui o conteúdo pela altura inteira da etiqueta: cabeçalho
 * + nome no terço superior, três linhas rótulo/valor preenchendo o resto,
 * e o bloco invertido de validade tomando a lateral direita completa.
 * Abre com ^XA^SZ2 (mode-lock em ZPL II, em vez de confiar na
 * autodetecção de linguagem da impressora) e fecha com um único ^XZ.
 *
 * A geometria vem do perfil `FORMATO` — ver FORMATO_50x30 / FORMATO_60x40.
 */
export function gerarZPL(
  snapshot: EtiquetaSnapshot,
  copias: number = 1,
  formato: FormatoEtiqueta = FORMATO
): string {
  const nCopias = Math.max(1, Math.floor(copias) || 1);
  const { margem, boxLargura, header, produto, divisor, linhas, validade } = formato;
  const boxX = formato.pw - boxLargura;
  const largura = conteudoLargura(formato);

  const nome = zplEscape(snapshot.produtoNome.toUpperCase());
  const conservacao = zplEscape(snapshot.conservacao);
  const responsavel = zplEscape(snapshot.responsavelNome);
  const lojaHeader = zplEscape(`SANTO FAVO ${snapshot.lojaCodigo}`);
  const rotuloEvento = zplEscape(snapshot.tipoEvento.toUpperCase());
  const dataEventoFmt = formatarDataBR(snapshot.dataEvento);
  const { diaMes, ano } = splitDataValidade(snapshot.dataValidade);

  /** Linha "rótulo pequeno em cima, valor forte embaixo" — o mesmo ritmo se
   * repete para conservação, manipulação e responsável, aqui e no preview. */
  const linhaRotuloValor = (y: number, rotulo: string, valor: string): string[] => [
    `^FO${margem},${y}^A0N,${linhas.rotuloFonte},${linhas.rotuloFonte}^FD${rotulo}^FS`,
    `^FO${margem},${y + linhas.valorOffset}^A0N,${linhas.valorFonte},${linhas.valorFonte}^FB${largura},1,0,L,0^FD${valor}^FS`,
  ];

  const saida = [
    "^XA",
    "^SZ2",
    `^PW${formato.pw}`,
    `^LL${formato.ll}`,
    "^CI28", // UTF-8, necessário para acentuação em português

    // Cabeçalho pequeno + nome do produto (caixa alta, quebrado em código —
    // ver quebrarNome: uma linha ^FO por linha de texto, nunca um ^FB
    // multilinha, para o excedente não sair sobreposto)
    `^FO${margem},${header.y}^A0N,${header.fonte},${header.fonte}^FD${lojaHeader}^FS`,
    ...quebrarNome(nome, formato).map(
      (linha, i) =>
        `^FO${margem},${produto.y + i * (produto.fonte + produto.espacoLinhas)}^A0N,${produto.fonte},${produto.fonte}^FB${largura},1,0,L,0^FD${linha}^FS`
    ),

    // Linha divisória fina separando o nome dos dados
    `^FO${margem},${divisor.y}^GB${largura},2,2,B,0^FS`,

    // Três linhas rótulo/valor distribuídas até a base da etiqueta
    ...linhaRotuloValor(linhas.ys[0], "CONSERVAÇÃO", conservacao),
    ...linhaRotuloValor(linhas.ys[1], rotuloEvento, dataEventoFmt),
    ...linhaRotuloValor(linhas.ys[2], "RESPONSÁVEL", responsavel),

    // Bloco invertido da validade — lateral direita inteira, fundo preto,
    // texto branco: é o campo que precisa ser lido a três metros.
    `^FO${boxX},0^GB${boxLargura},${formato.ll},${boxLargura},B,0^FS`,
    `^FO${boxX},${validade.rotuloY}^A0N,${validade.rotuloFonte},${validade.rotuloFonte}^FB${boxLargura},1,0,C,0^FR^FDVALIDADE^FS`,
    `^FO${boxX},${validade.diaMesY}^A0N,${validade.diaMesAltura},${validade.diaMesLargura}^FB${boxLargura},1,0,C,0^FR^FD${diaMes}^FS`,
    `^FO${boxX},${validade.anoY}^A0N,${validade.anoAltura},${validade.anoLargura}^FB${boxLargura},1,0,C,0^FR^FD${ano}^FS`,

    `^PQ${nCopias}`,
    "^XZ",
  ];

  return saida.join("\n");
}
