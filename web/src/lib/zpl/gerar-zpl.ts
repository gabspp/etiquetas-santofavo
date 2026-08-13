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
  lojaCodigo: string;
  /** ISO 'YYYY-MM-DD' — data em que o item foi manipulado/etiquetado. */
  dataManipulacao: string;
  /** ISO 'YYYY-MM-DD' */
  dataValidade: string;
  responsavelNome: string;
};

// Etiqueta térmica 60 × 40 mm (faixa horizontal), 203 dpi (8 dots/mm) —
// resolução comum tanto na Zebra ZD220 quanto na Elgin L42 Pro.
const DOTS_POR_MM = 8;
const PW = 60 * DOTS_POR_MM; // 480
const LL = 40 * DOTS_POR_MM; // 320

// Bloco invertido da validade ocupa a lateral direita inteira.
const BOX_LARGURA = 156;
const BOX_X = PW - BOX_LARGURA;
const MARGEM = 14;
const CONTEUDO_LARGURA = BOX_X - MARGEM * 2;

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

/** Linha "rótulo pequeno em cima, valor forte embaixo" — o mesmo ritmo se
 * repete para conservação, manipulação e responsável, aqui e no preview. */
function linhaRotuloValor(y: number, rotulo: string, valor: string): string[] {
  return [
    `^FO${MARGEM},${y}^A0N,16,16^FD${rotulo}^FS`,
    `^FO${MARGEM},${y + 19}^A0N,28,28^FB${CONTEUDO_LARGURA},1,0,L,0^FD${valor}^FS`,
  ];
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
 */
export function gerarZPL(snapshot: EtiquetaSnapshot, copias: number = 1): string {
  const nCopias = Math.max(1, Math.floor(copias) || 1);

  const nome = zplEscape(snapshot.produtoNome.toUpperCase());
  const conservacao = zplEscape(snapshot.conservacao);
  const responsavel = zplEscape(snapshot.responsavelNome);
  const lojaHeader = zplEscape(`SANTO FAVO ${snapshot.lojaCodigo}`);
  const manipulacaoFmt = formatarDataBR(snapshot.dataManipulacao);
  const { diaMes, ano } = splitDataValidade(snapshot.dataValidade);

  const linhas = [
    "^XA",
    "^SZ2",
    `^PW${PW}`,
    `^LL${LL}`,
    "^CI28", // UTF-8, necessário para acentuação em português

    // Cabeçalho pequeno + nome do produto (caixa alta, até 2 linhas)
    `^FO${MARGEM},10^A0N,18,18^FD${lojaHeader}^FS`,
    `^FO${MARGEM},34^A0N,38,38^FB${CONTEUDO_LARGURA},2,2,L,0^FD${nome}^FS`,

    // Linha divisória fina separando o nome dos dados
    `^FO${MARGEM},124^GB${CONTEUDO_LARGURA},2,2,B,0^FS`,

    // Três linhas rótulo/valor distribuídas até a base da etiqueta
    ...linhaRotuloValor(138, "CONSERVAÇÃO", conservacao),
    ...linhaRotuloValor(198, "MANIPULAÇÃO", manipulacaoFmt),
    ...linhaRotuloValor(258, "RESPONSÁVEL", responsavel),

    // Bloco invertido da validade — lateral direita inteira, fundo preto,
    // texto branco: é o campo que precisa ser lido a três metros.
    `^FO${BOX_X},0^GB${BOX_LARGURA},${LL},${BOX_LARGURA},B,0^FS`,
    `^FO${BOX_X},34^A0N,22,22^FB${BOX_LARGURA},1,0,C,0^FR^FDVALIDADE^FS`,
    `^FO${BOX_X},120^A0N,70,58^FB${BOX_LARGURA},1,0,C,0^FR^FD${diaMes}^FS`,
    `^FO${BOX_X},200^A0N,56,48^FB${BOX_LARGURA},1,0,C,0^FR^FD${ano}^FS`,

    `^PQ${nCopias}`,
    "^XZ",
  ];

  return linhas.join("\n");
}
