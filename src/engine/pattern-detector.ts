import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/features/statistics/engine";

// ═══════════════════════════════════════════════════════════════════
// DETECTOR DE PADRÕES ESTATÍSTICOS v2.1
// Análise profunda: ciclos, transições, coocorrência, clusterização
// Melhorias: mediana, primos, fibonacci, gap analysis, scoring
// ═══════════════════════════════════════════════════════════════════

export interface PatternReport {
  parityPatterns: ParityPattern[];
  sumPatterns: SumPattern[];
  consecutivePatterns: ConsecutivePattern[];
  frequencyTrends: FrequencyTrend[];
  spatialDistribution: SpatialDistribution;
  hotStreaks: HotStreak[];
  transitionAnalysis: TransitionAnalysis;
  cooccurrenceMatrix: CooccurrencePair[];
  cycleDetection: CyclePattern[];
  rarePatterns: RarePattern[];
  numberClusters: NumberCluster[];
  summary: PatternSummary;
}

export interface ParityPattern {
  evens: number;
  odds: number;
  count: number;
  percentage: number;
}

export interface SumPattern {
  rangeLabel: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface ConsecutivePattern {
  consecutiveCount: number;
  occurrences: number;
  percentage: number;
}

export interface FrequencyTrend {
  number: number;
  last10Freq: number;
  last30Freq: number;
  last100Freq: number;
  totalFreq: number;
  trendDirection: "up" | "down" | "stable";
  momentum: number;
  score: number; // 0-100 composite score
}

export interface SpatialDistribution {
  sectors: { label: string; min: number; max: number; avgCount: number; stdDev: number }[];
  balance: number;
}

export interface HotStreak {
  number: number;
  streakLength: number;
  startDraw: number;
  endDraw: number;
}

export interface TransitionAnalysis {
  avgRepeatBetweenDraws: number;
  repeatDistribution: { repeats: number; count: number; percentage: number }[];
  mostRepeatedPairs: { from: number; to: number; count: number }[];
  transitionMatrix: { numberA: number; numberB: number; count: number; direction: "follows" }[];
}

export interface CooccurrencePair {
  numA: number;
  numB: number;
  count: number;
  lift: number;
}

export interface CyclePattern {
  number: number;
  avgCycleLength: number;
  medianCycleLength: number;
  currentDelay: number;
  predictedReturn: number;
  confidence: number;
  cycleRegularity: number;
  status: "overdue" | "due" | "early" | "on-time";
}

export interface RarePattern {
  type: string;
  description: string;
  occurrences: number;
  lastSeen: number;
  rarity: number;
}

export interface NumberCluster {
  id: number;
  numbers: number[];
  avgCooccurrence: number;
  strength: number;
}

export interface PatternSummary {
  mostCommonParity: string;
  parityDeviation: number;
  avgSum: number;
  medianSum: number;
  sumStdDev: number;
  avgConsecutives: number;
  trendingUp: number[];
  trendingDown: number[];
  mostConsistent: number[];
  overdueNumbers: number[];
  avgRepeatsBetweenDraws: number;
  strongestCluster: number[];
  topCooccurrences: string[];
  overallScore: number; // 0-100 data quality/confidence
  primeRatio: number;
}

// ─── Main Detection Function ────────────────────────────────────

export function detectPatterns(
  draws: DrawResult[],
  stats: NumberStats[],
  config: LotteryConfig,
  drawCount: number = 200
): PatternReport {
  const selected = draws.slice(0, Math.min(drawCount, draws.length)).filter(d => d && Array.isArray(d.numbers));
  if (selected.length === 0) return emptyReport();

  const parityPatterns = analyzeParityPatterns(selected);
  const { sumPatterns, avgSum, sumStdDev, medianSum } = analyzeSumPatterns(selected);
  const consecutivePatterns = analyzeConsecutivePatterns(selected);
  const frequencyTrends = analyzeFrequencyTrends(selected, stats, config);
  const spatialDistribution = analyzeSpatialDistribution(selected, config);
  const hotStreaks = analyzeHotStreaks(selected, stats);
  const transitionAnalysis = analyzeTransitions(selected, config);
  const cooccurrenceMatrix = analyzeCooccurrence(selected, config);
  const cycleDetection = analyzeCycles(selected, stats, config);
  const rarePatterns = detectRarePatterns(selected, config);
  const numberClusters = clusterNumbers(cooccurrenceMatrix, config);

  const trendingUp = frequencyTrends.filter(f => f.trendDirection === "up").slice(0, 10).map(f => f.number);
  const trendingDown = frequencyTrends.filter(f => f.trendDirection === "down").slice(0, 10).map(f => f.number);
  const mostConsistent = [...stats]
    .filter(s => s.avgGap > 0)
    .sort((a, b) => (a.stdDev / a.avgGap) - (b.stdDev / b.avgGap))
    .slice(0, 10)
    .map(s => s.number);
  const overdueNumbers = [...stats]
    .filter(s => s.cycleScore > 1.5)
    .sort((a, b) => b.cycleScore - a.cycleScore)
    .slice(0, 10)
    .map(s => s.number);

  // Parity deviation from uniform
  const idealParityEvens = config.pick / 2;
  const parityDeviation = parityPatterns.length > 0
    ? Math.round(Math.abs(parityPatterns[0].evens - idealParityEvens) / idealParityEvens * 100)
    : 0;

  // Prime ratio
  const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
  const primeNumbers = selected.flatMap(d => d.numbers.filter(n => primes.has(n)));
  const primeRatio = Math.round(primeNumbers.length / (selected.length * config.pick) * 100);

  // Overall score based on data quality
  const overallScore = Math.min(100, Math.round(
    (selected.length >= 100 ? 30 : selected.length / 100 * 30) +
    (cycleDetection.filter(c => c.confidence > 0.3).length > 5 ? 25 : cycleDetection.filter(c => c.confidence > 0.3).length * 5) +
    (numberClusters.length > 0 ? 20 : 0) +
    (spatialDistribution.balance > 60 ? 25 : spatialDistribution.balance / 60 * 25)
  ));

  return {
    parityPatterns,
    sumPatterns,
    consecutivePatterns,
    frequencyTrends,
    spatialDistribution,
    hotStreaks: hotStreaks.slice(0, 15),
    transitionAnalysis,
    cooccurrenceMatrix: cooccurrenceMatrix.slice(0, 30),
    cycleDetection: cycleDetection.slice(0, 25),
    rarePatterns,
    numberClusters,
    summary: {
      mostCommonParity: parityPatterns[0] ? `${parityPatterns[0].evens}P/${parityPatterns[0].odds}I` : "",
      parityDeviation,
      avgSum: Math.round(avgSum),
      medianSum,
      sumStdDev: Math.round(sumStdDev),
      avgConsecutives: Math.round(
        consecutivePatterns.reduce((s, c) => s + c.consecutiveCount * c.occurrences, 0) / selected.length * 10
      ) / 10,
      trendingUp,
      trendingDown,
      mostConsistent,
      overdueNumbers,
      avgRepeatsBetweenDraws: transitionAnalysis.avgRepeatBetweenDraws,
      strongestCluster: numberClusters[0]?.numbers || [],
      topCooccurrences: cooccurrenceMatrix.slice(0, 5).map(c =>
        `${String(c.numA).padStart(2, "0")}+${String(c.numB).padStart(2, "0")}`
      ),
      overallScore,
      primeRatio,
    },
  };
}

// ─── Analysis Functions ─────────────────────────────────────────

function analyzeParityPatterns(draws: DrawResult[]): ParityPattern[] {
  const parityCounts = new Map<string, number>();
  draws.forEach(d => {
    const evens = d.numbers.filter(n => n % 2 === 0).length;
    const odds = d.numbers.length - evens;
    const key = `${evens}/${odds}`;
    parityCounts.set(key, (parityCounts.get(key) || 0) + 1);
  });
  return [...parityCounts.entries()]
    .map(([key, count]) => {
      const [evens, odds] = key.split("/").map(Number);
      return { evens, odds, count, percentage: Math.round(count / draws.length * 10000) / 100 };
    })
    .sort((a, b) => b.count - a.count);
}

function analyzeSumPatterns(draws: DrawResult[]) {
  const sums = draws.map(d => d.numbers.reduce((s, n) => s + n, 0));
  const avgSum = sums.reduce((s, v) => s + v, 0) / sums.length;
  const sumVariance = sums.reduce((s, v) => s + (v - avgSum) ** 2, 0) / sums.length;
  const sumStdDev = Math.sqrt(sumVariance);
  const sortedSums = [...sums].sort((a, b) => a - b);
  const medianSum = sortedSums.length % 2 === 0
    ? Math.round((sortedSums[sortedSums.length / 2 - 1] + sortedSums[sortedSums.length / 2]) / 2)
    : sortedSums[Math.floor(sortedSums.length / 2)];
  const sumMin = Math.min(...sums);
  const sumMax = Math.max(...sums);
  const rangeSize = Math.ceil((sumMax - sumMin) / 5);
  const sumPatterns: SumPattern[] = [];
  for (let i = 0; i < 5; i++) {
    const min = sumMin + i * rangeSize;
    const max = i === 4 ? sumMax : min + rangeSize - 1;
    const count = sums.filter(s => s >= min && s <= max).length;
    sumPatterns.push({
      rangeLabel: `${min}-${max}`, min, max, count,
      percentage: Math.round(count / sums.length * 10000) / 100,
    });
  }
  return { sumPatterns, avgSum, sumStdDev, medianSum };
}

function analyzeConsecutivePatterns(draws: DrawResult[]): ConsecutivePattern[] {
  const consecutiveCounts: Record<number, number> = {};
  draws.forEach(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let maxConsec = 1, curConsec = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) { curConsec++; maxConsec = Math.max(maxConsec, curConsec); }
      else curConsec = 1;
    }
    consecutiveCounts[maxConsec] = (consecutiveCounts[maxConsec] || 0) + 1;
  });
  return Object.entries(consecutiveCounts)
    .map(([k, v]) => ({ consecutiveCount: Number(k), occurrences: v, percentage: Math.round(v / draws.length * 10000) / 100 }))
    .sort((a, b) => a.consecutiveCount - b.consecutiveCount);
}

