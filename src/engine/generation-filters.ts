import { NumberStats } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";

// ═══════════════════════════════════════════════════════
// FILTROS AVANÇADOS DE PRÉ E PÓS-GERAÇÃO
// ═══════════════════════════════════════════════════════

export interface GenerationFilters {
  fixedNumbers: number[];       // dezenas obrigatórias
  excludedNumbers: number[];    // dezenas excluídas
  sumMin: number | null;        // soma mínima
  sumMax: number | null;        // soma máxima
  minEven: number | null;       // mínimo de pares
  maxEven: number | null;       // máximo de pares
  maxConsecutive: number | null; // máximo de sequências consecutivas
  mustIncludeHot: number;       // mínimo de dezenas quentes
  mustIncludeCold: number;      // mínimo de dezenas frias
}

export const DEFAULT_FILTERS: GenerationFilters = {
  fixedNumbers: [],
  excludedNumbers: [],
  sumMin: null,
  sumMax: null,
  minEven: null,
  maxEven: null,
  maxConsecutive: null,
  mustIncludeHot: 0,
  mustIncludeCold: 0,
};

/**
 * Computa faixas ideais de soma baseadas no histórico
 */
export function computeIdealSumRange(draws: DrawResult[], config: LotteryConfig): { min: number; max: number; avg: number } {
  if (draws.length === 0) {
    const expectedAvg = (config.numbers * (config.numbers + 1) / 2) * (config.pick / config.numbers);
    return { min: Math.round(expectedAvg * 0.8), max: Math.round(expectedAvg * 1.2), avg: Math.round(expectedAvg) };
  }
  const sums = draws.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
  const stdDev = Math.sqrt(sums.reduce((s, v) => s + (v - avg) ** 2, 0) / sums.length);
  return {
    min: Math.round(avg - stdDev * 1.5),
    max: Math.round(avg + stdDev * 1.5),
    avg: Math.round(avg),
  };
}

/**
 * Computa paridade ideal baseada no histórico
 */
export function computeIdealParity(draws: DrawResult[], config: LotteryConfig): { minEven: number; maxEven: number; avgEven: number } {
  if (draws.length === 0) {
    const half = Math.round(config.pick / 2);
    return { minEven: half - 1, maxEven: half + 1, avgEven: half };
  }
  const evenCounts = draws.map(d => d.numbers.filter(n => n % 2 === 0).length);
  const avg = evenCounts.reduce((a, b) => a + b, 0) / evenCounts.length;
  const stdDev = Math.sqrt(evenCounts.reduce((s, v) => s + (v - avg) ** 2, 0) / evenCounts.length);
  return {
    minEven: Math.max(0, Math.round(avg - stdDev)),
    maxEven: Math.min(config.pick, Math.round(avg + stdDev)),
    avgEven: Math.round(avg),
  };
}

/**
 * Verifica se uma aposta atende aos filtros
 */
export function betMatchesFilters(bet: number[], filters: GenerationFilters, stats: NumberStats[]): boolean {
  // Dezenas obrigatórias
  if (filters.fixedNumbers.length > 0) {
    if (!filters.fixedNumbers.every(n => bet.includes(n))) return false;
  }

  // Dezenas excluídas
  if (filters.excludedNumbers.length > 0) {
    if (filters.excludedNumbers.some(n => bet.includes(n))) return false;
  }

  // Soma
  const sum = bet.reduce((a, b) => a + b, 0);
  if (filters.sumMin !== null && sum < filters.sumMin) return false;
  if (filters.sumMax !== null && sum > filters.sumMax) return false;

  // Paridade
  const evenCount = bet.filter(n => n % 2 === 0).length;
  if (filters.minEven !== null && evenCount < filters.minEven) return false;
  if (filters.maxEven !== null && evenCount > filters.maxEven) return false;

  // Consecutivas
  if (filters.maxConsecutive !== null) {
    const sorted = [...bet].sort((a, b) => a - b);
    let consecutivePairs = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) consecutivePairs++;
    }
    if (consecutivePairs > filters.maxConsecutive) return false;
  }

  // Quentes obrigatórias
  if (filters.mustIncludeHot > 0) {
    const hotCount = bet.filter(n => {
      const s = stats.find(st => st.number === n);
      return s?.status === "hot";
    }).length;
    if (hotCount < filters.mustIncludeHot) return false;
  }

  // Frias obrigatórias
  if (filters.mustIncludeCold > 0) {
    const coldCount = bet.filter(n => {
      const s = stats.find(st => st.number === n);
      return s?.status === "cold";
    }).length;
    if (coldCount < filters.mustIncludeCold) return false;
  }

  return true;
}

