import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "./statistics";

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

export interface AutonomousAIReport {
  rankings: AINumberRanking[];
  patterns: PatternInsight[];
  strategies: StrategyPerformance[];
  shifts: StatisticalShift[];
  markovTransitions: MarkovTransition[];
  topCooccurrences: CooccurrencePair[];
  momentumTimeline: MomentumTimeline[];
  parityProfile: { even: number; odd: number; idealEven: number; idealOdd: number };
  sumProfile: { avg: number; stdDev: number; min: number; max: number; recent: number; trend: string };
  consecutiveProfile: { avgConsecutive: number; pctWithConsecutive: number };
  spatialDistribution: { zone: string; expected: number; actual: number; deviation: number }[];
  gapAnalysis: { number: number; currentGap: number; avgGap: number; predictedReturn: number }[];
  lastUpdated: string;
  drawsAnalyzed: number;
  suggestedNumbers: number[];
  avoidNumbers: number[];
  confidenceScore: number;
}

// === MARKOV TRANSITION MATRIX ===
function computeMarkovTransitions(draws: DrawResult[], config: LotteryConfig): MarkovTransition[] {
  const transitions: Record<string, number> = {};
  const fromCounts: Record<number, number> = {};

  for (let i = 0; i < Math.min(draws.length - 1, 100); i++) {
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
    if (prob > 0.15) {
      result.push({ from, to, probability: Math.round(prob * 100) / 100, count });
    }
  }

  return result.sort((a, b) => b.probability - a.probability).slice(0, 50);
}

