import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "./statistics";

// ═══════════════════════════════════════════════════════════════════
// DETECTOR DE PADRÕES ESTATÍSTICOS v2.0
// Análise profunda: ciclos, transições, coocorrência, clusterização
// ═══════════════════════════════════════════════════════════════════

export interface PatternReport {
  parityPatterns: ParityPattern[];
  sumPatterns: SumPattern[];
  consecutivePatterns: ConsecutivePattern[];
  frequencyTrends: FrequencyTrend[];
  spatialDistribution: SpatialDistribution;
  hotStreaks: HotStreak[];
  // v2 additions
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

// ─── v2 Types ────────────────────────────────────────────────────

export interface TransitionAnalysis {
  avgRepeatBetweenDraws: number;
  repeatDistribution: { repeats: number; count: number; percentage: number }[];
  mostRepeatedPairs: { from: number; to: number; count: number }[];
}

export interface CooccurrencePair {
  numA: number;
  numB: number;
  count: number;
  lift: number; // lift > 1 = appear together more than expected
}

export interface CyclePattern {
  number: number;
  avgCycleLength: number;
  currentDelay: number;
  predictedReturn: number; // estimated draws until next appearance
  confidence: number; // 0-1
  cycleRegularity: number; // 0-1, lower stdDev = more regular
}

export interface RarePattern {
  type: string;
  description: string;
  occurrences: number;
  lastSeen: number; // concurso number
  rarity: number; // 0-1, higher = more rare
}

export interface NumberCluster {
  id: number;
  numbers: number[];
  avgCooccurrence: number;
  strength: number; // 0-1
}

export interface PatternSummary {
  mostCommonParity: string;
  avgSum: number;
  sumStdDev: number;
  avgConsecutives: number;
  trendingUp: number[];
  trendingDown: number[];
  mostConsistent: number[];
  overdueNumbers: number[];
  avgRepeatsBetweenDraws: number;
  strongestCluster: number[];
  topCooccurrences: string[];
}

// ─── Main Detection Function ────────────────────────────────────

export function detectPatterns(
  draws: DrawResult[],
  stats: NumberStats[],
  config: LotteryConfig,
  drawCount: number = 200
): PatternReport {
  const selected = draws.slice(0, Math.min(drawCount, draws.length)).filter(d => d && Array.isArray(d.numbers));
  if (selected.length === 0) {
    return emptyReport();
  }

  // 1. Parity patterns
  const parityPatterns = analyzeParityPatterns(selected);

  // 2. Sum patterns
  const { sumPatterns, avgSum, sumStdDev } = analyzeSumPatterns(selected);

  // 3. Consecutive patterns
  const consecutivePatterns = analyzeConsecutivePatterns(selected);

  // 4. Frequency trends
  const frequencyTrends = analyzeFrequencyTrends(selected, stats, config);

  // 5. Spatial distribution
  const spatialDistribution = analyzeSpatialDistribution(selected, config);

  // 6. Hot streaks
  const hotStreaks = analyzeHotStreaks(selected, stats);

  // 7. Transition analysis (v2)
  const transitionAnalysis = analyzeTransitions(selected);

  // 8. Co-occurrence matrix (v2)
  const cooccurrenceMatrix = analyzeCooccurrence(selected, config);

  // 9. Cycle detection (v2)
  const cycleDetection = analyzeCycles(selected, stats, config);

  // 10. Rare patterns (v2)
  const rarePatterns = detectRarePatterns(selected, config);

  // 11. Number clusters (v2)
  const numberClusters = clusterNumbers(cooccurrenceMatrix, config);

  // Summary
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

  return {
    parityPatterns,
    sumPatterns,
    consecutivePatterns,
    frequencyTrends,
    spatialDistribution,
    hotStreaks: hotStreaks.slice(0, 15),
    transitionAnalysis,
    cooccurrenceMatrix: cooccurrenceMatrix.slice(0, 30),
    cycleDetection: cycleDetection.slice(0, 20),
    rarePatterns,
    numberClusters,
    summary: {
      mostCommonParity: parityPatterns[0] ? `${parityPatterns[0].evens}P/${parityPatterns[0].odds}I` : "",
      avgSum: Math.round(avgSum),
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
  return { sumPatterns, avgSum, sumStdDev };
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
    const direction: "up" | "down" | "stable" =
      ratio10 > ratio30 * 1.2 ? "up" : ratio10 < ratio30 * 0.8 ? "down" : "stable";
    return {
      number: s.number, last10Freq: last10, last30Freq: last30, last100Freq: last100,
      totalFreq: s.frequency, trendDirection: direction,
      momentum: Math.round((ratio10 - ratio30) * 100) / 100,
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

function analyzeTransitions(draws: DrawResult[]): TransitionAnalysis {
  const repeatCounts: number[] = [];
  const pairCounts = new Map<string, number>();

  for (let i = 0; i < draws.length - 1; i++) {
    const current = new Set(draws[i].numbers);
    const next = draws[i + 1].numbers;
    let repeats = 0;
    for (const n of next) {
      if (current.has(n)) {
        repeats++;
        // Track which numbers repeat
        pairCounts.set(`${n}`, (pairCounts.get(`${n}`) || 0) + 1);
      }
    }
    repeatCounts.push(repeats);
  }

  const avgRepeat = repeatCounts.length > 0
    ? Math.round(repeatCounts.reduce((s, v) => s + v, 0) / repeatCounts.length * 100) / 100
    : 0;

  // Distribution of repeat counts
  const distMap = new Map<number, number>();
  repeatCounts.forEach(r => distMap.set(r, (distMap.get(r) || 0) + 1));
  const repeatDistribution = [...distMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([repeats, count]) => ({
      repeats, count,
      percentage: Math.round(count / repeatCounts.length * 10000) / 100,
    }));

  // Most repeated numbers between consecutive draws
  const mostRepeatedPairs = [...pairCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([n, count]) => ({ from: Number(n), to: Number(n), count }));

  return { avgRepeatBetweenDraws: avgRepeat, repeatDistribution, mostRepeatedPairs };
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
    // Find all positions where this number appeared
    const positions: number[] = [];
    for (let i = 0; i < draws.length; i++) {
      if (draws[i].numbers.includes(s.number)) positions.push(i);
    }

    if (positions.length < 3) continue;

    // Calculate gaps between appearances
    const gaps: number[] = [];
    for (let i = 1; i < positions.length; i++) {
      gaps.push(positions[i] - positions[i - 1]);
    }

    const avgGap = gaps.reduce((s, v) => s + v, 0) / gaps.length;
    const gapVariance = gaps.reduce((s, v) => s + (v - avgGap) ** 2, 0) / gaps.length;
    const gapStdDev = Math.sqrt(gapVariance);
    const regularity = avgGap > 0 ? Math.max(0, 1 - gapStdDev / avgGap) : 0;

    const currentDelay = positions[0]; // draws since last appearance (0 = appeared in most recent)
    const predictedReturn = Math.max(0, Math.round(avgGap - currentDelay));
    const confidence = Math.min(1, regularity * (positions.length / draws.length) * 10);

    cycles.push({
      number: s.number,
      avgCycleLength: Math.round(avgGap * 10) / 10,
      currentDelay,
      predictedReturn,
      confidence: Math.round(confidence * 100) / 100,
      cycleRegularity: Math.round(regularity * 100) / 100,
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

  // 4. Numbers from same decade (all in range of 10)
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

  return patterns.sort((a, b) => b.rarity - a.rarity);
}

// ─── v2: Number Clustering ──────────────────────────────────────

function clusterNumbers(cooccurrences: CooccurrencePair[], config: LotteryConfig): NumberCluster[] {
  if (cooccurrences.length === 0) return [];

  // Simple greedy clustering based on co-occurrence
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

    // Expand cluster greedily
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
    hotStreaks: [], transitionAnalysis: { avgRepeatBetweenDraws: 0, repeatDistribution: [], mostRepeatedPairs: [] },
    cooccurrenceMatrix: [], cycleDetection: [], rarePatterns: [], numberClusters: [],
    summary: {
      mostCommonParity: "", avgSum: 0, sumStdDev: 0, avgConsecutives: 0,
      trendingUp: [], trendingDown: [], mostConsistent: [], overdueNumbers: [],
      avgRepeatsBetweenDraws: 0, strongestCluster: [], topCooccurrences: [],
    },
  };
}