/**
 * Gera uma aposta respeitando os filtros (injeta fixedNumbers, remove excludedNumbers)
 */
export function generateWithFilters(
  generateFn: () => number[],
  filters: GenerationFilters,
  stats: NumberStats[],
  config: LotteryConfig,
  maxAttempts: number = 100
): number[] | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let bet = generateFn();

    // Inject fixed numbers
    if (filters.fixedNumbers.length > 0) {
      const remaining = bet.filter(n => !filters.fixedNumbers.includes(n) && !filters.excludedNumbers.includes(n));
      const needed = config.pick - filters.fixedNumbers.length;
      bet = [...filters.fixedNumbers, ...remaining.slice(0, needed)];

      // Fill if not enough
      while (bet.length < config.pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!bet.includes(n) && !filters.excludedNumbers.includes(n)) {
          bet.push(n);
        }
      }
      bet = bet.slice(0, config.pick).sort((a, b) => a - b);
    }

    // Remove excluded numbers
    if (filters.excludedNumbers.length > 0) {
      const excluded = bet.filter(n => filters.excludedNumbers.includes(n));
      if (excluded.length > 0) {
        bet = bet.filter(n => !filters.excludedNumbers.includes(n));
        while (bet.length < config.pick) {
          const n = Math.floor(Math.random() * config.numbers) + 1;
          if (!bet.includes(n) && !filters.excludedNumbers.includes(n)) {
            bet.push(n);
          }
        }
        bet = bet.sort((a, b) => a - b);
      }
    }

    if (betMatchesFilters(bet, filters, stats)) {
      return bet;
    }
  }
  return null; // Could not generate a bet matching all filters
}

// ═══════════════════════════════════════════════════════
// VALIDAÇÃO CONTRA HISTÓRICO
// ═══════════════════════════════════════════════════════

export interface HistoricalValidation {
  totalDraws: number;
  avgHits: number;
  maxHits: number;
  maxHitsConcurso: number;
  hitDistribution: { hits: number; count: number; percentage: number }[];
  wouldWin: number;        // quantas vezes ganharia algum prêmio
  winRate: string;         // percentual de vitória
  bestMatch: { concurso: number; hits: number; date: string } | null;
}

export function validateAgainstHistory(
  bet: number[],
  draws: DrawResult[],
  config: LotteryConfig,
  maxDraws: number = 200
): HistoricalValidation {
  const recentDraws = draws.slice(0, maxDraws);
  if (recentDraws.length === 0) {
    return {
      totalDraws: 0, avgHits: 0, maxHits: 0, maxHitsConcurso: 0,
      hitDistribution: [], wouldWin: 0, winRate: "0%", bestMatch: null,
    };
  }

  const hitCounts: number[] = [];
  let maxHits = 0;
  let bestMatch: HistoricalValidation["bestMatch"] = null;

  for (const draw of recentDraws) {
    const hits = bet.filter(n => draw.numbers.includes(n)).length;
    hitCounts.push(hits);
    if (hits > maxHits) {
      maxHits = hits;
      bestMatch = { concurso: draw.concurso, hits, date: draw.date };
    }
  }

  const avgHits = hitCounts.reduce((a, b) => a + b, 0) / hitCounts.length;

  // Hit distribution
  const dist = new Map<number, number>();
  hitCounts.forEach(h => dist.set(h, (dist.get(h) || 0) + 1));
  const hitDistribution = Array.from(dist.entries())
    .map(([hits, count]) => ({
      hits,
      count,
      percentage: Math.round((count / hitCounts.length) * 100),
    }))
    .sort((a, b) => b.hits - a.hits);

  // Prize thresholds
  const prizeThreshold = getPrizeThresholdForConfig(config);
  const wouldWin = hitCounts.filter(h => h >= prizeThreshold).length;
  const winRate = `${((wouldWin / hitCounts.length) * 100).toFixed(1)}%`;

  return {
    totalDraws: recentDraws.length,
    avgHits: Math.round(avgHits * 10) / 10,
    maxHits,
    maxHitsConcurso: bestMatch?.concurso || 0,
    hitDistribution,
    wouldWin,
    winRate,
    bestMatch,
  };
}

function getPrizeThresholdForConfig(config: LotteryConfig): number {
  const thresholds: Record<string, number> = {
    megasena: 4, lotofacil: 11, quina: 2, lotomania: 15,
    duplasena: 3, timemania: 3, diadesorte: 4, supersete: 3,
  };
  return thresholds[config.id] || Math.ceil(config.pick * 0.6);
}
