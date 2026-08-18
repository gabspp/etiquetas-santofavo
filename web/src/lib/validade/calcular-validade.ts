/**
 * Modelo de validade por modo de conservação: cada item do catálogo tem um
 * prazo padrão (em dias) para cada modo em que pode ser guardado. Na
 * impressão o operador escolhe o modo e a validade sai daqui — podendo
 * ajustar a data manualmente na UI quando o caso foge do padrão.
 *
 * "Aberto" é um evento ortogonal à conservação: uma embalagem já guardada
 * (ambiente/refrigerado/congelado) que foi aberta hoje passa a ter um
 * prazo próprio (`dias_apos_abertura`), o mesmo não importa o modo em que
 * estava guardada.
 */

export type ModoConservacao = "ambiente" | "refrigerado" | "congelado";

/** Texto exatamente como sai impresso na etiqueta. */
export const MODO_LABEL: Record<ModoConservacao, string> = {
  ambiente: "Temperatura ambiente",
  refrigerado: "Refrigerado 0–4 °C",
  congelado: "Congelado -18 °C",
};

/** Rótulo do tipo de data impresso na etiqueta — muda conforme o evento. */
export const TIPO_EVENTO_LABEL = {
  manipulacao: "Manipulação",
  abertura: "Abertura",
} as const;
export type TipoEvento = keyof typeof TIPO_EVENTO_LABEL;

export type PrazosConservacao = {
  dias_ambiente: number | null;
  dias_refrigerado: number | null;
  dias_congelado: number | null;
  dias_apos_abertura: number | null;
};

export class ValidadeError extends Error {}

const DIAS_POR_MODO: Record<ModoConservacao, keyof PrazosConservacao> = {
  ambiente: "dias_ambiente",
  refrigerado: "dias_refrigerado",
  congelado: "dias_congelado",
};

/** Soma dias a uma data em UTC, evitando bugs de fuso/horário de verão. */
function somarDiasUTC(data: Date, dias: number): Date {
  const resultado = new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate())
  );
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

/** Parseia uma data ISO 'YYYY-MM-DD' como meia-noite UTC — usado tanto no
 * client (preview) quanto no server action, para os dois calcularem
 * exatamente a mesma coisa a partir do mesmo texto de input. */
export function parseDataISO(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** Formata uma Date (UTC) de volta para ISO 'YYYY-MM-DD'. */
export function formatarDataISO(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/**
 * Modos de conservação que o item aceita, na ordem em que aparecem na UI.
 * Só retorna modos com prazo configurado — a UI nunca oferece um modo sem
 * prazo, e um item sem nenhum modo não aparece na tela Imprimir.
 */
export function modosDisponiveis(prazos: PrazosConservacao): ModoConservacao[] {
  return (Object.keys(DIAS_POR_MODO) as ModoConservacao[]).filter(
    (modo) => prazos[DIAS_POR_MODO[modo]] != null
  );
}

/** Se o item tem prazo configurado para "aberto" — só então a UI oferece
 * o alternador de embalagem aberta. */
export function temPrazoAbertura(prazos: PrazosConservacao): boolean {
  return prazos.dias_apos_abertura != null;
}

/**
 * data_validade = data_base + dias_<modo>, ou + dias_apos_abertura quando
 * `aberto` é true (o modo continua informando a conservação impressa na
 * etiqueta, só não é usado pra calcular o prazo nesse caso). Lança erro se
 * o item não tem o prazo pedido — a UI só oferece opções válidas, então
 * chegar aqui com prazo ausente é bug do chamador, não estado recuperável.
 */
export function calcularValidade(
  modo: ModoConservacao,
  dataBase: Date,
  prazos: PrazosConservacao,
  aberto: boolean = false
): Date {
  const dias = aberto ? prazos.dias_apos_abertura : prazos[DIAS_POR_MODO[modo]];
  if (dias == null) {
    const campo = aberto ? "dias_apos_abertura" : DIAS_POR_MODO[modo];
    throw new ValidadeError(`Item não tem prazo configurado (${campo} vazio).`);
  }
  return somarDiasUTC(dataBase, dias);
}
