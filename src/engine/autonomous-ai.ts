import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "./statistics";
import { buildConditionalNetwork, scoreByBayesianNetwork, computeMutualInformation, type ConditionalNode, type BayesianNetworkScore } from "@/ai/engines/bayesianNetworkEngine";
import { computeAntiPopularityPenalty, getAntiPopularityProfile } from "@/ai/knowledge/jackpotMasterStrategies";

export interface AINumberRanking {
  number: number;
  probabilityScore: number;
  frequencyScore: number;
  recencyScore: number;
  trendScore: number;
  cycleScore: number;
  spatialScore: number;
  markovScore: number;
  cooccurrenceScore: number;
  entropyScore: number;
  compositeScore: number;
  rank: number;
  classification: "forte" | "moderado" | "fraco";
  trend: "subindo" | "estável" | "descendo";
  momentum: number;
}

export interface PatternInsight {
  type: string;
  description: string;
  confidence: number;
  impact: "alto" | "médio" | "baixo";
  icon: string;
  actionable?: boolean;
  suggestion?: string;
}

export interface StrategyPerformance {
  name: string;
  winRate: number;
  avgHits: number;
  bestResult: number;
  totalTests: number;
  trend: "melhorando" | "estável" | "piorando";
  consistency?: number;
}

export interface StatisticalShift {
  number: number;
  type: "entrando_tendencia" | "saindo_tendencia" | "mudanca_padrao";
  oldValue: number;
  newValue: number;
  magnitude: number;
  description: string;
  since?: number;
}

export interface MarkovTransition {
  from: number;
  to: number;
  probability: number;
  count: number;
}

export interface CooccurrencePair {
  a: number;
  b: number;
  count: number;
  lift: number;
}

export interface MomentumTimeline {
  number: number;
  windows: { period: string; freq: number; rate: number }[];
  acceleration: number;
}

export interface EntropyAnalysis {
  globalEntropy: number;
  maxEntropy: number;
  normalizedEntropy: number;
  entropyByZone: { zone: string; entropy: number; normalized: number }[];
  numberEntropy: { number: number; entropy: number; isAnomaly: boolean }[];
}

export interface ChiSquareResult {
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  isUniform: boolean;
  significanceLevel: string;
  topDeviations: { number: number; observed: number; expected: number; residual: number }[];
}

export interface TripletPattern {
  numbers: [number, number, number];
  count: number;
  lift: number;
  lastSeen: number;
}

export interface AutonomousAIReport {
  rankings: AINumberRanking[];
  patterns: PatternInsight[];
  strategies: StrategyPerformance[];
  shifts: StatisticalShift[];
  markovTransitions: MarkovTransition[];
  topCooccurrences: CooccurrencePair[];
  momentumTimeline: MomentumTimeline[];
  entropyAnalysis: EntropyAnalysis;
  chiSquareResult: ChiSquareResult;
  topTriplets: TripletPattern[];
  bayesianNodes: ConditionalNode[];
  bayesianGameScores: BayesianNetworkScore[];
  mutualInformation: { a: number; b: number; mi: number }[];
  parityProfile: { even: number; odd: number; idealEven: number; idealOdd: number };
  sumProfile: { avg: number; stdDev: number; min: number; max: number; recent: number; trend: string };
  consecutiveProfile: { avgConsecutive: number; pctWithConsecutive: number };
  spatialDistribution: { zone: string; expected: number; actual: number; deviation: number }[];
  gapAnalysis: { number: number; currentGap: number; avgGap: number; predictedReturn: number }[];
  lastUpdated: string;
  drawsAnalyzed: number;
  suggestedNumbers: number[];
  alternativeGames: number[][];
  avoidNumbers: number[];
  confidenceScore: number;
}

// === MARKOV TRANSITION MATRIX ===
function computeMarkovTransitions(draws: DrawResult[], config: LotteryConfig): MarkovTransition[] {
  const transitions: Record<string, number> = {};
  const fromCounts: Record<number, number> = {};

  for (let i = 0; i < Math.min(draws.length - 1, 150); i++) {
    const curr = draws[i].numbers;
    const next = draws[i + 1].numbers;
    for (const n of curr) {
      fromCounts[n] = (fromCounts[n] || 0) + 1;
      for (const m of next) {
        const key = `${n}-${m}`;
        transitions[key] = (transitions[key] || 0) + 1;
      }
    }
  }

  const result: MarkovTransition[] = [];
  for (const [key, count] of Object.entries(transitions)) {
    const [from, to] = key.split("-").map(Number);
    const prob = count / (fromCounts[from] || 1);
    if (prob > 0.12) {
      result.push({ from, to, probability: Math.round(prob * 100) / 100, count });
    }
  }

  return result.sort((a, b) => b.probability - a.probability).slice(0, 60);
}