function analyzeFrequencyTrends(draws: DrawResult[], stats: NumberStats[], config: LotteryConfig): FrequencyTrend[] {
  return stats.map(s => {
    let last10 = 0, last30 = 0, last100 = 0;
    draws.forEach((d, i) => {
      if (d.numbers.includes(s.number)) {
        if (i < 10) last10++;
        if (i < 30) last30++;
        if (i < 100) last100++;
      }
    });
    const expectedPer10 = (config.pick / config.numbers) * 10;
    const ratio10 = last10 / expectedPer10;
    const ratio30 = (last30 / 3) / expectedPer10;
    const ratio100 = draws.length >= 100 ? (last100 / 10) / expectedPer10 : ratio30;
    const direction: "up" | "down" | "stable" =
      ratio10 > ratio30 * 1.2 ? "up" : ratio10 < ratio30 * 0.8 ? "down" : "stable";
    const momentum = Math.round((ratio10 - ratio30) * 100) / 100;

    // Composite score: momentum + consistency + recency
    const momentumScore = Math.min(50, Math.max(0, (momentum + 1) * 25));
    const consistencyScore = s.avgGap > 0 ? Math.max(0, 30 - (s.stdDev / s.avgGap) * 30) : 0;
    const recencyScore = last10 > 0 ? 20 : 0;
    const score = Math.round(momentumScore + consistencyScore + recencyScore);

    return {
      number: s.number, last10Freq: last10, last30Freq: last30, last100Freq: last100,
      totalFreq: s.frequency, trendDirection: direction, momentum, score,
    };
  }).sort((a, b) => b.momentum - a.momentum);
}

