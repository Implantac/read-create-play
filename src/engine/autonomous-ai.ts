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
  compositeScore: number;
  rank: number;
  classification: "forte" | "moderado" | "fraco";
  trend: "subindo" | "estável" | "descendo";
}

export interface PatternInsight {
  type: string;
  description: string;
  confidence: number;
  impact: "alto" | "médio" | "baixo";
  icon: string;
}

export interface StrategyPerformance {
  name: string;
  winRate: number;
  avgHits: number;
  bestResult: number;
  totalTests: number;
  trend: "melhorando" | "estável" | "piorando";
}

export interface StatisticalShift {
  number: number;
  type: "entrando_tendencia" | "saindo_tendencia" | "mudanca_padrao";
  oldValue: number;
  newValue: number;
  magnitude: number;
  description: string;
}

export interface AutonomousAIReport {
  rankings: AINumberRanking[];
  patterns: PatternInsight[];
  strategies: StrategyPerformance[];
  shifts: StatisticalShift[];
  parityProfile: { even: number; odd: number; idealEven: number; idealOdd: number };
  sumProfile: { avg: number; stdDev: number; min: number; max: number; recent: number };
  consecutiveProfile: { avgConsecutive: number; pctWithConsecutive: number };
  spatialDistribution: { zone: string; expected: number; actual: number }[];
  lastUpdated: string;
  drawsAnalyzed: number;
  suggestedNumbers: number[];
  avoidNumbers: number[];
}

// Compute composite AI ranking for all numbers
function computeRankings(stats: NumberStats[], draws: DrawResult[], config: LotteryConfig): AINumberRanking[] {
  const totalDraws = draws.length;
  if (totalDraws === 0) return [];

  // Spatial distribution zones
  const zoneSize = Math.ceil(config.numbers / 4);

  const rankings: AINumberRanking[] = stats.map(s => {
    // Frequency score (0-100)
    const expectedFreq = (config.pick / config.numbers) * 100;
    const frequencyScore = Math.min(100, (s.percentage / expectedFreq) * 50 + 25);

    // Recency score (0-100) - higher if recently appeared
    const recencyScore = Math.max(0, 100 - s.lastSeen * 3);

    // Trend score (0-100) 
    const trendScore = Math.min(100, Math.max(0, 50 + s.trend * 10));

    // Cycle score (0-100) - higher if "due"
    const cycleScoreVal = Math.min(100, Math.max(0, s.cycleScore * 30));

    // Spatial score - diversity bonus
    const zone = Math.floor((s.number - 1) / zoneSize);
    const spatialScore = 50 + (s.consecutivePairs > 0 ? 15 : 0);

    // Composite
    const compositeScore = Math.round(
      frequencyScore * 0.25 +
      recencyScore * 0.20 +
      trendScore * 0.25 +
      cycleScoreVal * 0.15 +
      spatialScore * 0.15
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
      compositeScore,
      rank: 0,
      classification,
      trend,
    };
  });

  rankings.sort((a, b) => b.compositeScore - a.compositeScore);
  rankings.forEach((r, i) => r.rank = i + 1);
  return rankings;
}

// Detect statistical shifts
function detectShifts(stats: NumberStats[], draws: DrawResult[], config: LotteryConfig): StatisticalShift[] {
  const shifts: StatisticalShift[] = [];
  const recent = draws.slice(0, 30);
  const older = draws.slice(30, 90);

  if (older.length < 10) return shifts;

  for (const s of stats) {
    const recentCount = recent.filter(d => d.numbers.includes(s.number)).length;
    const olderCount = older.filter(d => d.numbers.includes(s.number)).length;

    const recentRate = recentCount / recent.length;
    const olderRate = olderCount / older.length;
    const change = recentRate - olderRate;

    if (Math.abs(change) > 0.05) {
      shifts.push({
        number: s.number,
        type: change > 0 ? "entrando_tendencia" : "saindo_tendencia",
        oldValue: Math.round(olderRate * 100),
        newValue: Math.round(recentRate * 100),
        magnitude: Math.round(Math.abs(change) * 100),
        description: change > 0
          ? `Dezena ${s.number} subiu de ${Math.round(olderRate * 100)}% para ${Math.round(recentRate * 100)}%`
          : `Dezena ${s.number} caiu de ${Math.round(olderRate * 100)}% para ${Math.round(recentRate * 100)}%`,
      });
    }
  }

  shifts.sort((a, b) => b.magnitude - a.magnitude);
  return shifts.slice(0, 15);
}