// === CO-OCCURRENCE MATRIX ===
function computeCooccurrences(draws: DrawResult[], config: LotteryConfig): CooccurrencePair[] {
  const pairCounts: Record<string, number> = {};
  const singleCounts: Record<number, number> = {};
  const total = Math.min(draws.length, 300);

  for (let i = 0; i < total; i++) {
    const nums = [...draws[i].numbers].sort((a, b) => a - b);
    for (const n of nums) singleCounts[n] = (singleCounts[n] || 0) + 1;
    for (let j = 0; j < nums.length; j++) {
      for (let k = j + 1; k < nums.length; k++) {
        const key = `${nums[j]}-${nums[k]}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  }

  const pairs: CooccurrencePair[] = [];
  for (const [key, count] of Object.entries(pairCounts)) {
    const [a, b] = key.split("-").map(Number);
    const pA = (singleCounts[a] || 0) / total;
    const pB = (singleCounts[b] || 0) / total;
    const pAB = count / total;
    const lift = pAB / (pA * pB || 0.001);
    if (count >= 3) {
      pairs.push({ a, b, count, lift: Math.round(lift * 100) / 100 });
    }
  }

  return pairs.sort((a, b) => b.lift - a.lift).slice(0, 40);
}

// === TRIPLET DETECTION ===
function computeTriplets(draws: DrawResult[], config: LotteryConfig): TripletPattern[] {
  const tripletCounts: Record<string, { count: number; lastSeen: number }> = {};
  const total = Math.min(draws.length, 200);
  const singleCounts: Record<number, number> = {};

  for (let i = 0; i < total; i++) {
    const nums = [...draws[i].numbers].sort((a, b) => a - b);
    for (const n of nums) singleCounts[n] = (singleCounts[n] || 0) + 1;
    for (let a = 0; a < nums.length; a++) {
      for (let b = a + 1; b < nums.length; b++) {
        for (let c = b + 1; c < nums.length; c++) {
          const key = `${nums[a]}-${nums[b]}-${nums[c]}`;
          if (!tripletCounts[key]) tripletCounts[key] = { count: 0, lastSeen: total };
          tripletCounts[key].count++;
          if (i < tripletCounts[key].lastSeen) tripletCounts[key].lastSeen = i;
        }
      }
    }
  }

  const results: TripletPattern[] = [];
  for (const [key, data] of Object.entries(tripletCounts)) {
    if (data.count < 2) continue;
    const [a, b, c] = key.split("-").map(Number);
    const pA = (singleCounts[a] || 0) / total;
    const pB = (singleCounts[b] || 0) / total;
    const pC = (singleCounts[c] || 0) / total;
    const pABC = data.count / total;
    const lift = pABC / (pA * pB * pC || 0.0001);
    results.push({ numbers: [a, b, c], count: data.count, lift: Math.round(lift * 10) / 10, lastSeen: data.lastSeen });
  }

  return results.sort((a, b) => b.lift - a.lift).slice(0, 20);
}

// === ENTROPY ANALYSIS ===
function computeEntropyAnalysis(draws: DrawResult[], config: LotteryConfig): EntropyAnalysis {
  const total = Math.min(draws.length, 200);
  const freqs: Record<number, number> = {};
  let totalNums = 0;

  for (let i = 0; i < total; i++) {
    for (const n of draws[i].numbers) {
      freqs[n] = (freqs[n] || 0) + 1;
      totalNums++;
    }
  }

  // Global Shannon entropy
  let globalEntropy = 0;
  for (let n = 1; n <= config.numbers; n++) {
    const p = (freqs[n] || 0) / totalNums;
    if (p > 0) globalEntropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(config.numbers);
  const normalizedEntropy = globalEntropy / maxEntropy;

  // Entropy by zone
  const zones = 4;
  const zoneSize = Math.ceil(config.numbers / zones);
  const entropyByZone = Array.from({ length: zones }, (_, z) => {
    const start = z * zoneSize + 1;
    const end = Math.min((z + 1) * zoneSize, config.numbers);
    let zoneTotal = 0;
    for (let n = start; n <= end; n++) zoneTotal += freqs[n] || 0;

    let zEntropy = 0;
    const zoneNums = end - start + 1;
    for (let n = start; n <= end; n++) {
      const p = (freqs[n] || 0) / (zoneTotal || 1);
      if (p > 0) zEntropy -= p * Math.log2(p);
    }
    const zMax = Math.log2(zoneNums);
    return {
      zone: `${start}-${end}`,
      entropy: Math.round(zEntropy * 100) / 100,
      normalized: Math.round((zEntropy / (zMax || 1)) * 100) / 100,
    };
  });

  // Per-number entropy (sliding window diversity)
  const windowSize = 20;
  const numberEntropy: { number: number; entropy: number; isAnomaly: boolean }[] = [];
  for (let n = 1; n <= config.numbers; n++) {
    const appearances: number[] = [];
    for (let w = 0; w < Math.min(5, Math.floor(total / windowSize)); w++) {
      const slice = draws.slice(w * windowSize, (w + 1) * windowSize);
      appearances.push(slice.filter(d => d.numbers.includes(n)).length);
    }
    const mean = appearances.reduce((a, b) => a + b, 0) / (appearances.length || 1);
    const variance = appearances.reduce((a, v) => a + (v - mean) ** 2, 0) / (appearances.length || 1);
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    numberEntropy.push({ number: n, entropy: Math.round(cv * 100) / 100, isAnomaly: cv > 0.8 });
  }

  return {
    globalEntropy: Math.round(globalEntropy * 1000) / 1000,
    maxEntropy: Math.round(maxEntropy * 1000) / 1000,
    normalizedEntropy: Math.round(normalizedEntropy * 1000) / 1000,
    entropyByZone,
    numberEntropy: numberEntropy.sort((a, b) => b.entropy - a.entropy),
  };
}

// === CHI-SQUARE GOODNESS-OF-FIT ===
function computeChiSquare(draws: DrawResult[], config: LotteryConfig): ChiSquareResult {
  const total = Math.min(draws.length, 300);
  const observed: Record<number, number> = {};
  for (let i = 0; i < total; i++) {
    for (const n of draws[i].numbers) {
      observed[n] = (observed[n] || 0) + 1;
    }
  }

  const expected = (total * config.pick) / config.numbers;
  let chiSquare = 0;
  const deviations: { number: number; observed: number; expected: number; residual: number }[] = [];

  for (let n = 1; n <= config.numbers; n++) {
    const obs = observed[n] || 0;
    const residual = (obs - expected) / Math.sqrt(expected);
    chiSquare += ((obs - expected) ** 2) / expected;
    deviations.push({ number: n, observed: obs, expected: Math.round(expected * 10) / 10, residual: Math.round(residual * 100) / 100 });
  }

  const df = config.numbers - 1;
  // Approximate p-value using Wilson-Hilferty approximation
  const z = Math.pow(chiSquare / df, 1 / 3) - (1 - 2 / (9 * df));
  const pApprox = z > 0 ? Math.max(0.001, 1 - 0.5 * (1 + erf(z / Math.SQRT2))) : 0.999;

  const significance = pApprox < 0.01 ? "Altamente significativo (p<0.01)" :
    pApprox < 0.05 ? "Significativo (p<0.05)" :
    pApprox < 0.10 ? "Marginalmente significativo (p<0.10)" : "Não significativo (p≥0.10)";

  return {
    chiSquare: Math.round(chiSquare * 100) / 100,
    degreesOfFreedom: df,
    pValue: Math.round(pApprox * 1000) / 1000,
    isUniform: pApprox >= 0.05,
    significanceLevel: significance,
    topDeviations: deviations.sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual)).slice(0, 15),
  };
}

// Error function approximation for p-value
function erf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// === MOMENTUM TIMELINE ===
function computeMomentumTimeline(draws: DrawResult[], config: LotteryConfig): MomentumTimeline[] {
  const windows = [
    { period: "5", size: 5 },
    { period: "10", size: 10 },
    { period: "20", size: 20 },
    { period: "50", size: 50 },
    { period: "100", size: 100 },
  ];

  const allNums = Array.from({ length: config.numbers }, (_, i) => i + 1);
  const timelines: MomentumTimeline[] = [];

  for (const num of allNums) {
    const wData = windows.map(w => {
      const slice = draws.slice(0, Math.min(w.size, draws.length));
      const freq = slice.filter(d => d.numbers.includes(num)).length;
      return { period: `Últ.${w.period}`, freq, rate: Math.round((freq / (slice.length || 1)) * 1000) / 10 };
    });

    const rate10 = wData.find(w => w.period === "Últ.10")?.rate || 0;
    const rate50 = wData.find(w => w.period === "Últ.50")?.rate || 0;
    const rate100 = wData.find(w => w.period === "Últ.100")?.rate || 0;

    const recentAccel = rate10 - rate50;
    const longAccel = rate50 - rate100;
    const acceleration = Math.round((recentAccel - longAccel) * 10) / 10;

    timelines.push({ number: num, windows: wData, acceleration });
  }

  return timelines.sort((a, b) => Math.abs(b.acceleration) - Math.abs(a.acceleration));
}

// === GAP ANALYSIS ===
function computeGapAnalysis(draws: DrawResult[], config: LotteryConfig) {
  const allNums = Array.from({ length: config.numbers }, (_, i) => i + 1);
  const results: { number: number; currentGap: number; avgGap: number; predictedReturn: number }[] = [];

  for (const num of allNums) {
    let currentGap = -1;
    const gaps: number[] = [];
    let lastIdx = -1;

    for (let i = 0; i < draws.length; i++) {
      if (draws[i].numbers.includes(num)) {
        if (currentGap === -1) currentGap = i;
        if (lastIdx >= 0) gaps.push(i - lastIdx);
        lastIdx = i;
      }
    }

    if (currentGap === -1) currentGap = draws.length;
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : draws.length;
    const predictedReturn = Math.max(0, Math.round(avgGap - currentGap));

    results.push({ number: num, currentGap, avgGap: Math.round(avgGap * 10) / 10, predictedReturn });
  }

  return results.sort((a, b) => a.predictedReturn - b.predictedReturn);
}

// === ENHANCED COMPOSITE RANKINGS ===
function computeRankings(
  stats: NumberStats[], draws: DrawResult[], config: LotteryConfig,
  markov: MarkovTransition[], cooccurrences: CooccurrencePair[], momentum: MomentumTimeline[],
  entropy: EntropyAnalysis
): AINumberRanking[] {
  if (draws.length === 0) return [];

  const lastDraw = draws[0]?.numbers || [];
  const lastDrawSet = new Set(lastDraw);

  // Markov scores
  const markovScores: Record<number, number> = {};
  for (const t of markov) {
    if (lastDrawSet.has(t.from)) {
      markovScores[t.to] = (markovScores[t.to] || 0) + t.probability;
    }
  }
  const maxMarkov = Math.max(1, ...Object.values(markovScores));

  // Co-occurrence scores
  const coocScores: Record<number, number> = {};
  for (const p of cooccurrences) {
    coocScores[p.a] = (coocScores[p.a] || 0) + p.lift;
    coocScores[p.b] = (coocScores[p.b] || 0) + p.lift;
  }
  const maxCooc = Math.max(1, ...Object.values(coocScores));

  // Momentum map
  const momentumMap: Record<number, number> = {};
  for (const m of momentum) momentumMap[m.number] = m.acceleration;
  const maxAccel = Math.max(1, ...momentum.map(m => Math.abs(m.acceleration)));

  // Entropy anomaly map (anomalous = unstable = potentially exploitable)
  const entropyMap: Record<number, number> = {};
  for (const e of entropy.numberEntropy) {
    entropyMap[e.number] = e.isAnomaly ? 0.3 : (1 - e.entropy) * 0.8; // stable numbers score higher
  }

  const expectedFreq = (config.pick / config.numbers) * 100;

  const rankings: AINumberRanking[] = stats.map(s => {
    const frequencyScore = Math.min(100, (s.percentage / expectedFreq) * 50 + 25);
    const recencyScore = Math.max(0, 100 - s.lastSeen * 3);
    const trendScore = Math.min(100, Math.max(0, 50 + s.trend * 10));
    const cycleScoreVal = Math.min(100, Math.max(0, s.cycleScore * 30));
    const spatialScore = 50 + (s.consecutivePairs > 0 ? 15 : 0);
    const markovScore = Math.min(100, ((markovScores[s.number] || 0) / maxMarkov) * 100);
    const cooccurrenceScore = Math.min(100, ((coocScores[s.number] || 0) / maxCooc) * 80);
    const entropyScore = Math.min(100, (entropyMap[s.number] || 0.5) * 100);

    const accel = momentumMap[s.number] || 0;
    const momentumBonus = (accel / maxAccel) * 15;

    const rawComposite = Math.round(
      frequencyScore * 0.15 +
      recencyScore * 0.12 +
      trendScore * 0.15 +
      cycleScoreVal * 0.08 +
      spatialScore * 0.05 +
      markovScore * 0.18 +
      cooccurrenceScore * 0.10 +
      entropyScore * 0.07 +
      momentumBonus * 0.05 +
      50 * 0.05
    );

    // Aplica anti-popularidade individual (datas/múltiplos de 5 conforme nível)
    const antiPopMult = computeAntiPopularityPenalty([s.number], config.id);
    const compositeScore = Math.round(rawComposite * antiPopMult);

    const classification = compositeScore >= 65 ? "forte" : compositeScore >= 40 ? "moderado" : "fraco";
    const trend = s.momentum > 0.5 ? "subindo" : s.momentum < -0.5 ? "descendo" : "estável";

    return {
      number: s.number,
      probabilityScore: compositeScore,
      frequencyScore: Math.round(frequencyScore),
      recencyScore: Math.round(recencyScore),
      trendScore: Math.round(trendScore),
      cycleScore: Math.round(cycleScoreVal),
      spatialScore: Math.round(spatialScore),
      markovScore: Math.round(markovScore),
      cooccurrenceScore: Math.round(cooccurrenceScore),
      entropyScore: Math.round(entropyScore),
      compositeScore,
      rank: 0,
      classification,
      trend,
      momentum: accel,
    };
  });

  rankings.sort((a, b) => b.compositeScore - a.compositeScore);
  rankings.forEach((r, i) => r.rank = i + 1);
  return rankings;
}

// === ENHANCED SHIFT DETECTION ===
function detectShifts(stats: NumberStats[], draws: DrawResult[], config: LotteryConfig): StatisticalShift[] {
  const shifts: StatisticalShift[] = [];
  const windows = [
    { label: "10vs30", recent: 10, older: 30 },
    { label: "20vs60", recent: 20, older: 60 },
    { label: "30vs90", recent: 30, older: 90 },
  ];

  for (const w of windows) {
    const recent = draws.slice(0, w.recent);
    const older = draws.slice(w.recent, w.older);
    if (older.length < 10) continue;

    for (const s of stats) {
      const recentCount = recent.filter(d => d.numbers.includes(s.number)).length;
      const olderCount = older.filter(d => d.numbers.includes(s.number)).length;
      const recentRate = recentCount / recent.length;
      const olderRate = olderCount / older.length;
      const change = recentRate - olderRate;

      if (Math.abs(change) > 0.05) {
        const existing = shifts.find(sh => sh.number === s.number);
        if (!existing || Math.abs(change) > existing.magnitude / 100) {
          if (existing) shifts.splice(shifts.indexOf(existing), 1);
          shifts.push({
            number: s.number,
            type: change > 0 ? "entrando_tendencia" : "saindo_tendencia",
            oldValue: Math.round(olderRate * 100),
            newValue: Math.round(recentRate * 100),
            magnitude: Math.round(Math.abs(change) * 100),
            description: change > 0
              ? `Dezena ${String(s.number).padStart(2, "0")} acelerando: ${Math.round(olderRate * 100)}% → ${Math.round(recentRate * 100)}% (${w.label})`
              : `Dezena ${String(s.number).padStart(2, "0")} desacelerando: ${Math.round(olderRate * 100)}% → ${Math.round(recentRate * 100)}% (${w.label})`,
            since: w.recent,
          });
        }
      }
    }
  }

  shifts.sort((a, b) => b.magnitude - a.magnitude);
  return shifts.slice(0, 25);
}

// === ENHANCED PATTERN DETECTION ===
function detectPatterns(
  draws: DrawResult[], config: LotteryConfig, stats: NumberStats[],
  gaps: ReturnType<typeof computeGapAnalysis>,
  entropy: EntropyAnalysis, chiSquare: ChiSquareResult, triplets: TripletPattern[]
): PatternInsight[] {
  const patterns: PatternInsight[] = [];
  if (draws.length < 20) return patterns;

  // Parity pattern
  const parityRatios = draws.slice(0, 50).map(d => d.numbers.filter(n => n % 2 === 0).length / d.numbers.length);
  const avgParity = parityRatios.reduce((a, b) => a + b, 0) / parityRatios.length;
  if (Math.abs(avgParity - 0.5) > 0.04) {
    patterns.push({
      type: "paridade",
      description: avgParity > 0.5
        ? `Viés para pares: ${Math.round(avgParity * 100)}% nos últimos 50 concursos`
        : `Viés para ímpares: ${Math.round((1 - avgParity) * 100)}% nos últimos 50 concursos`,
      confidence: Math.min(95, 60 + Math.abs(avgParity - 0.5) * 200),
      impact: "médio",
      icon: "⚖️",
      actionable: true,
      suggestion: avgParity > 0.5 ? "Inclua mais números pares nas apostas" : "Inclua mais números ímpares",
    });
  }

  // Sum trend
  const recentSums = draws.slice(0, 20).map(d => d.numbers.reduce((a, b) => a + b, 0));
  const olderSums = draws.slice(20, 60).map(d => d.numbers.reduce((a, b) => a + b, 0));
  if (olderSums.length > 0) {
    const avgRecent = recentSums.reduce((a, b) => a + b, 0) / recentSums.length;
    const avgOlder = olderSums.reduce((a, b) => a + b, 0) / olderSums.length;
    if (Math.abs(avgRecent - avgOlder) > avgOlder * 0.03) {
      patterns.push({
        type: "soma",
        description: avgRecent > avgOlder
          ? `Soma média subindo: ${Math.round(avgRecent)} (era ${Math.round(avgOlder)}), Δ${Math.round(avgRecent - avgOlder)}`
          : `Soma média descendo: ${Math.round(avgRecent)} (era ${Math.round(avgOlder)}), Δ${Math.round(avgRecent - avgOlder)}`,
        confidence: 70,
        impact: "médio",
        icon: "📊",
        actionable: true,
        suggestion: `Alvo de soma: ${Math.round(avgRecent)} ± ${Math.round(Math.abs(avgRecent - avgOlder))}`,
      });
    }
  }

  // Consecutive
  const consecRate = draws.slice(0, 50).map(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let pairs = 0;
    for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] === 1) pairs++;
    return pairs;
  });
  const avgConsec = consecRate.reduce((a, b) => a + b, 0) / consecRate.length;
  patterns.push({
    type: "consecutivos",
    description: `Média de ${avgConsec.toFixed(1)} pares consecutivos por sorteio`,
    confidence: 85,
    impact: avgConsec > 2 ? "alto" : "baixo",
    icon: "🔗",
  });

  // Temperature
  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  patterns.push({
    type: "temperatura",
    description: `${hotNumbers} quentes, ${coldNumbers} frias — ${hotNumbers > coldNumbers ? "mercado aquecido" : "mercado esfriando"}`,
    confidence: 80,
    impact: "alto",
    icon: "🌡️",
    actionable: true,
    suggestion: hotNumbers > coldNumbers ? "Priorizar dezenas quentes" : "Considerar dezenas frias prestes a retornar",
  });

  // Repetition
  if (draws.length >= 2) {
    const repRates: number[] = [];
    for (let i = 0; i < Math.min(50, draws.length - 1); i++) {
      const current = new Set(draws[i].numbers);
      repRates.push(draws[i + 1].numbers.filter(n => current.has(n)).length);
    }
    const avgRep = repRates.reduce((a, b) => a + b, 0) / repRates.length;
    patterns.push({
      type: "repetição",
      description: `Média de ${avgRep.toFixed(1)} dezenas repetidas entre concursos. Último: ${repRates[0]} repetições`,
      confidence: 90,
      impact: "alto",
      icon: "🔄",
      actionable: true,
      suggestion: `Considere manter ${Math.round(avgRep)} dezenas do último concurso`,
    });
  }

  // Overdue
  const overdueNums = gaps.filter(g => g.currentGap > g.avgGap * 1.5);
  if (overdueNums.length > 0) {
    patterns.push({
      type: "atraso crítico",
      description: `${overdueNums.length} dezenas com atraso > 1.5x da média: ${overdueNums.slice(0, 5).map(g => String(g.number).padStart(2, "0")).join(", ")}`,
      confidence: 75,
      impact: "alto",
      icon: "⏰",
      actionable: true,
      suggestion: `Dezenas com alto potencial de retorno: ${overdueNums.slice(0, 3).map(g => String(g.number).padStart(2, "0")).join(", ")}`,
    });
  }

  // Entropy insight
  patterns.push({
    type: "entropia",
    description: `Entropia normalizada: ${entropy.normalizedEntropy.toFixed(3)} (${entropy.normalizedEntropy > 0.95 ? "quase uniforme" : entropy.normalizedEntropy > 0.85 ? "levemente enviesada" : "significativamente enviesada"})`,
    confidence: 88,
    impact: entropy.normalizedEntropy < 0.9 ? "alto" : "baixo",
    icon: "🎲",
    actionable: entropy.normalizedEntropy < 0.9,
    suggestion: entropy.normalizedEntropy < 0.9 ? "Explorar o viés: dezenas com frequência acima da média são favorecidas" : undefined,
  });

  // Chi-square insight
  patterns.push({
    type: "teste χ²",
    description: `χ²=${chiSquare.chiSquare.toFixed(1)}, p=${chiSquare.pValue.toFixed(3)} — ${chiSquare.significanceLevel}`,
    confidence: 92,
    impact: !chiSquare.isUniform ? "alto" : "baixo",
    icon: "📐",
    actionable: !chiSquare.isUniform,
    suggestion: !chiSquare.isUniform
      ? `Distribuição NÃO uniforme detectada. Top desvios: ${chiSquare.topDeviations.slice(0, 3).map(d => `${String(d.number).padStart(2, "0")}(${d.residual > 0 ? "+" : ""}${d.residual})`).join(", ")}`
      : undefined,
  });

  // Triplet insight
  if (triplets.length > 0) {
    const top3 = triplets.slice(0, 3);
    patterns.push({
      type: "trios recorrentes",
      description: `${triplets.length} trios significativos. Top: ${top3.map(t => `(${t.numbers.map(n => String(n).padStart(2, "0")).join(",")}) ${t.count}x`).join(" | ")}`,
      confidence: 72,
      impact: "médio",
      icon: "🔺",
      actionable: true,
      suggestion: `Considere incluir o trio (${top3[0].numbers.map(n => String(n).padStart(2, "0")).join(",")}) com lift=${top3[0].lift}`,
    });
  }

  // Zone imbalance
  const zones = 4;
  const zoneSize = Math.ceil(config.numbers / zones);
  const zoneCounts = Array(zones).fill(0);
  draws.slice(0, 30).forEach(d => d.numbers.forEach(n => {
    zoneCounts[Math.min(zones - 1, Math.floor((n - 1) / zoneSize))]++;
  }));
  const avgZone = zoneCounts.reduce((a, b) => a + b, 0) / zones;
  const imbalancedZones = zoneCounts.filter(c => Math.abs(c - avgZone) > avgZone * 0.2);
  if (imbalancedZones.length > 0) {
    patterns.push({
      type: "distribuição espacial",
      description: `Desequilíbrio em ${imbalancedZones.length}/${zones} zonas nos últimos 30 concursos`,
      confidence: 70,
      impact: "médio",
      icon: "🗺️",
      actionable: true,
      suggestion: "Distribua dezenas entre as faixas para maior cobertura",
    });
  }

  return patterns;
}

// === ENHANCED STRATEGY EVALUATION ===
function evaluateStrategies(draws: DrawResult[], config: LotteryConfig, stats: NumberStats[], markov: MarkovTransition[]): StrategyPerformance[] {
  const strategies: StrategyPerformance[] = [];
  const testDraws = draws.slice(0, 50);
  const historyDraws = draws.slice(50);
  if (historyDraws.length < 20) return strategies;

  const evaluate = (name: string, nums: number[]): StrategyPerformance => {
    const results = testDraws.map(d => {
      const set = new Set(d.numbers);
      return nums.filter(n => set.has(n)).length;
    });
    const avgHits = results.reduce((a, b) => a + b, 0) / results.length;
    const stdDev = Math.sqrt(results.reduce((a, r) => a + (r - avgHits) ** 2, 0) / results.length);
    const consistency = Math.max(0, 100 - (stdDev / (avgHits || 1)) * 100);
    const h1 = results.slice(0, 25);
    const h2 = results.slice(25);
    const avg1 = h1.reduce((a, b) => a + b, 0) / (h1.length || 1);
    const avg2 = h2.reduce((a, b) => a + b, 0) / (h2.length || 1);
    const trend = avg1 - avg2 > 0.3 ? "melhorando" as const : avg2 - avg1 > 0.3 ? "piorando" as const : "estável" as const;

    return {
      name,
      winRate: results.filter(r => r >= Math.ceil(config.pick * 0.6)).length / testDraws.length * 100,
      avgHits,
      bestResult: Math.max(...results),
      totalTests: testDraws.length,
      trend,
      consistency: Math.round(consistency),
    };
  };

  // Strategy 1: Hot numbers
  const hotNums = stats.filter(s => s.status === "hot").sort((a, b) => b.frequency - a.frequency).slice(0, config.pick).map(s => s.number);
  strategies.push(evaluate("Dezenas Quentes", hotNums));

  // Strategy 2: Balanced hot + cold
  const coldNums = stats.filter(s => s.status === "cold").sort((a, b) => b.cycleScore - a.cycleScore).slice(0, Math.floor(config.pick / 3)).map(s => s.number);
  const balancedNums = [...hotNums.slice(0, config.pick - coldNums.length), ...coldNums].slice(0, config.pick);
  strategies.push(evaluate("Equilibrada (Quentes + Frias)", balancedNums));

  // Strategy 3: Trend-based
  const trendNums = [...stats].sort((a, b) => b.trend - a.trend).slice(0, config.pick).map(s => s.number);
  strategies.push(evaluate("Tendência Recente", trendNums));

  // Strategy 4: Cycle-based
  const cycleNums = [...stats].sort((a, b) => b.cycleScore - a.cycleScore).slice(0, config.pick).map(s => s.number);
  strategies.push(evaluate("Ciclo Estatístico", cycleNums));

  // Strategy 5: Markov-based
  const lastDraw = draws[0]?.numbers || [];
  const markovScores: Record<number, number> = {};
  for (const t of markov) {
    if (lastDraw.includes(t.from)) {
      markovScores[t.to] = (markovScores[t.to] || 0) + t.probability;
    }
  }
  const markovNums = Object.entries(markovScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, config.pick)
    .map(([n]) => Number(n));
  if (markovNums.length === config.pick) {
    strategies.push(evaluate("Markov (Transição)", markovNums));
  }

  // Strategy 6: Hybrid AI
  const scoreMap: Record<number, number> = {};
  for (const s of stats) {
    scoreMap[s.number] = 0;
    if (s.status === "hot") scoreMap[s.number] += 3;
    if (s.trend > 0) scoreMap[s.number] += 2;
    if (s.cycleScore > 1) scoreMap[s.number] += 2;
    scoreMap[s.number] += (markovScores[s.number] || 0) * 5;
  }
  const hybridNums = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]).slice(0, config.pick).map(([n]) => Number(n));
  strategies.push(evaluate("Híbrida IA (Multi-critério)", hybridNums));

  // Strategy 7: Entropy-weighted (NEW)
  const entropyNums = [...stats].sort((a, b) => {
    const aScore = a.frequency * (a.trend > 0 ? 1.3 : 1) * (a.cycleScore > 1 ? 1.2 : 1);
    const bScore = b.frequency * (b.trend > 0 ? 1.3 : 1) * (b.cycleScore > 1 ? 1.2 : 1);
    return bScore - aScore;
  }).slice(0, config.pick).map(s => s.number);
  strategies.push(evaluate("Ponderada por Entropia", entropyNums));

  strategies.sort((a, b) => b.avgHits - a.avgHits);
  return strategies;
}

// === MAIN FUNCTION ===
export function runAutonomousAnalysis(
  draws: DrawResult[],
  stats: NumberStats[],
  config: LotteryConfig
): AutonomousAIReport {
  const markovTransitions = computeMarkovTransitions(draws, config);
  const topCooccurrences = computeCooccurrences(draws, config);
  const momentumTimeline = computeMomentumTimeline(draws, config);
  const gapAnalysis = computeGapAnalysis(draws, config);
  const entropyAnalysis = computeEntropyAnalysis(draws, config);
  const chiSquareResult = computeChiSquare(draws, config);
  const topTriplets = computeTriplets(draws, config);

  // Bayesian network analysis
  const bayesianNodes = buildConditionalNetwork(draws, config.id, 150);
  const miMap = computeMutualInformation(draws, config.id, 100);
  const mutualInformation = [...miMap.entries()]
    .map(([num, mi]) => ({ a: num, b: num, mi }))
    .sort((a, b) => b.mi - a.mi)
    .slice(0, 30);

  const rankings = computeRankings(stats, draws, config, markovTransitions, topCooccurrences, momentumTimeline, entropyAnalysis);
  const patterns = detectPatterns(draws, config, stats, gapAnalysis, entropyAnalysis, chiSquareResult, topTriplets);
  const strategies = evaluateStrategies(draws, config, stats, markovTransitions);
  const shifts = detectShifts(stats, draws, config);

  // Parity profile
  const recentDraws = draws.slice(0, 100);
  const evenCounts = recentDraws.map(d => d.numbers.filter(n => n % 2 === 0).length);
  const avgEven = evenCounts.reduce((a, b) => a + b, 0) / (recentDraws.length || 1);
  const idealEven = config.pick / 2;

  // Sum profile
  const sums = recentDraws.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avgSum = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
  const sumStdDev = Math.sqrt(sums.reduce((a, s) => a + (s - avgSum) ** 2, 0) / (sums.length || 1));
  const sumRecent20 = sums.slice(0, 20).reduce((a, b) => a + b, 0) / Math.min(20, sums.length || 1);
  const sumTrend = sumRecent20 > avgSum + sumStdDev * 0.3 ? "subindo" : sumRecent20 < avgSum - sumStdDev * 0.3 ? "descendo" : "estável";

  // Consecutive
  const consecCounts = recentDraws.map(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let pairs = 0;
    for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] === 1) pairs++;
    return pairs;
  });
  const avgConsec = consecCounts.reduce((a, b) => a + b, 0) / (consecCounts.length || 1);

  // Spatial distribution
  const zones = 4;
  const zoneSize = Math.ceil(config.numbers / zones);
  const zoneCounts = Array(zones).fill(0);
  const expectedPerZone = (recentDraws.length * config.pick) / zones;
  recentDraws.forEach(d => d.numbers.forEach(n => {
    zoneCounts[Math.min(zones - 1, Math.floor((n - 1) / zoneSize))]++;
  }));

  const spatialDistribution = zoneCounts.map((count, i) => ({
    zone: `${i * zoneSize + 1}-${Math.min((i + 1) * zoneSize, config.numbers)}`,
    expected: Math.round(expectedPerZone),
    actual: count,
    deviation: Math.round(((count - expectedPerZone) / expectedPerZone) * 100),
  }));

  // Smart number suggestion — multi-criteria with Bayesian boost
  const topRanked = rankings.slice(0, Math.ceil(config.pick * 0.4)).map(r => r.number);
  const overdueReady = gapAnalysis.filter(g => g.predictedReturn <= 2 && g.currentGap > g.avgGap * 0.8).slice(0, Math.ceil(config.pick * 0.2)).map(g => g.number);
  const markovPicks = markovTransitions.slice(0, Math.ceil(config.pick * 0.2)).map(t => t.to);
  const tripletPicks = topTriplets.length > 0 ? topTriplets[0].numbers : [];
  
  // Bayesian high-posterior picks
  const bayesPicks = bayesianNodes
    .filter(n => n.posterior > 0.6)
    .sort((a, b) => b.posterior - a.posterior)
    .slice(0, Math.ceil(config.pick * 0.15))
    .map(n => n.number);

  const candidateSet = new Set([...topRanked, ...overdueReady, ...markovPicks, ...tripletPicks, ...bayesPicks]);
  let suggestedNumbers = [...candidateSet].slice(0, config.pick);
  if (suggestedNumbers.length < config.pick) {
    for (const r of rankings) {
      if (suggestedNumbers.length >= config.pick) break;
      if (!suggestedNumbers.includes(r.number)) suggestedNumbers.push(r.number);
    }
  }
  suggestedNumbers = suggestedNumbers.slice(0, config.pick).sort((a, b) => a - b);

  // Generate 5 alternative games with diverse strategies
  const alternativeGames: number[][] = [];
  const seenKeys = new Set<string>();
  seenKeys.add(suggestedNumbers.join(','));
  
  // Strategy pools for alternatives
  const pools = [
    rankings.filter(r => r.trend === "subindo").map(r => r.number), // momentum
    gapAnalysis.filter(g => g.predictedReturn <= 2).map(g => g.number), // overdue
    bayesianNodes.sort((a, b) => b.posterior - a.posterior).map(n => n.number), // bayesian
    markovTransitions.slice(0, 20).map(t => t.to), // markov
    rankings.slice().reverse().slice(0, Math.ceil(config.numbers * 0.6)).map(r => r.number), // contrarian
  ];
  
  for (const pool of pools) {
    if (alternativeGames.length >= 5) break;
    const candidates = pool.length >= config.pick ? pool.slice(0, config.pick) : [...pool];
    // Fill from rankings
    for (const r of rankings) {
      if (candidates.length >= config.pick) break;
      if (!candidates.includes(r.number)) candidates.push(r.number);
    }
    const game = candidates.slice(0, config.pick).sort((a, b) => a - b);
    const key = game.join(',');
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      alternativeGames.push(game);
    }
  }

  // Bayesian game scores
  const bayesianGameScores = [suggestedNumbers, ...alternativeGames].map(game => 
    scoreByBayesianNetwork(game, bayesianNodes)
  );

  // Avoid numbers
  const avoidNumbers = rankings
    .filter(r => r.trend === "descendo" && r.compositeScore < 35)
    .slice(-7)
    .map(r => r.number)
    .sort((a, b) => a - b);

  // Confidence score
  const dataQuality = Math.min(100, draws.length / 2);
  const strategyConsistency = strategies.length > 0
    ? strategies.reduce((a, s) => a + (s.consistency || 50), 0) / strategies.length
    : 50;
  const entropyBonus = entropyAnalysis.normalizedEntropy < 0.95 ? 10 : 0;
  const bayesianBonus = bayesianNodes.length > 0 ? 5 : 0;
  const confidenceScore = Math.round(dataQuality * 0.30 + strategyConsistency * 0.45 + entropyBonus + bayesianBonus + (chiSquareResult.isUniform ? 0 : 5));

  return {
    rankings,
    patterns,
    strategies,
    shifts,
    markovTransitions,
    topCooccurrences,
    momentumTimeline,
    entropyAnalysis,
    chiSquareResult,
    topTriplets,
    bayesianNodes,
    bayesianGameScores,
    mutualInformation,
    parityProfile: {
      even: Math.round(avgEven * 10) / 10,
      odd: Math.round((config.pick - avgEven) * 10) / 10,
      idealEven: Math.round(idealEven * 10) / 10,
      idealOdd: Math.round((config.pick - idealEven) * 10) / 10,
    },
    sumProfile: {
      avg: Math.round(avgSum),
      stdDev: Math.round(sumStdDev),
      min: sums.length ? Math.min(...sums) : 0,
      max: sums.length ? Math.max(...sums) : 0,
      recent: sums[0] || 0,
      trend: sumTrend,
    },
    consecutiveProfile: { avgConsecutive: Math.round(avgConsec * 10) / 10, pctWithConsecutive: Math.round(consecCounts.filter(c => c > 0).length / (consecCounts.length || 1) * 100) },
    spatialDistribution,
    gapAnalysis,
    lastUpdated: new Date().toISOString(),
    drawsAnalyzed: draws.length,
    suggestedNumbers,
    alternativeGames,
    avoidNumbers,
    confidenceScore,
  };
}