function analyzeSpatialDistribution(draws: DrawResult[], config: LotteryConfig): SpatialDistribution {
  const sectorCount = Math.min(5, Math.ceil(config.numbers / 10));
  const sectorSize = Math.ceil(config.numbers / sectorCount);
  const sectorData = Array.from({ length: sectorCount }, (_, i) => {
    const min = i * sectorSize + 1;
    const max = Math.min((i + 1) * sectorSize, config.numbers);
    const counts = draws.map(d => d.numbers.filter(n => n >= min && n <= max).length);
    const avg = counts.reduce((s, v) => s + v, 0) / counts.length;
    const variance = counts.reduce((s, v) => s + (v - avg) ** 2, 0) / counts.length;
    return { label: `${min}-${max}`, min, max, avgCount: Math.round(avg * 100) / 100, stdDev: Math.round(Math.sqrt(variance) * 100) / 100 };
  });
  const idealAvg = config.pick / sectorCount;
  const balanceDeviation = sectorData.reduce((s, sec) => s + Math.abs(sec.avgCount - idealAvg), 0) / sectorCount;
  return { sectors: sectorData, balance: Math.round(Math.max(0, 100 - balanceDeviation / idealAvg * 100)) };
}

function analyzeHotStreaks(draws: DrawResult[], stats: NumberStats[]): HotStreak[] {
  const hotStreaks: HotStreak[] = [];
  for (const s of stats) {
    let streak = 0, maxStreak = 0, startIdx = 0, bestStart = 0, bestEnd = 0;
    for (let i = draws.length - 1; i >= 0; i--) {
      if (draws[i].numbers.includes(s.number)) {
        if (streak === 0) startIdx = i;
        streak++;
        if (streak > maxStreak) { maxStreak = streak; bestStart = startIdx; bestEnd = i; }
      } else { streak = 0; }
    }
    if (maxStreak >= 3) {
      hotStreaks.push({ number: s.number, streakLength: maxStreak, startDraw: draws[bestStart]?.concurso || 0, endDraw: draws[bestEnd]?.concurso || 0 });
    }
  }
  return hotStreaks.sort((a, b) => b.streakLength - a.streakLength);
}

