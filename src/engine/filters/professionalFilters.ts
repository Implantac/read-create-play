/**
 * Filtros profissionais parametrizados por modalidade.
 *
 * Todos os filtros são PUROS (sem side effects) e retornam
 * { pass, score (0-1), reason }. Isso permite:
 *   - Uso em Web Workers (analytics.worker.ts)
 *   - Composição no scoring do Titan Score
 *   - Explicabilidade direta no GameAnalysisBlock
 *
 * Um jogo é considerado "profissional" quando passa em ≥ 80% dos filtros
 * aplicáveis à modalidade e tem `score médio` ≥ 0.65.
 */

import type { DrawResult } from "@/data/lotteries";
import { getLotteryProfile, type LotteryProfile } from "@/ai/knowledge/lotteryProfiles";

export interface FilterResult {
  name: string;
  pass: boolean;
  score: number; // 0-1
  reason: string;
}

export interface ProfessionalEvaluation {
  results: FilterResult[];
  passRate: number;      // 0-1 — proporção de filtros aprovados
  averageScore: number;  // 0-1 — média ponderada dos scores
  isProfessional: boolean;
  reasons: string[];     // top 3 pontos fortes
  warnings: string[];    // top 3 pontos fracos
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const rangeScore = (value: number, min: number, ideal: number, max: number): number => {
  if (value < min || value > max) return 0;
  const half = value <= ideal ? ideal - min : max - ideal;
  if (half === 0) return 1;
  const distance = Math.abs(value - ideal);
  return clamp01(1 - distance / half);
};

const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
};

const FIBONACCI = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);

// ---------------------------------------------------------------------------
// Filtros individuais
// ---------------------------------------------------------------------------

export function filterSum(bet: number[], profile: LotteryProfile): FilterResult {
  const sum = bet.reduce((a, b) => a + b, 0);
  const score = rangeScore(sum, profile.sum.min, profile.sum.ideal, profile.sum.max);
  return {
    name: "Soma total",
    pass: sum >= profile.sum.min && sum <= profile.sum.max,
    score,
    reason: `Soma ${sum} (faixa ideal ${profile.sum.min}–${profile.sum.max})`,
  };
}

export function filterParity(bet: number[], profile: LotteryProfile): FilterResult {
  const evens = bet.filter(n => n % 2 === 0).length;
  const pass = evens >= profile.parity.minEvens && evens <= profile.parity.maxEvens;
  const center = (profile.parity.minEvens + profile.parity.maxEvens) / 2;
  const span = Math.max(1, (profile.parity.maxEvens - profile.parity.minEvens) / 2 + 1);
  const score = clamp01(1 - Math.abs(evens - center) / span);
  return {
    name: "Paridade dinâmica",
    pass,
    score,
    reason: `${evens} pares (faixa histórica ${profile.parity.minEvens}–${profile.parity.maxEvens})`,
  };
}

export function filterHighLow(bet: number[], profile: LotteryProfile): FilterResult {
  const half = Math.ceil(profile.universe / 2);
  const low = bet.filter(n => n <= half).length;
  const pass = low >= profile.highLow.minLow && low <= profile.highLow.maxLow;
  const center = (profile.highLow.minLow + profile.highLow.maxLow) / 2;
  const span = Math.max(1, (profile.highLow.maxLow - profile.highLow.minLow) / 2 + 1);
  const score = clamp01(1 - Math.abs(low - center) / span);
  return {
    name: "Alto/Baixo",
    pass,
    score,
    reason: `${low} baixos e ${bet.length - low} altos`,
  };
}

export function filterConsecutive(bet: number[], profile: LotteryProfile): FilterResult {
  const sorted = [...bet].sort((a, b) => a - b);
  let maxRun = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      run++;
      if (run > maxRun) maxRun = run;
    } else run = 1;
  }
  const pass = maxRun <= profile.maxConsecutive;
  const score = clamp01(1 - Math.max(0, maxRun - profile.maxConsecutive) / 3);
  return {
    name: "Sequências consecutivas",
    pass,
    score,
    reason: `Maior sequência de ${maxRun} (limite ${profile.maxConsecutive})`,
  };
}

export function filterGap(bet: number[], profile: LotteryProfile): FilterResult {
  const sorted = [...bet].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const avg = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const pass = avg >= profile.gap.minAvg && avg <= profile.gap.maxAvg;
  const center = (profile.gap.minAvg + profile.gap.maxAvg) / 2;
  const span = Math.max(0.5, (profile.gap.maxAvg - profile.gap.minAvg) / 2 + 0.5);
  const score = clamp01(1 - Math.abs(avg - center) / span);
  return {
    name: "Distância média",
    pass,
    score,
    reason: `Gap médio ${avg.toFixed(1)} (ideal ${profile.gap.minAvg}–${profile.gap.maxAvg})`,
  };
}

