import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "./statistics";

export interface PatternReport {
  parityPatterns: ParityPattern[];
  sumPatterns: SumPattern[];
  consecutivePatterns: ConsecutivePattern[];
  frequencyTrends: FrequencyTrend[];
  spatialDistribution: SpatialDistribution;
  hotStreaks: HotStreak[];
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
  balance: number; // 0-100, higher = more balanced
}

export interface HotStreak {
  number: number;
  streakLength: number;
  startDraw: number;
  endDraw: number;
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
}

export function detectPatterns(
  draws: DrawResult[],
  stats: NumberStats[],
  config: LotteryConfig,
  drawCount: number = 200
): PatternReport {
  const selected = draws.slice(0, Math.min(drawCount, draws.length)).filter(d => d && Array.isArray(d.numbers));

  // 1. Parity patterns
  const parityCounts = new Map<string, number>();
  selected.forEach(d => {
    const evens = d.numbers.filter(n => n % 2 === 0).length;
    const odds = d.numbers.length - evens;
    const key = `${evens}/${odds}`;
    parityCounts.set(key, (parityCounts.get(key) || 0) + 1);
  });
  const parityPatterns: ParityPattern[] = [...parityCounts.entries()]
    .map(([key, count]) => {
      const [evens, odds] = key.split("/").map(Number);
      return { evens, odds, count, percentage: Math.round(count / selected.length * 10000) / 100 };
    })
    .sort((a, b) => b.count - a.count);

  // 2. Sum patterns
  const sums = selected.map(d => d.numbers.reduce((s, n) => s + n, 0));
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
      rangeLabel: `${min}-${max}`,
      min, max, count,
      percentage: Math.round(count / sums.length * 10000) / 100,
    });
  }

  // 3. Consecutive patterns
  const consecutiveCounts: Record<number, number> = {};
  selected.forEach(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    let maxConsec = 1, curConsec = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) {
        curConsec++;
        maxConsec = Math.max(maxConsec, curConsec);
      } else {
        curConsec = 1;
      }
    }
    consecutiveCounts[maxConsec] = (consecutiveCounts[maxConsec] || 0) + 1;
  });
  const consecutivePatterns: ConsecutivePattern[] = Object.entries(consecutiveCounts)
    .map(([k, v]) => ({
      consecutiveCount: Number(k),
      occurrences: v,
      percentage: Math.round(v / selected.length * 10000) / 100,
    }))
    .sort((a, b) => a.consecutiveCount - b.consecutiveCount);

  // 4. Frequency trends
  const frequencyTrends: FrequencyTrend[] = stats.map(s => {
    let last10 = 0, last30 = 0, last100 = 0;
    selected.forEach((d, i) => {
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
      number: s.number,
      last10Freq: last10,
      last30Freq: last30,
      last100Freq: last100,
      totalFreq: s.frequency,
      trendDirection: direction,
      momentum: Math.round((ratio10 - ratio30) * 100) / 100,
    };
  }).sort((a, b) => b.momentum - a.momentum);

  // 5. Spatial distribution
  const sectorCount = Math.min(5, Math.ceil(config.numbers / 10));
  const sectorSize = Math.ceil(config.numbers / sectorCount);
  const sectorData = Array.from({ length: sectorCount }, (_, i) => {
    const min = i * sectorSize + 1;
    const max = Math.min((i + 1) * sectorSize, config.numbers);
    const counts = selected.map(d => d.numbers.filter(n => n >= min && n <= max).length);
    const avg = counts.reduce((s, v) => s + v, 0) / counts.length;
    const variance = counts.reduce((s, v) => s + (v - avg) ** 2, 0) / counts.length;
    return { label: `${min}-${max}`, min, max, avgCount: Math.round(avg * 100) / 100, stdDev: Math.round(Math.sqrt(variance) * 100) / 100 };
  });

  const idealAvg = config.pick / sectorCount;
  const balanceDeviation = sectorData.reduce((s, sec) => s + Math.abs(sec.avgCount - idealAvg), 0) / sectorCount;
  const balance = Math.round(Math.max(0, 100 - balanceDeviation / idealAvg * 100));

  // 6. Hot streaks
  const hotStreaks: HotStreak[] = [];
  for (const s of stats) {
    let streak = 0, maxStreak = 0, startIdx = 0, bestStart = 0, bestEnd = 0;
    for (let i = selected.length - 1; i >= 0; i--) {
      if (selected[i].numbers.includes(s.number)) {
        if (streak === 0) startIdx = i;
        streak++;
        if (streak > maxStreak) {
          maxStreak = streak;
          bestStart = startIdx;
          bestEnd = i;
        }
      } else {
        streak = 0;
      }
    }
    if (maxStreak >= 3) {
      hotStreaks.push({
        number: s.number,
        streakLength: maxStreak,
        startDraw: selected[bestStart]?.concurso || 0,
        endDraw: selected[bestEnd]?.concurso || 0,
      });
    }
  }
  hotStreaks.sort((a, b) => b.streakLength - a.streakLength);

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
    spatialDistribution: { sectors: sectorData, balance },
    hotStreaks: hotStreaks.slice(0, 15),
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
    },
  };
}