// ─── v2: Transition Analysis ────────────────────────────────────

function analyzeTransitions(draws: DrawResult[], config: LotteryConfig): TransitionAnalysis {
  const repeatCounts: number[] = [];
  const pairCounts = new Map<string, number>();
  const followCounts = new Map<string, number>();

  for (let i = 0; i < draws.length - 1; i++) {
    const current = new Set(draws[i].numbers);
    const next = draws[i + 1].numbers;
    let repeats = 0;
    for (const n of next) {
      if (current.has(n)) {
        repeats++;
        pairCounts.set(`${n}`, (pairCounts.get(`${n}`) || 0) + 1);
      }
    }
    repeatCounts.push(repeats);

    // Track which numbers follow which (non-repeat transitions)
    const newInNext = next.filter(n => !current.has(n));
    const goneFromCurrent = draws[i].numbers.filter(n => !new Set(next).has(n));
    for (const gone of goneFromCurrent.slice(0, 3)) {
      for (const arrived of newInNext.slice(0, 3)) {
        const key = `${gone}->${arrived}`;
        followCounts.set(key, (followCounts.get(key) || 0) + 1);
      }
    }
  }

  const avgRepeat = repeatCounts.length > 0
    ? Math.round(repeatCounts.reduce((s, v) => s + v, 0) / repeatCounts.length * 100) / 100
    : 0;

  const distMap = new Map<number, number>();
  repeatCounts.forEach(r => distMap.set(r, (distMap.get(r) || 0) + 1));
  const repeatDistribution = [...distMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([repeats, count]) => ({
      repeats, count,
      percentage: Math.round(count / repeatCounts.length * 10000) / 100,
    }));

  const mostRepeatedPairs = [...pairCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([n, count]) => ({ from: Number(n), to: Number(n), count }));

  const transitionMatrix = [...followCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([key, count]) => {
      const [a, b] = key.split("->").map(Number);
      return { numberA: a, numberB: b, count, direction: "follows" as const };
    });

  return { avgRepeatBetweenDraws: avgRepeat, repeatDistribution, mostRepeatedPairs, transitionMatrix };
}

// ─── v2: Co-occurrence Analysis ─────────────────────────────────