// Detect patterns
function detectPatterns(draws: DrawResult[], config: LotteryConfig, stats: NumberStats[]): PatternInsight[] {
  const patterns: PatternInsight[] = [];
  if (draws.length < 20) return patterns;

  // Parity pattern
  const parityRatios = draws.slice(0, 50).map(d => {
    const even = d.numbers.filter(n => n % 2 === 0).length;
    return even / d.numbers.length;
  });
  const avgParity = parityRatios.reduce((a, b) => a + b, 0) / parityRatios.length;
  if (Math.abs(avgParity - 0.5) > 0.08) {
    patterns.push({
      type: "paridade",
      description: avgParity > 0.5
        ? `Tendência para números pares (${Math.round(avgParity * 100)}% nos últimos 50 concursos)`
        : `Tendência para números ímpares (${Math.round((1 - avgParity) * 100)}% nos últimos 50 concursos)`,
      confidence: Math.min(95, 60 + Math.abs(avgParity - 0.5) * 200),
      impact: "médio",
      icon: "⚖️",
    });
  }

  // Sum trend
  const recentSums = draws.slice(0, 20).map(d => d.numbers.reduce((a, b) => a + b, 0));
  const olderSums = draws.slice(20, 60).map(d => d.numbers.reduce((a, b) => a + b, 0));
  if (olderSums.length > 0) {
    const avgRecent = recentSums.reduce((a, b) => a + b, 0) / recentSums.length;
    const avgOlder = olderSums.reduce((a, b) => a + b, 0) / olderSums.length;
    if (Math.abs(avgRecent - avgOlder) > avgOlder * 0.05) {
      patterns.push({
        type: "soma",
        description: avgRecent > avgOlder
          ? `Soma média subindo: ${Math.round(avgRecent)} (era ${Math.round(avgOlder)})`
          : `Soma média descendo: ${Math.round(avgRecent)} (era ${Math.round(avgOlder)})`,
        confidence: 70,
        impact: "médio",
        icon: "📊",
      });
    }
  }

  // Consecutive numbers pattern
  const consecRate = draws.slice(0, 50).map(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let pairs = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) pairs++;
    }
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

  // Hot zone detection
  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  patterns.push({
    type: "temperatura",
    description: `${hotNumbers} dezenas quentes, ${coldNumbers} dezenas frias no momento`,
    confidence: 80,
    impact: "alto",
    icon: "🌡️",
  });

  // Repetition from previous draw
  if (draws.length >= 2) {
    const repRates: number[] = [];
    for (let i = 0; i < Math.min(50, draws.length - 1); i++) {
      const current = new Set(draws[i].numbers);
      const prev = draws[i + 1].numbers;
      const reps = prev.filter(n => current.has(n)).length;
      repRates.push(reps);
    }
    const avgRep = repRates.reduce((a, b) => a + b, 0) / repRates.length;
    patterns.push({
      type: "repetição",
      description: `Média de ${avgRep.toFixed(1)} dezenas repetidas entre concursos consecutivos`,
      confidence: 90,
      impact: "alto",
      icon: "🔄",
    });
  }

  return patterns;
}

