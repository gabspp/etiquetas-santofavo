/**
 * Modelo de validade por modo de conservação: cada item do catálogo tem um
 * prazo padrão (em dias) para cada modo em que pode ser guardado. Na
 * impressão o operador escolhe o modo e a validade sai daqui — podendo
 * ajustar a data manualmente na UI quando o caso foge do padrão.
 */

export type ModoConservacao = "ambiente" | "refrigerado" | "congelado";

/** Texto exatamente como sai impresso na etiqueta. */
export const MODO_LABEL: Record<ModoConservacao, string> = {
  ambiente: "Temperatura ambiente",
  refrigerado: "Refrigerado 0–4 °C",
  congelado: "Congelado -18 °C",
};

export type PrazosConservacao = {
  dias_ambiente: number | null;
  dias_refrigerado: number | null;
  dias_congelado: number | null;
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

/**
 * data_validade = data_base + dias_<modo>. Lança erro se o item não tem
 * prazo para o modo pedido — a UI só oferece modos válidos, então chegar
 * aqui com modo inválido é bug do chamador, não estado recuperável.
 */
export function calcularValidade(
  modo: ModoConservacao,
  dataBase: Date,
  prazos: PrazosConservacao
): Date {
  const dias = prazos[DIAS_POR_MODO[modo]];
  if (dias == null) {
    throw new ValidadeError(
      `Item não tem prazo configurado para o modo "${modo}" (${DIAS_POR_MODO[modo]} vazio).`
    );
  }
  return somarDiasUTC(dataBase, dias);
}