function analyzeCooccurrence(draws: DrawResult[], config: LotteryConfig): CooccurrencePair[] {
  const pairCount = new Map<string, number>();
  const singleCount = new Map<number, number>();
  const total = draws.length;

  for (const d of draws) {
    const nums = d.numbers;
    for (const n of nums) singleCount.set(n, (singleCount.get(n) || 0) + 1);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${Math.min(nums[i], nums[j])}-${Math.max(nums[i], nums[j])}`;
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  }

  const pairs: CooccurrencePair[] = [];
  for (const [key, count] of pairCount.entries()) {
    const [a, b] = key.split("-").map(Number);
    const pA = (singleCount.get(a) || 0) / total;
    const pB = (singleCount.get(b) || 0) / total;
    const pAB = count / total;
    const expectedPAB = pA * pB;
    const lift = expectedPAB > 0 ? Math.round(pAB / expectedPAB * 100) / 100 : 0;

    if (count >= 3) {
      pairs.push({ numA: a, numB: b, count, lift });
    }
  }

  return pairs.sort((a, b) => b.lift - a.lift);
}

// ─── v2: Cycle Detection ────────────────────────────────────────

function analyzeCycles(draws: DrawResult[], stats: NumberStats[], config: LotteryConfig): CyclePattern[] {
  const cycles: CyclePattern[] = [];

  for (const s of stats) {
    const positions: number[] = [];
    for (let i = 0; i < draws.length; i++) {
      if (draws[i].numbers.includes(s.number)) positions.push(i);
    }

    if (positions.length < 3) continue;

    const gaps: number[] = [];
    for (let i = 1; i < positions.length; i++) {
      gaps.push(positions[i] - positions[i - 1]);
    }

    const avgGap = gaps.reduce((s, v) => s + v, 0) / gaps.length;
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const medianGap = sortedGaps.length % 2 === 0
      ? (sortedGaps[sortedGaps.length / 2 - 1] + sortedGaps[sortedGaps.length / 2]) / 2
      : sortedGaps[Math.floor(sortedGaps.length / 2)];
    const gapVariance = gaps.reduce((s, v) => s + (v - avgGap) ** 2, 0) / gaps.length;
    const gapStdDev = Math.sqrt(gapVariance);
    const regularity = avgGap > 0 ? Math.max(0, 1 - gapStdDev / avgGap) : 0;

    const currentDelay = positions[0];
    const predictedReturn = Math.max(0, Math.round(avgGap - currentDelay));
    const confidence = Math.min(1, regularity * (positions.length / draws.length) * 10);

    // Determine status
    let status: CyclePattern["status"] = "on-time";
    if (currentDelay > avgGap * 1.5) status = "overdue";
    else if (currentDelay > avgGap * 0.9) status = "due";
    else if (currentDelay < avgGap * 0.5) status = "early";

    cycles.push({
      number: s.number,
      avgCycleLength: Math.round(avgGap * 10) / 10,
      medianCycleLength: Math.round(medianGap * 10) / 10,
      currentDelay,
      predictedReturn,
      confidence: Math.round(confidence * 100) / 100,
      cycleRegularity: Math.round(regularity * 100) / 100,
      status,
    });
  }

  return cycles.sort((a, b) => b.confidence - a.confidence);
}

// ─── v2: Rare Pattern Detection ─────────────────────────────────

function detectRarePatterns(draws: DrawResult[], config: LotteryConfig): RarePattern[] {
  const patterns: RarePattern[] = [];
  if (draws.length < 10) return patterns;

  // 1. All even / all odd draws
  let allEvenCount = 0, allOddCount = 0, lastAllEven = 0, lastAllOdd = 0;
  for (const d of draws) {
    const evens = d.numbers.filter(n => n % 2 === 0).length;
    if (evens === d.numbers.length) { allEvenCount++; lastAllEven = d.concurso; }
    if (evens === 0) { allOddCount++; lastAllOdd = d.concurso; }
  }
  if (allEvenCount > 0 || allOddCount > 0) {
    patterns.push({
      type: "extreme_parity",
      description: `Todos pares: ${allEvenCount}x | Todos ímpares: ${allOddCount}x`,
      occurrences: allEvenCount + allOddCount,
      lastSeen: Math.max(lastAllEven, lastAllOdd),
      rarity: 1 - (allEvenCount + allOddCount) / draws.length,
    });
  }

  // 2. Extreme sums (outliers)
  const sums = draws.map(d => ({ sum: d.numbers.reduce((s, n) => s + n, 0), concurso: d.concurso }));
  const avgSum = sums.reduce((s, v) => s + v.sum, 0) / sums.length;
  const sumStd = Math.sqrt(sums.reduce((s, v) => s + (v.sum - avgSum) ** 2, 0) / sums.length);
  const extremeSums = sums.filter(s => Math.abs(s.sum - avgSum) > 2.5 * sumStd);
  if (extremeSums.length > 0) {
    patterns.push({
      type: "extreme_sum",
      description: `Soma extrema (>2.5σ): ${extremeSums.map(s => s.sum).join(", ")}`,
      occurrences: extremeSums.length,
      lastSeen: extremeSums[0]?.concurso || 0,
      rarity: 1 - extremeSums.length / draws.length,
    });
  }

  // 3. Long consecutive sequences (4+)
  let longConsecCount = 0, lastLongConsec = 0;
  for (const d of draws) {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let maxConsec = 1, cur = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) { cur++; maxConsec = Math.max(maxConsec, cur); }
      else cur = 1;
    }
    if (maxConsec >= 4) { longConsecCount++; lastLongConsec = d.concurso; }
  }
  if (longConsecCount > 0) {
    patterns.push({
      type: "long_consecutive",
      description: `4+ números consecutivos em ${longConsecCount} concursos`,
      occurrences: longConsecCount,
      lastSeen: lastLongConsec,
      rarity: 1 - longConsecCount / draws.length,
    });
  }

  // 4. Decade concentration
  let sameDecadeCount = 0, lastSameDecade = 0;
  for (const d of draws) {
    const decades = d.numbers.map(n => Math.floor((n - 1) / 10));
    const decadeCounts = new Map<number, number>();
    decades.forEach(dec => decadeCounts.set(dec, (decadeCounts.get(dec) || 0) + 1));
    const maxInDecade = Math.max(...decadeCounts.values());
    if (maxInDecade >= Math.ceil(config.pick * 0.6)) {
      sameDecadeCount++;
      lastSameDecade = d.concurso;
    }
  }
  if (sameDecadeCount > 0) {
    patterns.push({
      type: "decade_concentration",
      description: `60%+ dos números na mesma dezena: ${sameDecadeCount}x`,
      occurrences: sameDecadeCount,
      lastSeen: lastSameDecade,
      rarity: 1 - sameDecadeCount / draws.length,
    });
  }

  // 5. Zero repeat between consecutive draws
  let zeroRepeatCount = 0, lastZeroRepeat = 0;
  for (let i = 0; i < draws.length - 1; i++) {
    const current = new Set(draws[i].numbers);
    const hasRepeat = draws[i + 1].numbers.some(n => current.has(n));
    if (!hasRepeat) { zeroRepeatCount++; lastZeroRepeat = draws[i + 1].concurso; }
  }
  if (zeroRepeatCount > 0) {
    patterns.push({
      type: "zero_repeat",
      description: `Nenhum número repetido do concurso anterior: ${zeroRepeatCount}x`,
      occurrences: zeroRepeatCount,
      lastSeen: lastZeroRepeat,
      rarity: 1 - zeroRepeatCount / draws.length,
    });
  }

  // 6. Prime concentration
  const primes = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
  let highPrimeCount = 0, lastHighPrime = 0;
  for (const d of draws) {
    const primeCount = d.numbers.filter(n => primes.has(n)).length;
    if (primeCount >= Math.ceil(config.pick * 0.7)) {
      highPrimeCount++;
      lastHighPrime = d.concurso;
    }
  }
  if (highPrimeCount > 0) {
    patterns.push({
      type: "prime_concentration",
      description: `70%+ dos números são primos: ${highPrimeCount}x`,
      occurrences: highPrimeCount,
      lastSeen: lastHighPrime,
      rarity: 1 - highPrimeCount / draws.length,
    });
  }

  // 7. Fibonacci presence
  const fibs = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);
  let highFibCount = 0, lastHighFib = 0;
  for (const d of draws) {
    const fibCount = d.numbers.filter(n => fibs.has(n)).length;
    if (fibCount >= Math.ceil(config.pick * 0.5)) {
      highFibCount++;
      lastHighFib = d.concurso;
    }
  }
  if (highFibCount > 0) {
    patterns.push({
      type: "fibonacci_concentration",
      description: `50%+ dos números são Fibonacci: ${highFibCount}x`,
      occurrences: highFibCount,
      lastSeen: lastHighFib,
      rarity: 1 - highFibCount / draws.length,
    });
  }

  return patterns.sort((a, b) => b.rarity - a.rarity);
}

// ─── v2: Number Clustering ──────────────────────────────────────

function clusterNumbers(cooccurrences: CooccurrencePair[], config: LotteryConfig): NumberCluster[] {
  if (cooccurrences.length === 0) return [];

  const adjacency = new Map<number, Map<number, number>>();
  for (const co of cooccurrences) {
    if (!adjacency.has(co.numA)) adjacency.set(co.numA, new Map());
    if (!adjacency.has(co.numB)) adjacency.set(co.numB, new Map());
    adjacency.get(co.numA)!.set(co.numB, co.lift);
    adjacency.get(co.numB)!.set(co.numA, co.lift);
  }

  const used = new Set<number>();
  const clusters: NumberCluster[] = [];
  const topPairs = cooccurrences.filter(c => c.lift > 1).slice(0, 50);

  let clusterId = 0;
  for (const pair of topPairs) {
    if (used.has(pair.numA) && used.has(pair.numB)) continue;

    const seed = !used.has(pair.numA) ? pair.numA : pair.numB;
    if (used.has(seed)) continue;

    const cluster = [seed];
    used.add(seed);

    const neighbors = adjacency.get(seed);
    if (neighbors) {
      const sorted = [...neighbors.entries()].sort((a, b) => b[1] - a[1]);
      for (const [n, lift] of sorted) {
        if (!used.has(n) && lift > 1 && cluster.length < 6) {
          cluster.push(n);
          used.add(n);
        }
      }
    }

    if (cluster.length >= 2) {
      const avgLift = cluster.length > 1
        ? cooccurrences
            .filter(c => cluster.includes(c.numA) && cluster.includes(c.numB))
            .reduce((s, c) => s + c.lift, 0) / Math.max(1, cluster.length * (cluster.length - 1) / 2)
        : 0;

      clusters.push({
        id: clusterId++,
        numbers: cluster.sort((a, b) => a - b),
        avgCooccurrence: Math.round(avgLift * 100) / 100,
        strength: Math.min(1, Math.round(avgLift * 50) / 100),
      });
    }

    if (clusters.length >= 8) break;
  }

  return clusters.sort((a, b) => b.strength - a.strength);
}

// ─── Empty Report ───────────────────────────────────────────────

function emptyReport(): PatternReport {
  return {
    parityPatterns: [], sumPatterns: [], consecutivePatterns: [],
    frequencyTrends: [], spatialDistribution: { sectors: [], balance: 0 },
    hotStreaks: [], transitionAnalysis: { avgRepeatBetweenDraws: 0, repeatDistribution: [], mostRepeatedPairs: [], transitionMatrix: [] },
    cooccurrenceMatrix: [], cycleDetection: [], rarePatterns: [], numberClusters: [],
    summary: {
      mostCommonParity: "", parityDeviation: 0, avgSum: 0, medianSum: 0, sumStdDev: 0, avgConsecutives: 0,
      trendingUp: [], trendingDown: [], mostConsistent: [], overdueNumbers: [],
      avgRepeatsBetweenDraws: 0, strongestCluster: [], topCooccurrences: [],
      overallScore: 0, primeRatio: 0,
    },
  };
}