// Evaluate strategies
function evaluateStrategies(draws: DrawResult[], config: LotteryConfig, stats: NumberStats[]): StrategyPerformance[] {
  const strategies: StrategyPerformance[] = [];
  const testDraws = draws.slice(0, 50);
  const historyDraws = draws.slice(50);

  if (historyDraws.length < 20) return strategies;

  // Strategy 1: Hot numbers
  const hotNums = stats.filter(s => s.status === "hot").sort((a, b) => b.frequency - a.frequency).slice(0, config.pick).map(s => s.number);
  const hotResults = testDraws.map(d => {
    const set = new Set(d.numbers);
    return hotNums.filter(n => set.has(n)).length;
  });
  strategies.push({
    name: "Dezenas Quentes",
    winRate: hotResults.filter(r => r >= Math.ceil(config.pick * 0.6)).length / testDraws.length * 100,
    avgHits: hotResults.reduce((a, b) => a + b, 0) / hotResults.length,
    bestResult: Math.max(...hotResults),
    totalTests: testDraws.length,
    trend: "estável",
  });

  // Strategy 2: Balanced (mix hot + cold)
  const coldNums = stats.filter(s => s.status === "cold").sort((a, b) => b.cycleScore - a.cycleScore).slice(0, Math.floor(config.pick / 3)).map(s => s.number);
  const balancedNums = [...hotNums.slice(0, config.pick - coldNums.length), ...coldNums].slice(0, config.pick);
  const balResults = testDraws.map(d => {
    const set = new Set(d.numbers);
    return balancedNums.filter(n => set.has(n)).length;
  });
  strategies.push({
    name: "Equilibrada (Quentes + Frias)",
    winRate: balResults.filter(r => r >= Math.ceil(config.pick * 0.6)).length / testDraws.length * 100,
    avgHits: balResults.reduce((a, b) => a + b, 0) / balResults.length,
    bestResult: Math.max(...balResults),
    totalTests: testDraws.length,
    trend: "estável",
  });

  // Strategy 3: Trend-based
  const trendNums = stats.sort((a, b) => b.trend - a.trend).slice(0, config.pick).map(s => s.number);
  const trendResults = testDraws.map(d => {
    const set = new Set(d.numbers);
    return trendNums.filter(n => set.has(n)).length;
  });
  strategies.push({
    name: "Tendência Recente",
    winRate: trendResults.filter(r => r >= Math.ceil(config.pick * 0.6)).length / testDraws.length * 100,
    avgHits: trendResults.reduce((a, b) => a + b, 0) / trendResults.length,
    bestResult: Math.max(...trendResults),
    totalTests: testDraws.length,
    trend: "melhorando",
  });

  // Strategy 4: Cycle-based
  const cycleNums = stats.sort((a, b) => b.cycleScore - a.cycleScore).slice(0, config.pick).map(s => s.number);
  const cycleResults = testDraws.map(d => {
    const set = new Set(d.numbers);
    return cycleNums.filter(n => set.has(n)).length;
  });
  strategies.push({
    name: "Ciclo Estatístico",
    winRate: cycleResults.filter(r => r >= Math.ceil(config.pick * 0.6)).length / testDraws.length * 100,
    avgHits: cycleResults.reduce((a, b) => a + b, 0) / cycleResults.length,
    bestResult: Math.max(...cycleResults),
    totalTests: testDraws.length,
    trend: "estável",
  });

  return strategies;
}

// Main autonomous AI analysis function
export function runAutonomousAnalysis(
  draws: DrawResult[],
  stats: NumberStats[],
  config: LotteryConfig
): AutonomousAIReport {
  const rankings = computeRankings(stats, draws, config);
  const patterns = detectPatterns(draws, config, stats);
  const strategies = evaluateStrategies(draws, config, stats);
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

  // Consecutive profile
  const consecCounts = recentDraws.map(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let pairs = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) pairs++;
    }
    return pairs;
  });
  const avgConsec = consecCounts.reduce((a, b) => a + b, 0) / (consecCounts.length || 1);
  const pctWithConsec = consecCounts.filter(c => c > 0).length / (consecCounts.length || 1) * 100;

  // Spatial distribution
  const zones = 4;
  const zoneSize = Math.ceil(config.numbers / zones);
  const zoneCounts = Array(zones).fill(0);
  const expectedPerZone = (recentDraws.length * config.pick) / zones;
  recentDraws.forEach(d => {
    d.numbers.forEach(n => {
      const z = Math.min(zones - 1, Math.floor((n - 1) / zoneSize));
      zoneCounts[z]++;
    });
  });

  const spatialDistribution = zoneCounts.map((count, i) => ({
    zone: `${i * zoneSize + 1}-${Math.min((i + 1) * zoneSize, config.numbers)}`,
    expected: Math.round(expectedPerZone),
    actual: count,
  }));

  // Suggested numbers (top ranked)
  const suggestedNumbers = rankings.slice(0, config.pick).map(r => r.number).sort((a, b) => a - b);
  // Avoid numbers (bottom ranked with downward trend)
  const avoidNumbers = rankings.filter(r => r.trend === "descendo").slice(-5).map(r => r.number).sort((a, b) => a - b);

  return {
    rankings,
    patterns,
    strategies,
    shifts,
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
    },
    consecutiveProfile: { avgConsecutive: Math.round(avgConsec * 10) / 10, pctWithConsecutive: Math.round(pctWithConsec) },
    spatialDistribution,
    lastUpdated: new Date().toISOString(),
    drawsAnalyzed: draws.length,
    suggestedNumbers,
    avoidNumbers,
  };
}