export function filterPreviousRepeat(
  bet: number[],
  profile: LotteryProfile,
  draws: DrawResult[]
): FilterResult {
  const last = draws[0]?.numbers ?? [];
  if (last.length === 0) {
    return { name: "Repetição sorteio anterior", pass: true, score: 0.5, reason: "Sem sorteio anterior" };
  }
  const set = new Set(last);
  const repeat = bet.filter(n => set.has(n)).length;
  const pass = repeat >= profile.previousRepeat.min && repeat <= profile.previousRepeat.max;
  const score = rangeScore(repeat, profile.previousRepeat.min, profile.previousRepeat.ideal, profile.previousRepeat.max);
  return {
    name: "Repetição sorteio anterior",
    pass,
    score,
    reason: `${repeat} dezenas repetem o último (ideal ${profile.previousRepeat.ideal})`,
  };
}

export function filterHistoricalSimilarity(
  bet: number[],
  profile: LotteryProfile,
  draws: DrawResult[]
): FilterResult {
  if (draws.length === 0) {
    return { name: "Semelhança histórica", pass: true, score: 1, reason: "Base vazia" };
  }
  const betSet = new Set(bet);
  let maxOverlap = 0;
  const scan = Math.min(draws.length, 500);
  for (let i = 0; i < scan; i++) {
    let overlap = 0;
    for (const n of draws[i].numbers) if (betSet.has(n)) overlap++;
    if (overlap > maxOverlap) maxOverlap = overlap;
  }
  const similarity = maxOverlap / bet.length;
  const pass = similarity <= profile.maxHistoricalSimilarity;
  const score = clamp01(1 - similarity / profile.maxHistoricalSimilarity);
  return {
    name: "Semelhança histórica",
    pass,
    score,
    reason: `Máxima sobreposição ${maxOverlap}/${bet.length} com sorteios anteriores`,
  };
}

export function filterMaxDelay(
  bet: number[],
  profile: LotteryProfile,
  draws: DrawResult[]
): FilterResult {
  if (draws.length === 0) {
    return { name: "Atraso máximo", pass: true, score: 1, reason: "Base vazia" };
  }
  const delayOf = new Map<number, number>();
  for (let i = 0; i < draws.length; i++) {
    for (const n of draws[i].numbers) {
      if (!delayOf.has(n)) delayOf.set(n, i);
    }
  }
  const delays = bet.map(n => delayOf.get(n) ?? draws.length);
  const maxD = Math.max(...delays);
  const pass = maxD <= profile.maxDelay;
  const score = clamp01(1 - Math.max(0, maxD - profile.maxDelay) / profile.maxDelay);
  return {
    name: "Atraso máximo",
    pass,
    score,
    reason: `Maior atraso ${maxD} concursos (limite ${profile.maxDelay})`,
  };
}

export function filterPrimes(bet: number[], profile: LotteryProfile): FilterResult {
  const primes = bet.filter(isPrime).length;
  const expected = bet.length * 0.3; // ~30% dos números até 100 são primos
  const score = clamp01(1 - Math.abs(primes - expected) / expected);
  return {
    name: "Distribuição de primos",
    pass: primes >= 1 && primes <= bet.length - 1,
    score,
    reason: `${primes} primos no jogo`,
  };
}

export function filterFibonacci(bet: number[]): FilterResult {
  const fib = bet.filter(n => FIBONACCI.has(n)).length;
  const pass = fib <= 4; // muitos Fibonacci indica viés
  const score = clamp01(1 - Math.max(0, fib - 3) / 4);
  return {
    name: "Padrão Fibonacci",
    pass,
    score,
    reason: `${fib} dezenas de Fibonacci`,
  };
}

// ---------------------------------------------------------------------------
// Avaliação consolidada
// ---------------------------------------------------------------------------

export function evaluateBetProfessional(
  bet: number[],
  lotteryId: string,
  draws: DrawResult[]
): ProfessionalEvaluation {
  const profile = getLotteryProfile(lotteryId);

  const results: FilterResult[] = [
    filterSum(bet, profile),
    filterParity(bet, profile),
    filterHighLow(bet, profile),
    filterConsecutive(bet, profile),
    filterGap(bet, profile),
    filterPreviousRepeat(bet, profile, draws),
    filterHistoricalSimilarity(bet, profile, draws),
    filterMaxDelay(bet, profile, draws),
    filterPrimes(bet, profile),
    filterFibonacci(bet),
  ];

  const passed = results.filter(r => r.pass).length;
  const passRate = passed / results.length;
  const averageScore = results.reduce((a, r) => a + r.score, 0) / results.length;

  const sorted = [...results].sort((a, b) => b.score - a.score);
  const reasons = sorted.slice(0, 3).map(r => r.reason);
  const warnings = sorted
    .slice(-3)
    .filter(r => !r.pass || r.score < 0.4)
    .map(r => r.reason);

  return {
    results,
    passRate,
    averageScore,
    isProfessional: passRate >= 0.8 && averageScore >= 0.65,
    reasons,
    warnings,
  };
}