// === CO-OCCURRENCE MATRIX ===
function computeCooccurrences(draws: DrawResult[], config: LotteryConfig): CooccurrencePair[] {
  const pairCounts: Record<string, number> = {};
  const singleCounts: Record<number, number> = {};
  const total = Math.min(draws.length, 200);

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

  const expectedRate = config.pick / config.numbers;
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

  return pairs.sort((a, b) => b.lift - a.lift).slice(0, 30);
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

    // Acceleration: rate change from 50→10 vs 100→50
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
  markov: MarkovTransition[], cooccurrences: CooccurrencePair[], momentum: MomentumTimeline[]
): AINumberRanking[] {
  if (draws.length === 0) return [];

  const lastDraw = draws[0]?.numbers || [];
  const lastDrawSet = new Set(lastDraw);

  // Markov scores: probability of appearing after last draw's numbers
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
  for (const m of momentum) {
    momentumMap[m.number] = m.acceleration;
  }
  const maxAccel = Math.max(1, ...momentum.map(m => Math.abs(m.acceleration)));

  const zoneSize = Math.ceil(config.numbers / 4);
  const expectedFreq = (config.pick / config.numbers) * 100;

  const rankings: AINumberRanking[] = stats.map(s => {
    const frequencyScore = Math.min(100, (s.percentage / expectedFreq) * 50 + 25);
    const recencyScore = Math.max(0, 100 - s.lastSeen * 3);
    const trendScore = Math.min(100, Math.max(0, 50 + s.trend * 10));
    const cycleScoreVal = Math.min(100, Math.max(0, s.cycleScore * 30));
    const spatialScore = 50 + (s.consecutivePairs > 0 ? 15 : 0);
    const markovScore = Math.min(100, ((markovScores[s.number] || 0) / maxMarkov) * 100);
    const cooccurrenceScore = Math.min(100, ((coocScores[s.number] || 0) / maxCooc) * 80);

    // Momentum bonus/penalty
    const accel = momentumMap[s.number] || 0;
    const momentumBonus = (accel / maxAccel) * 15;

    const compositeScore = Math.round(
      frequencyScore * 0.18 +
      recencyScore * 0.15 +
      trendScore * 0.18 +
      cycleScoreVal * 0.10 +
      spatialScore * 0.07 +
      markovScore * 0.15 +
      cooccurrenceScore * 0.10 +
      momentumBonus * 0.07 +
      50 * 0.07 // baseline
    );

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

      if (Math.abs(change) > 0.06) {
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
  return shifts.slice(0, 20);
}

// === ENHANCED PATTERN DETECTION ===
function detectPatterns(draws: DrawResult[], config: LotteryConfig, stats: NumberStats[], gaps: ReturnType<typeof computeGapAnalysis>): PatternInsight[] {
  const patterns: PatternInsight[] = [];
  if (draws.length < 20) return patterns;

  // Parity pattern
  const parityRatios = draws.slice(0, 50).map(d => d.numbers.filter(n => n % 2 === 0).length / d.numbers.length);
  const avgParity = parityRatios.reduce((a, b) => a + b, 0) / parityRatios.length;
  if (Math.abs(avgParity - 0.5) > 0.06) {
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

  // Sum trend with direction
  const recentSums = draws.slice(0, 20).map(d => d.numbers.reduce((a, b) => a + b, 0));
  const olderSums = draws.slice(20, 60).map(d => d.numbers.reduce((a, b) => a + b, 0));
  if (olderSums.length > 0) {
    const avgRecent = recentSums.reduce((a, b) => a + b, 0) / recentSums.length;
    const avgOlder = olderSums.reduce((a, b) => a + b, 0) / olderSums.length;
    if (Math.abs(avgRecent - avgOlder) > avgOlder * 0.04) {
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

  // Consecutive numbers
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

  // Hot/cold temperature
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

  // Repetition pattern
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

  // Overdue numbers alert
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
      description: `Desequilíbrio detectado em ${imbalancedZones.length} de ${zones} zonas nos últimos 30 concursos`,
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

    // Trend: compare first vs second half
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

  // Strategy 5: Markov-based (NEW)
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

  // Strategy 6: Hybrid AI (NEW) - combine top from multiple criteria
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

  const rankings = computeRankings(stats, draws, config, markovTransitions, topCooccurrences, momentumTimeline);
  const patterns = detectPatterns(draws, config, stats, gapAnalysis);
  const strategies = evaluateStrategies(draws, config, stats, markovTransitions);
  const shifts = detectShifts(stats, draws, config);

  // Parity profile
  const recentDraws = draws.slice(0, 100);
  const evenCounts = recentDraws.map(d => d.numbers.filter(n => n % 2 === 0).length);
  const avgEven = evenCounts.reduce((a, b) => a + b, 0) / (recentDraws.length || 1);
  const idealEven = config.pick / 2;

  // Sum profile with trend
  const sums = recentDraws.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avgSum = sums.reduce((a, b) => a + b, 0) / (sums.length || 1);
  const sumStdDev = Math.sqrt(sums.reduce((a, s) => a + (s - avgSum) ** 2, 0) / (sums.length || 1));
  const sumRecent20 = sums.slice(0, 20).reduce((a, b) => a + b, 0) / Math.min(20, sums.length || 1);
  const sumTrend = sumRecent20 > avgSum + sumStdDev * 0.3 ? "subindo" : sumRecent20 < avgSum - sumStdDev * 0.3 ? "descendo" : "estável";

  // Consecutive profile
  const consecCounts = recentDraws.map(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let pairs = 0;
    for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] === 1) pairs++;
    return pairs;
  });
  const avgConsec = consecCounts.reduce((a, b) => a + b, 0) / (consecCounts.length || 1);

  // Spatial distribution with deviation
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

  // Smart number suggestion using multi-criteria
  const topRanked = rankings.slice(0, Math.ceil(config.pick * 0.5)).map(r => r.number);
  const overdueReady = gapAnalysis.filter(g => g.predictedReturn <= 2 && g.currentGap > g.avgGap * 0.8).slice(0, Math.ceil(config.pick * 0.25)).map(g => g.number);
  const markovPicks = markovTransitions.slice(0, Math.ceil(config.pick * 0.25)).map(t => t.to);

  const candidateSet = new Set([...topRanked, ...overdueReady, ...markovPicks]);
  let suggestedNumbers = [...candidateSet].slice(0, config.pick);
  // Fill remainder from top rankings if needed
  if (suggestedNumbers.length < config.pick) {
    for (const r of rankings) {
      if (suggestedNumbers.length >= config.pick) break;
      if (!suggestedNumbers.includes(r.number)) suggestedNumbers.push(r.number);
    }
  }
  suggestedNumbers = suggestedNumbers.slice(0, config.pick).sort((a, b) => a - b);

  // Avoid numbers
  const avoidNumbers = rankings
    .filter(r => r.trend === "descendo" && r.compositeScore < 35)
    .slice(-7)
    .map(r => r.number)
    .sort((a, b) => a - b);

  // Confidence score based on data quality and consistency
  const dataQuality = Math.min(100, draws.length / 2);
  const strategyConsistency = strategies.length > 0
    ? strategies.reduce((a, s) => a + (s.consistency || 50), 0) / strategies.length
    : 50;
  const confidenceScore = Math.round(dataQuality * 0.4 + strategyConsistency * 0.6);

  return {
    rankings,
    patterns,
    strategies,
    shifts,
    markovTransitions,
    topCooccurrences,
    momentumTimeline,
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
    avoidNumbers,
    confidenceScore,
  };
}
