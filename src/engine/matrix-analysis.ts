/**
 * Matriz de Análise — Core scoring engine (v2)
 * Score = (0.30 × FreqNorm) + (0.25 × RecentNorm) + (0.20 × LowDelayNorm) + (0.15 × TrendNorm) + (0.10 × ConsistencyNorm)
 */
import { DrawResult } from "@/data/lotteries";

export interface MatrixRow {
  number: number;
  freqTotal: number;
  freqPercent: number;
  freqRecent10: number;
  freqRecent30: number;
  freqRecent50: number;
  currentDelay: number;
  avgDelay: number;
  peakStreak: number;
  trend: "up" | "stable" | "down";
  trendValue: number;
  consistency: number;
  score: number;
  rank: number;
  signal: "green" | "yellow" | "red";
}

export function computeMatrixAnalysis(draws: DrawResult[], totalNumbers: number): MatrixRow[] {
  if (draws.length === 0) return [];

  const total = draws.length;
  const freq = new Array(totalNumbers + 1).fill(0);
  const freq10 = new Array(totalNumbers + 1).fill(0);
  const freq30 = new Array(totalNumbers + 1).fill(0);
  const freq50 = new Array(totalNumbers + 1).fill(0);
  const lastSeen = new Array(totalNumbers + 1).fill(total);
  const appearances: number[][] = Array.from({ length: totalNumbers + 1 }, () => []);

  // Window frequencies for trend
  const w1 = new Array(totalNumbers + 1).fill(0); // last 10
  const w2 = new Array(totalNumbers + 1).fill(0); // 11-30
  const w3 = new Array(totalNumbers + 1).fill(0); // 31-60

  draws.forEach((draw, i) => {
    if (!draw || !Array.isArray(draw.numbers)) return;
    draw.numbers.forEach(n => {
      if (n < 1 || n > totalNumbers) return;
      freq[n]++;
      if (i < 10) freq10[n]++;
      if (i < 30) freq30[n]++;
      if (i < 50) freq50[n]++;
      if (i < lastSeen[n]) lastSeen[n] = i;
      appearances[n].push(i);

      if (i < 10) w1[n]++;
      else if (i < 30) w2[n]++;
      else if (i < 60) w3[n]++;
    });
  });

  // Raw values
  const rawRows: Omit<MatrixRow, "score" | "rank" | "signal">[] = [];
  for (let n = 1; n <= totalNumbers; n++) {
    const gaps: number[] = [];
    const sorted = [...appearances[n]].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
    if (sorted.length > 0) gaps.unshift(sorted[0]);

    const avgDelay = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : total;

    // Peak streak: max consecutive draws where number appeared
    let peakStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < total; i++) {
      if (appearances[n].includes(i)) {
        currentStreak++;
        if (currentStreak > peakStreak) peakStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }

    // Consistency: low stddev of gaps = high consistency
    let consistency = 0;
    if (gaps.length > 1) {
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const variance = gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length;
      const stddev = Math.sqrt(variance);
      // Invert: lower stddev = more consistent = higher value
      consistency = mean > 0 ? Math.max(0, 100 - (stddev / mean) * 100) : 0;
    }

    const w1Rate = w1[n] / 10;
    const w2Rate = w2[n] / 20;
    const w3Rate = w3[n] / 30;
    const trendValue = (w1Rate - w2Rate) * 50;
    const trend: "up" | "stable" | "down" = trendValue > 1 ? "up" : trendValue < -1 ? "down" : "stable";

    rawRows.push({
      number: n,
      freqTotal: freq[n],
      freqPercent: total > 0 ? (freq[n] / total) * 100 : 0,
      freqRecent10: freq10[n],
      freqRecent30: freq30[n],
      freqRecent50: freq50[n],
      currentDelay: lastSeen[n],
      avgDelay: Math.round(avgDelay * 10) / 10,
      peakStreak,
      trend,
      trendValue,
      consistency,
    });
  }

  // Normalize helper
  const normalize = (values: number[]): number[] => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map(v => ((v - min) / range) * 100);
  };

  const freqNorm = normalize(rawRows.map(r => r.freqTotal));
  const recentNorm = normalize(rawRows.map(r => r.freqRecent30));
  // Low delay → invert: higher delay = lower score
  const delays = rawRows.map(r => r.currentDelay);
  const maxDelay = Math.max(...delays) || 1;
  const lowDelayNorm = delays.map(d => ((maxDelay - d) / maxDelay) * 100);
  const trendNorm = normalize(rawRows.map(r => r.trendValue));
  const consistencyNorm = normalize(rawRows.map(r => r.consistency));

  // Compute scores (5 pillars)
  const scored: MatrixRow[] = rawRows.map((r, i) => ({
    ...r,
    score: Math.round(
      0.30 * freqNorm[i] +
      0.25 * recentNorm[i] +
      0.20 * lowDelayNorm[i] +
      0.15 * trendNorm[i] +
      0.10 * consistencyNorm[i]
    ),
    rank: 0,
    signal: "yellow" as const,
  }));

  // Rank by score desc
  scored.sort((a, b) => b.score - a.score);
  scored.forEach((r, i) => { r.rank = i + 1; });

  // Signal: top 30% green, bottom 30% red, rest yellow
  const greenThreshold = Math.ceil(totalNumbers * 0.3);
  const redThreshold = totalNumbers - Math.ceil(totalNumbers * 0.3);
  scored.forEach(r => {
    if (r.rank <= greenThreshold) r.signal = "green";
    else if (r.rank > redThreshold) r.signal = "red";
    else r.signal = "yellow";
  });

  return scored;
}

/**
 * Smart Unfolding: given N base numbers, generate balanced games of `pick` size
 */
export function generateUnfolding(
  baseNumbers: number[],
  pick: number,
  maxGames: number
): number[][] {
  if (baseNumbers.length < pick) return [];

  const games: number[][] = [];
  const coverage = new Map<number, number>(); // number -> times used
  baseNumbers.forEach(n => coverage.set(n, 0));

  for (let g = 0; g < maxGames; g++) {
    // Sort by least used first to balance coverage
    const sorted = [...baseNumbers].sort((a, b) => (coverage.get(a) || 0) - (coverage.get(b) || 0));
    
    // Pick first `pick` numbers from sorted (least used), then sort numerically
    const game = sorted.slice(0, pick).sort((a, b) => a - b);
    
    // Check for duplicates
    const key = game.join(",");
    if (games.some(g => g.join(",") === key)) {
      // Shuffle and retry with some randomness
      const shuffled = [...baseNumbers].sort(() => Math.random() - 0.5);
      const altGame = shuffled.slice(0, pick).sort((a, b) => a - b);
      const altKey = altGame.join(",");
      if (!games.some(g => g.join(",") === altKey)) {
        games.push(altGame);
        altGame.forEach(n => coverage.set(n, (coverage.get(n) || 0) + 1));
      }
    } else {
      games.push(game);
      game.forEach(n => coverage.set(n, (coverage.get(n) || 0) + 1));
    }
  }

  return games;
}

export function computeCoverage(games: number[][], baseNumbers: number[]): {
  totalCombinations: number;
  coveredNumbers: number;
  avgRepetition: number;
} {
  const used = new Set(games.flat());
  const counts = new Map<number, number>();
  games.flat().forEach(n => counts.set(n, (counts.get(n) || 0) + 1));
  const avgRepetition = counts.size > 0 
    ? Math.round([...counts.values()].reduce((a, b) => a + b, 0) / counts.size * 10) / 10 
    : 0;

  return {
    totalCombinations: games.length,
    coveredNumbers: used.size,
    avgRepetition,
  };
}
