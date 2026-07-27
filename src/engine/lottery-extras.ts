/**
 * Elementos extras obrigatórios por modalidade (além das dezenas).
 * - Timemania: Time do Coração (prêmio fixo R$ 6,50)
 * - Dia de Sorte: Mês da Sorte (prêmio integra a faixa principal)
 *
 * Uso: complementam o palpite antes do usuário registrar na Caixa.
 */

export const TIMES_TIMEMANIA: string[] = [
  "Água Santa/RS", "ABC/SP", "Altos/PI", "Amazonas/AM", "América/MG",
  "América/RN", "Anápolis/GO", "Aparecidense/GO", "Athletico/PR", "Atlético/GO",
  "Atlético/MG", "Avaí/SC", "Bahia/BA", "Bahia de Feira/BA", "Botafogo/RJ",
  "Botafogo/SP", "Botafogo/PB", "Bragantino/SP", "Brasil/RS", "Brasiliense/DF",
  "Ceará/CE", "Chapecoense/SC", "Confiança/SE", "Corinthians/SP", "Coritiba/PR",
  "CRB/AL", "Criciúma/SC", "Cruzeiro/MG", "Cuiabá/MT", "CSA/AL",
  "Djalma Ulrich/RJ", "Ferroviária/SP", "Figueirense/SC", "Flamengo/RJ", "Fluminense/RJ",
  "Fortaleza/CE", "Goiás/GO", "Grêmio/RS", "Guarani/SP", "Internacional/RS",
  "Ituano/SP", "Juventude/RS", "Londrina/PR", "Manaus/AM", "Mirassol/SP",
  "Náutico/PE", "Novorizontino/SP", "Operário/PR", "Palmeiras/SP", "Paraná/PR",
  "Paysandu/PA", "Ponte Preta/SP", "Portuguesa/SP", "Remo/PA", "Sampaio Corrêa/MA",
  "Santa Cruz/PE", "Santo André/SP", "Santos/SP", "São Bento/SP", "São Paulo/SP",
  "Sport/PE", "Tombense/MG", "Tuna Luso/PA", "Vasco da Gama/RJ", "Vila Nova/GO",
  "Villa Nova/MG", "Vitória/BA", "Volta Redonda/RJ", "XV de Piracicaba/SP", "Ypiranga/RS",
  "Juventus/SP", "América/CE", "ABC/RN", "Botafogo/CE", "CSE/AL",
  "Rio Branco/AC", "Rio Branco/ES", "Náutico/RR", "Nacional/AM", "Confiança/PE",
];

export const MESES_DIA_DE_SORTE: string[] = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface LotteryExtra {
  /** Rótulo humano do campo extra */
  label: string;
  /** Chave do campo (para serialização) */
  key: "time_coracao" | "mes_sorte";
  /** Valor escolhido */
  value: string;
  /** Índice 1-based (para times, é o número oficial 1..80; para meses, 1..12) */
  index: number;
}

/**
 * Retorna o elemento extra necessário para a modalidade, ou null se não houver.
 * Estratégia: se `preferred` for informado, usa-o; caso contrário sorteia.
 */
export function generateLotteryExtra(
  lotteryId: string,
  preferred?: string,
): LotteryExtra | null {
  if (lotteryId === "timemania") {
    const list = TIMES_TIMEMANIA;
    const idx = preferred
      ? Math.max(0, list.findIndex(t => t.toLowerCase() === preferred.toLowerCase()))
      : Math.floor(Math.random() * list.length);
    return {
      label: "Time do Coração",
      key: "time_coracao",
      value: list[idx],
      index: idx + 1,
    };
  }
  if (lotteryId === "diadesorte") {
    const list = MESES_DIA_DE_SORTE;
    const idx = preferred
      ? Math.max(0, list.findIndex(m => m.toLowerCase() === preferred.toLowerCase()))
      : Math.floor(Math.random() * list.length);
    return {
      label: "Mês da Sorte",
      key: "mes_sorte",
      value: list[idx],
      index: idx + 1,
    };
  }
  return null;
}

/** Loterias que exigem um elemento extra obrigatório na aposta */
export function requiresExtra(lotteryId: string): boolean {
  return lotteryId === "timemania" || lotteryId === "diadesorte";
}

/** Loterias com múltiplos sorteios por concurso */
export function drawsPerContest(lotteryId: string): number {
  return lotteryId === "duplasena" ? 2 : 1;
}
