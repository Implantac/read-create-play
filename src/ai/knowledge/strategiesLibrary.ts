/**
 * Biblioteca de Estratégias Profissionais
 * Módulo completo com 6 estratégias avançadas para geração de apostas
 */

import { NumberStats } from "@/engine/statistics";
import { DrawResult } from "@/data/lotteries";
import { getLotteryRules, PRIMES, FIBONACCI } from "./lotteriesKnowledge";

export interface StrategyResult {
  id: string;
  name: string;
  description: string;
  candidateNumbers: number[];
  weights: Map<number, number>;
  metrics: Record<string, number>;
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 1 — FREQUÊNCIA
// Selecionar números com maior ocorrência histórica
// ═══════════════════════════════════════════
export function strategyFrequency(
  stats: NumberStats[],
  draws: DrawResult[],
  topN: number = 18
): StrategyResult {
  const sorted = [...stats].sort((a, b) => b.frequency - a.frequency);
  const candidates = sorted.slice(0, topN).map(s => s.number);
  const weights = new Map<number, number>();
  
  sorted.forEach((s, idx) => {
    // Weight based on frequency rank + recent frequency boost
    const recentFreq = computeRecentFrequency(s.number, draws, 20);
    const totalWeight = s.frequency * 0.6 + recentFreq * 0.4;
    weights.set(s.number, totalWeight);
  });

  const avgFreq = stats.reduce((sum, s) => sum + s.frequency, 0) / stats.length;
  
  return {
    id: "frequency",
    name: "Frequência Histórica",
    description: "Prioriza números com maior ocorrência nos concursos anteriores, ponderando frequência total e recente.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      avgFrequency: avgFreq,
      topFrequency: sorted[0]?.frequency || 0,
      recentWindow: 20,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 2 — ATRASO
// Selecionar números que não aparecem há vários concursos
// ═══════════════════════════════════════════
export function strategyDelay(
  stats: NumberStats[],
  draws: DrawResult[],
  topN: number = 18
): StrategyResult {
  const sorted = [...stats].sort((a, b) => b.lastSeen - a.lastSeen);
  const candidates = sorted.slice(0, topN).map(s => s.number);
  const weights = new Map<number, number>();

  const maxDelay = Math.max(...stats.map(s => s.lastSeen));
  sorted.forEach(s => {
    // Higher weight for more delayed numbers, with cycle score boost
    const delayWeight = (s.lastSeen / maxDelay) * 0.7 + (s.cycleScore > 1 ? 0.3 : 0);
    weights.set(s.number, delayWeight * 10);
  });

  return {
    id: "delay",
    name: "Números Atrasados",
    description: "Prioriza números que estão há mais concursos sem ser sorteados, considerando ciclos históricos de retorno.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      maxDelay: maxDelay,
      avgDelay: stats.reduce((s, st) => s + st.lastSeen, 0) / stats.length,
      delayedAbove10: stats.filter(s => s.lastSeen > 10).length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 3 — EQUILÍBRIO ESTRUTURAL
// Distribuir pares/ímpares e baixos/altos
// ═══════════════════════════════════════════
export function strategyBalance(
  stats: NumberStats[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const mid = Math.ceil(rules.totalNumbers / 2);
  
  const evens = stats.filter(s => s.number % 2 === 0).sort((a, b) => b.frequency - a.frequency);
  const odds = stats.filter(s => s.number % 2 !== 0).sort((a, b) => b.frequency - a.frequency);
  const lows = stats.filter(s => s.number <= mid).sort((a, b) => b.frequency - a.frequency);
  const highs = stats.filter(s => s.number > mid).sort((a, b) => b.frequency - a.frequency);

  // Pick balanced amounts from each group
  const halfN = Math.ceil(topN / 2);
  const candidateSet = new Set<number>();
  
  evens.slice(0, halfN).forEach(s => candidateSet.add(s.number));
  odds.slice(0, halfN).forEach(s => candidateSet.add(s.number));
  lows.slice(0, halfN).forEach(s => candidateSet.add(s.number));
  highs.slice(0, halfN).forEach(s => candidateSet.add(s.number));

  const candidates = [...candidateSet].sort((a, b) => a - b).slice(0, topN);
  const weights = new Map<number, number>();
  
  candidates.forEach(n => {
    const stat = stats.find(s => s.number === n);
    const isEven = n % 2 === 0;
    const isLow = n <= mid;
    const isPrime = PRIMES.has(n);
    const isFib = FIBONACCI.has(n);
    let w = (stat?.frequency || 0) * 0.4;
    w += isPrime ? 1.5 : 0;
    w += isFib ? 1.0 : 0;
    w += (isEven ? 0.5 : 0.5); // equal weight
    w += (isLow ? 0.5 : 0.5);
    weights.set(n, w);
  });

  return {
    id: "balance",
    name: "Equilíbrio Estrutural",
    description: "Distribui números equilibrando pares/ímpares e baixos/altos, com bônus para primos e Fibonacci.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      evens: candidates.filter(n => n % 2 === 0).length,
      odds: candidates.filter(n => n % 2 !== 0).length,
      lows: candidates.filter(n => n <= mid).length,
      highs: candidates.filter(n => n > mid).length,
      primes: candidates.filter(n => PRIMES.has(n)).length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 4 — DISPERSÃO
// Evitar concentração em uma região do volante
// ═══════════════════════════════════════════
export function strategyDispersion(
  stats: NumberStats[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const rangeSize = Math.ceil(rules.totalNumbers / 5);
  
  // Divide into 5 ranges
  const ranges: NumberStats[][] = [];
  for (let r = 0; r < 5; r++) {
    const lo = r * rangeSize + 1;
    const hi = Math.min((r + 1) * rangeSize, rules.totalNumbers);
    ranges.push(stats.filter(s => s.number >= lo && s.number <= hi).sort((a, b) => b.frequency - a.frequency));
  }

  // Pick proportionally from each range
  const perRange = Math.ceil(topN / 5);
  const candidates: number[] = [];
  const weights = new Map<number, number>();

  ranges.forEach((range, rIdx) => {
    range.slice(0, perRange).forEach(s => {
      candidates.push(s.number);
      // Weight: frequency + dispersion bonus
      weights.set(s.number, s.frequency + (rIdx + 1) * 0.5);
    });
  });

  return {
    id: "dispersion",
    name: "Dispersão no Volante",
    description: "Distribui números uniformemente por todas as faixas do volante, evitando concentração.",
    candidateNumbers: candidates.slice(0, topN).sort((a, b) => a - b),
    weights,
    metrics: {
      rangesUsed: ranges.filter(r => r.length > 0).length,
      numbersPerRange: perRange,
      rangeSize,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 5 — ANTI-PADRÕES
// Evitar sequências longas, números colados e padrões visuais
// ═══════════════════════════════════════════
export function strategyAntiPattern(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  
  // Score each number by how "unpredictable" it is
  const weights = new Map<number, number>();
  const scored = stats.map(s => {
    // Penalize numbers that commonly appear in sequences
    const seqPenalty = computeSequencePenalty(s.number, draws, rules.totalNumbers);
    // Penalize popular numbers (anti-popular)
    const popularityPenalty = s.frequency / draws.length;
    // Favor numbers with irregular patterns
    const irregularity = (s as any).stdDevInterval || 1;
    
    const score = irregularity * 2 - seqPenalty * 3 - popularityPenalty * 1.5;
    weights.set(s.number, Math.max(0.1, score));
    return { number: s.number, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, topN).map(s => s.number).sort((a, b) => a - b);

  return {
    id: "anti_pattern",
    name: "Anti-Padrões",
    description: "Evita sequências longas, números colados e padrões visuais óbvios. Ideal para diferenciação.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      avgIrregularity: scored.slice(0, topN).reduce((s, v) => s + v.score, 0) / topN,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 6 — COBERTURA
// Gerar múltiplos jogos que cobrem diferentes regiões
// ═══════════════════════════════════════════
export function strategyCoverage(
  stats: NumberStats[],
  lotteryId: string,
  topN: number = 22
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  
  // Select maximum coverage pool
  // Mix: top frequency + top delayed + primes + fibonacci
  const byFreq = [...stats].sort((a, b) => b.frequency - a.frequency).slice(0, Math.ceil(topN * 0.4));
  const byDelay = [...stats].sort((a, b) => b.lastSeen - a.lastSeen).slice(0, Math.ceil(topN * 0.3));
  const primeNums = stats.filter(s => PRIMES.has(s.number)).sort((a, b) => b.frequency - a.frequency).slice(0, Math.ceil(topN * 0.15));
  const fibNums = stats.filter(s => FIBONACCI.has(s.number)).sort((a, b) => b.frequency - a.frequency).slice(0, Math.ceil(topN * 0.15));

  const candidateSet = new Set<number>();
  [...byFreq, ...byDelay, ...primeNums, ...fibNums].forEach(s => candidateSet.add(s.number));
  
  const candidates = [...candidateSet].sort((a, b) => a - b).slice(0, topN);
  const weights = new Map<number, number>();

  candidates.forEach(n => {
    const stat = stats.find(s => s.number === n);
    const w = (stat?.frequency || 0) * 0.3 + (stat?.lastSeen || 0) * 0.3 + 
              (PRIMES.has(n) ? 2 : 0) + (FIBONACCI.has(n) ? 1.5 : 0) +
              (stat?.cycleScore || 0) * 1.5;
    weights.set(n, w);
  });

  return {
    id: "coverage",
    name: "Cobertura Máxima",
    description: "Maximiza a dispersão numérica combinando frequência, atraso, primos e Fibonacci para cobrir mais faixas.",
    candidateNumbers: candidates,
    weights,
    metrics: {
      poolSize: candidates.length,
      fromFrequency: byFreq.length,
      fromDelay: byDelay.length,
      primes: primeNums.length,
      fibonacci: fibNums.length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 7 — MARKOV (Transições)
// Usa probabilidades de transição entre sorteios
// ═══════════════════════════════════════════
export function strategyMarkov(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  if (draws.length < 2) return strategyFrequency(stats, draws, topN);

  // Build transition matrix: P(number appears | previous draw contained X)
  const transitionBoost = new Map<number, number>();
  const lastDraw = draws[0].numbers;
  const lastSet = new Set(lastDraw);

  // For each past pair of consecutive draws, learn which numbers follow which
  const followCount = new Map<number, Map<number, number>>();
  for (let i = 0; i < Math.min(draws.length - 1, 200); i++) {
    const current = draws[i].numbers;
    const prev = draws[i + 1].numbers;
    for (const p of prev) {
      if (!followCount.has(p)) followCount.set(p, new Map());
      const map = followCount.get(p)!;
      for (const c of current) {
        map.set(c, (map.get(c) || 0) + 1);
      }
    }
  }

  // Score each number by how strongly it follows the last draw's numbers
  for (let n = 1; n <= rules.totalNumbers; n++) {
    let boost = 0;
    for (const prev of lastDraw) {
      const map = followCount.get(prev);
      if (map) {
        const count = map.get(n) || 0;
        const total = [...map.values()].reduce((a, b) => a + b, 0);
        if (total > 0) boost += count / total;
      }
    }
    transitionBoost.set(n, boost);
  }

  const weights = new Map<number, number>();
  const scored = stats.map(s => {
    const tBoost = transitionBoost.get(s.number) || 0;
    const w = s.frequency * 0.3 + tBoost * 10 + (s.cycleScore > 1 ? 1.5 : 0);
    weights.set(s.number, Math.max(0.1, w));
    return { number: s.number, score: w };
  });
  scored.sort((a, b) => b.score - a.score);

  return {
    id: "markov",
    name: "Cadeia de Markov",
    description: "Probabilidades de transição: quais números tendem a suceder os do último sorteio.",
    candidateNumbers: scored.slice(0, topN).map(s => s.number).sort((a, b) => a - b),
    weights,
    metrics: {
      transitionsAnalyzed: Math.min(draws.length - 1, 200),
      lastDrawSize: lastDraw.length,
      avgTransitionBoost: [...transitionBoost.values()].reduce((a, b) => a + b, 0) / rules.totalNumbers,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 8 — MOMENTUM & TENDÊNCIA
// Números em aceleração de frequência
// ═══════════════════════════════════════════
export function strategyMomentum(
  stats: NumberStats[],
  draws: DrawResult[],
  topN: number = 18
): StrategyResult {
  // Multi-window frequency comparison
  const windows = [5, 15, 50];
  const freqByWindow: Map<number, number[]> = new Map();

  for (const s of stats) {
    const freqs = windows.map(w => {
      const subset = draws.slice(0, Math.min(w, draws.length));
      return subset.filter(d => d.numbers.includes(s.number)).length / Math.max(1, subset.length);
    });
    freqByWindow.set(s.number, freqs);
  }

  const weights = new Map<number, number>();
  const scored = stats.map(s => {
    const [short, mid, long] = freqByWindow.get(s.number) || [0, 0, 0];
    // Acceleration: short > mid > long means positive momentum
    const momentum = (short - mid) * 3 + (mid - long) * 1.5;
    const acceleration = short - 2 * mid + long; // 2nd derivative
    const w = Math.max(0.1, s.frequency * 0.2 + momentum * 8 + acceleration * 4 + short * 5);
    weights.set(s.number, w);
    return { number: s.number, score: w, momentum, acceleration };
  });
  scored.sort((a, b) => b.score - a.score);

  const accelerating = scored.filter(s => s.acceleration > 0).length;

  return {
    id: "momentum",
    name: "Momentum & Tendência",
    description: "Identifica números em aceleração — frequência crescente nos últimos concursos.",
    candidateNumbers: scored.slice(0, topN).map(s => s.number).sort((a, b) => a - b),
    weights,
    metrics: {
      acceleratingNumbers: accelerating,
      topMomentum: scored[0]?.momentum || 0,
      windowsUsed: windows.length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 9 — HARMÔNICO MATEMÁTICO
// Propriedades matemáticas + equilíbrio
// ═══════════════════════════════════════════
const PERFECT_SQUARES = new Set([1,4,9,16,25,36,49,64,81,100]);
const TRIANGULAR = new Set([1,3,6,10,15,21,28,36,45,55,66,78,91]);

export function strategyHarmonic(
  stats: NumberStats[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const weights = new Map<number, number>();

  const scored = stats.map(s => {
    const n = s.number;
    let w = s.frequency * 0.3;

    // Mathematical property bonuses
    if (PRIMES.has(n)) w += 2.0;
    if (FIBONACCI.has(n)) w += 1.8;
    if (PERFECT_SQUARES.has(n) && n <= rules.totalNumbers) w += 1.5;
    if (TRIANGULAR.has(n) && n <= rules.totalNumbers) w += 1.2;

    // Digit sum harmony (numbers whose digits sum to common lucky values)
    const digitSum = String(n).split("").reduce((a, d) => a + parseInt(d), 0);
    if ([7, 9, 11, 13].includes(digitSum)) w += 0.8;

    // Golden ratio distribution bonus
    const goldenPos = (n / rules.totalNumbers) * 1.618;
    const fracPart = goldenPos - Math.floor(goldenPos);
    if (fracPart > 0.3 && fracPart < 0.7) w += 0.5;

    weights.set(n, Math.max(0.1, w));
    return { number: n, score: w };
  });
  scored.sort((a, b) => b.score - a.score);

  return {
    id: "harmonic",
    name: "Harmônico Matemático",
    description: "Combina primos, Fibonacci, quadrados perfeitos e números triangulares com equilíbrio estrutural.",
    candidateNumbers: scored.slice(0, topN).map(s => s.number).sort((a, b) => a - b),
    weights,
    metrics: {
      primes: scored.slice(0, topN).filter(s => PRIMES.has(s.number)).length,
      fibonacci: scored.slice(0, topN).filter(s => FIBONACCI.has(s.number)).length,
      squares: scored.slice(0, topN).filter(s => PERFECT_SQUARES.has(s.number)).length,
      triangular: scored.slice(0, topN).filter(s => TRIANGULAR.has(s.number)).length,
    },
  };
}

// ═══════════════════════════════════════════
// ESTRATÉGIA 10 — REGRESSÃO À MÉDIA
// Números estatisticamente "devidos"
// ═══════════════════════════════════════════
export function strategyRegression(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  topN: number = 18
): StrategyResult {
  const rules = getLotteryRules(lotteryId);
  const expectedFreq = (draws.length * rules.pick) / rules.totalNumbers;
  const weights = new Map<number, number>();

  const scored = stats.map(s => {
    // How far below expected frequency (positive = underperforming = "due")
    const deficit = expectedFreq - s.frequency;
    const deficitRatio = expectedFreq > 0 ? deficit / expectedFreq : 0;

    // Overdue factor: current gap vs average gap
    const overdueFactor = s.avgGap > 0 ? s.lastSeen / s.avgGap : 0;

    // Combine deficit + overdue with cycle awareness
    const w = Math.max(0.1,
      deficitRatio * 5 +
      (overdueFactor > 1 ? (overdueFactor - 1) * 3 : 0) +
      (s.cycleScore > 1.2 ? s.cycleScore * 1.5 : 0) +
      s.frequency * 0.1 // small base frequency to avoid truly rare numbers
    );
    weights.set(s.number, w);
    return { number: s.number, score: w, deficit, overdueFactor };
  });
  scored.sort((a, b) => b.score - a.score);

  return {
    id: "regression",
    name: "Regressão à Média",
    description: "Explora números sub-representados que estatisticamente devem convergir para a média.",
    candidateNumbers: scored.slice(0, topN).map(s => s.number).sort((a, b) => a - b),
    weights,
    metrics: {
      expectedFreq: Math.round(expectedFreq * 10) / 10,
      maxDeficit: scored[0]?.deficit || 0,
      overdueNumbers: scored.filter(s => s.overdueFactor > 1.3).length,
    },
  };
}

// ═══════════════════════════════════════════
// PIPELINE DE GERAÇÃO INTELIGENTE (6 ETAPAS)
// ═══════════════════════════════════════════
export interface IntelligentPipelineResult {
  strategy: StrategyResult;
  games: number[][];
  scores: number[];
  pipeline: {
    step: string;
    detail: string;
    count: number;
  }[];
}

export function runIntelligentPipeline(
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string,
  strategyId: string,
  gameCount: number = 10
): IntelligentPipelineResult {
  const rules = getLotteryRules(lotteryId);
  const pipeline: { step: string; detail: string; count: number }[] = [];

  // Etapa 1 — Coletar dados históricos
  const recentDraws = draws.slice(0, 50);
  pipeline.push({ step: "Coleta", detail: `${recentDraws.length} concursos recentes`, count: recentDraws.length });

  // Etapa 2 — Calcular métricas
  const avgSum = recentDraws.length > 0
    ? recentDraws.reduce((s, d) => s + d.numbers.reduce((a, b) => a + b, 0), 0) / recentDraws.length
    : 0;
  pipeline.push({ step: "Métricas", detail: `Soma média: ${avgSum.toFixed(0)}`, count: stats.length });

  // Etapa 3 — Gerar números candidatos via estratégia
  const strategy = executeStrategy(strategyId, stats, draws, lotteryId);
  pipeline.push({ step: "Candidatos", detail: `${strategy.candidateNumbers.length} números selecionados`, count: strategy.candidateNumbers.length });

  // Etapa 4 — Criar combinações com filtros
  const rawGames = generateFilteredCombinations(strategy, rules.pick, gameCount * 20, rules);
  pipeline.push({ step: "Combinações", detail: `${rawGames.length} jogos brutos`, count: rawGames.length });

  // Etapa 5 — Ranking por score
  const scored = rawGames.map(game => ({
    game,
    score: computeGameScore(game, stats, rules, avgSum),
  }));
  scored.sort((a, b) => b.score - a.score);
  pipeline.push({ step: "Ranking", detail: `Score máx: ${scored[0]?.score.toFixed(1) || 0}`, count: scored.length });

  // Etapa 6 — Retornar top N jogos diversos
  const selected = selectDiverseGames(scored, gameCount, rules.pick);
  pipeline.push({ step: "Seleção", detail: `${selected.length} jogos finais`, count: selected.length });

  return {
    strategy,
    games: selected.map(s => s.game),
    scores: selected.map(s => s.score),
    pipeline,
  };
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function executeStrategy(
  strategyId: string,
  stats: NumberStats[],
  draws: DrawResult[],
  lotteryId: string
): StrategyResult {
  switch (strategyId) {
    case "frequency": return strategyFrequency(stats, draws);
    case "delay": return strategyDelay(stats, draws);
    case "balance": return strategyBalance(stats, lotteryId);
    case "dispersion": return strategyDispersion(stats, lotteryId);
    case "anti_pattern": return strategyAntiPattern(stats, draws, lotteryId);
    case "coverage": return strategyCoverage(stats, lotteryId);
    case "markov": return strategyMarkov(stats, draws, lotteryId);
    case "momentum": return strategyMomentum(stats, draws);
    case "harmonic": return strategyHarmonic(stats, lotteryId);
    case "regression": return strategyRegression(stats, draws, lotteryId);
    default: return strategyFrequency(stats, draws);
  }
}

function computeRecentFrequency(num: number, draws: DrawResult[], window: number): number {
  const recent = draws.slice(0, window);
  return recent.filter(d => d.numbers.includes(num)).length;
}

function computeSequencePenalty(num: number, draws: DrawResult[], totalNumbers: number): number {
  let seqCount = 0;
  for (const d of draws.slice(0, 50)) {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    const idx = sorted.indexOf(num);
    if (idx === -1) continue;
    if (idx > 0 && sorted[idx] - sorted[idx - 1] === 1) seqCount++;
    if (idx < sorted.length - 1 && sorted[idx + 1] - sorted[idx] === 1) seqCount++;
  }
  return seqCount / 50;
}

function generateFilteredCombinations(
  strategy: StrategyResult,
  pick: number,
  count: number,
  rules: any
): number[][] {
  const pool = strategy.candidateNumbers;
  if (pool.length < pick) return [];

  const games: number[][] = [];
  const seen = new Set<string>();

  for (let attempt = 0; attempt < count * 3 && games.length < count; attempt++) {
    // Weighted sampling
    const game: number[] = [];
    const remaining = [...pool];
    
    for (let i = 0; i < pick && remaining.length > 0; i++) {
      const totalW = remaining.reduce((s, n) => s + (strategy.weights.get(n) || 1), 0);
      let r = Math.random() * totalW;
      let idx = 0;
      for (; idx < remaining.length; idx++) {
        r -= (strategy.weights.get(remaining[idx]) || 1);
        if (r <= 0) break;
      }
      idx = Math.min(idx, remaining.length - 1);
      game.push(remaining[idx]);
      remaining.splice(idx, 1);
    }

    game.sort((a, b) => a - b);
    const key = game.join(",");
    if (seen.has(key)) continue;
    seen.add(key);

    // Quick filters
    const evenCount = game.filter(n => n % 2 === 0).length;
    const evenRatio = evenCount / pick;
    if (evenRatio < 0.25 || evenRatio > 0.75) continue;

    const sum = game.reduce((a, b) => a + b, 0);
    if (rules.idealSumRange) {
      const [lo, hi] = rules.idealSumRange;
      const margin = (hi - lo) * 0.3;
      if (sum < lo - margin || sum > hi + margin) continue;
    }

    // Sequence check
    let maxSeq = 1, curSeq = 1;
    for (let i = 1; i < game.length; i++) {
      if (game[i] - game[i - 1] === 1) { curSeq++; maxSeq = Math.max(maxSeq, curSeq); }
      else curSeq = 1;
    }
    if (maxSeq > (rules.maxRecommendedSequence || 3)) continue;

    games.push(game);
  }

  return games;
}

function computeGameScore(
  game: number[],
  stats: NumberStats[],
  rules: any,
  avgSum: number
): number {
  let score = 0;
  const pick = game.length;

  // Equilíbrio par/ímpar (0-25)
  const evenCount = game.filter(n => n % 2 === 0).length;
  const parityBalance = 1 - Math.abs(evenCount / pick - 0.5) * 2;
  score += parityBalance * 25;

  // Dispersão por faixas (0-25)
  const rangeSize = Math.ceil(rules.totalNumbers / 5);
  const ranges = new Set(game.map(n => Math.floor((n - 1) / rangeSize)));
  score += (ranges.size / 5) * 25;

  // Aderência à soma histórica (0-25)
  const sum = game.reduce((a, b) => a + b, 0);
  if (rules.idealSumRange) {
    const [lo, hi] = rules.idealSumRange;
    const mid = (lo + hi) / 2;
    const range = hi - lo;
    const deviation = Math.abs(sum - mid) / range;
    score += Math.max(0, (1 - deviation)) * 25;
  }

  // Frequência média dos números (0-25)
  const statsMap = new Map(stats.map(s => [s.number, s]));
  const avgFreq = game.reduce((s, n) => s + (statsMap.get(n)?.frequency || 0), 0) / pick;
  const maxFreq = Math.max(...stats.map(s => s.frequency));
  score += (avgFreq / maxFreq) * 25;

  return Math.round(score * 10) / 10;
}

function selectDiverseGames(
  scored: { game: number[]; score: number }[],
  count: number,
  pick: number
): { game: number[]; score: number }[] {
  if (scored.length <= count) return scored;

  const selected = [scored[0]];
  const minDiff = Math.max(2, Math.floor(pick * 0.25));

  for (const item of scored.slice(1)) {
    if (selected.length >= count) break;
    const isDiverse = selected.every(sel => {
      const overlap = item.game.filter(n => sel.game.includes(n)).length;
      return pick - overlap >= minDiff;
    });
    if (isDiverse) selected.push(item);
  }

  // Fill if diversity was too strict
  if (selected.length < count) {
    for (const item of scored) {
      if (selected.length >= count) break;
      if (!selected.find(s => s.game.join(",") === item.game.join(","))) {
        selected.push(item);
      }
    }
  }

  return selected;
}

/** Get all available strategy IDs */
export function getAllStrategyIds(): string[] {
  return ["frequency", "delay", "balance", "dispersion", "anti_pattern", "coverage", "markov", "momentum", "harmonic", "regression"];
}

/** Get strategy info by ID */
export function getStrategyInfo(id: string): { id: string; name: string; description: string } {
  const map: Record<string, { name: string; description: string }> = {
    frequency: { name: "Frequência Histórica", description: "Prioriza números mais sorteados" },
    delay: { name: "Números Atrasados", description: "Foca em números que não saem há tempo" },
    balance: { name: "Equilíbrio Estrutural", description: "Distribui pares/ímpares e altos/baixos" },
    dispersion: { name: "Dispersão", description: "Evita concentração no volante" },
    anti_pattern: { name: "Anti-Padrões", description: "Evita sequências e padrões óbvios" },
    coverage: { name: "Cobertura Máxima", description: "Maximiza cobertura do volante" },
    markov: { name: "Cadeia de Markov", description: "Probabilidades de transição entre sorteios" },
    momentum: { name: "Momentum & Tendência", description: "Números em aceleração de frequência" },
    harmonic: { name: "Harmônico Matemático", description: "Primos, Fibonacci e padrões matemáticos" },
    regression: { name: "Regressão à Média", description: "Números sub-representados estatisticamente" },
  };
  return { id, ...(map[id] || map.frequency) };
}
