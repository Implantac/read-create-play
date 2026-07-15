/**
 * guaranteeBacktest — verifica em quantos concursos históricos o fechamento
 * teria atingido a garantia meta (minHits) em pelo menos um jogo.
 */

export interface GuaranteeBacktestInput {
  games: number[][];
  minHits: number;
  recentDraws: Array<{ concurso: number; numbers: number[]; date?: string }>;
  window?: number;
}

export interface GuaranteeBacktestPerDraw {
  concurso: number;
  date?: string;
  bestHits: number;
  gamesAtGuarantee: number;
  metGuarantee: boolean;
}

export interface GuaranteeBacktestResult {
  drawsConsidered: number;
  drawsMet: number;
  hitRatePercent: number;
  avgBestHits: number;
  avgGamesAtGuarantee: number;
  histogram: Record<number, number>; // bestHits -> count
  perDraw: GuaranteeBacktestPerDraw[];
  longestStreakMet: number;
  longestStreakMissed: number;
  currentStreakMet: number;
}

export function backtestGuarantee(input: GuaranteeBacktestInput): GuaranteeBacktestResult {
  const window = input.window ?? 100;
  const draws = input.recentDraws.slice(0, window);
  const perDraw: GuaranteeBacktestPerDraw[] = [];
  const histogram: Record<number, number> = {};
  let sumBest = 0;
  let sumGamesAtGuarantee = 0;
  let met = 0;
  let curStreakMet = 0;
  let curStreakMiss = 0;
  let longestMet = 0;
  let longestMiss = 0;
  let currentStreakMet = 0;

  draws.forEach((d, idx) => {
    const set = new Set(d.numbers);
    let best = 0;
    let gamesAtGuarantee = 0;
    for (const g of input.games) {
      let h = 0;
      for (const n of g) if (set.has(n)) h++;
      if (h > best) best = h;
      if (h >= input.minHits) gamesAtGuarantee++;
    }
    histogram[best] = (histogram[best] ?? 0) + 1;
    const metGuarantee = gamesAtGuarantee > 0;
    if (metGuarantee) {
      met++;
      curStreakMet++;
      curStreakMiss = 0;
      if (curStreakMet > longestMet) longestMet = curStreakMet;
    } else {
      curStreakMiss++;
      curStreakMet = 0;
      if (curStreakMiss > longestMiss) longestMiss = curStreakMiss;
    }
    // "current" streak = a partir do topo (índice 0 = mais recente)
    if (idx === 0) currentStreakMet = metGuarantee ? 1 : 0;
    else if (currentStreakMet > 0 && metGuarantee && perDraw.slice(0, idx).every(p => p.metGuarantee)) {
      currentStreakMet = idx + 1;
    }
    sumBest += best;
    sumGamesAtGuarantee += gamesAtGuarantee;
    perDraw.push({ concurso: d.concurso, date: d.date, bestHits: best, gamesAtGuarantee, metGuarantee });
  });

  const n = draws.length;
  return {
    drawsConsidered: n,
    drawsMet: met,
    hitRatePercent: n > 0 ? (met / n) * 100 : 0,
    avgBestHits: n > 0 ? sumBest / n : 0,
    avgGamesAtGuarantee: n > 0 ? sumGamesAtGuarantee / n : 0,
    histogram,
    perDraw,
    longestStreakMet: longestMet,
    longestStreakMissed: longestMiss,
    currentStreakMet,
  };
}
