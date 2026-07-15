/**
 * StatisticsAnalyzer — análise estatística agregada dos jogos de um fechamento.
 * Puramente matemático; sem dependência de modalidade.
 */

export interface DistributionBucket {
  label: string;
  value: number;
  count: number;
  percent: number;
}

export interface ClosingStatisticsReport {
  gameCount: number;
  parity: { evenAvg: number; oddAvg: number; distribution: DistributionBucket[] };
  sum: { min: number; max: number; avg: number; stdDev: number; distribution: DistributionBucket[] };
  decades: DistributionBucket[]; // dezenas por dezena (1-10, 11-20, ...)
  gaps: { avg: number; max: number; distribution: DistributionBucket[] }; // gaps entre números consecutivos
  frequency: Array<{ number: number; count: number; percent: number }>;
  entropy: number; // Shannon (uniformidade da distribuição de números)
  coverageOfBase: { used: number; unused: number; usedPercent: number };
}

export function analyzeClosingStatistics(
  games: number[][],
  base: number[],
  totalNumbers: number,
): ClosingStatisticsReport {
  const n = games.length;
  if (n === 0) return emptyReport();

  const pick = games[0].length;

  // Frequency
  const freq = new Map<number, number>();
  for (const g of games) for (const num of g) freq.set(num, (freq.get(num) ?? 0) + 1);

  // Parity
  const evenCounts: number[] = [];
  const parityDist = new Map<number, number>();
  for (const g of games) {
    const e = g.filter(x => x % 2 === 0).length;
    evenCounts.push(e);
    parityDist.set(e, (parityDist.get(e) ?? 0) + 1);
  }
  const evenAvg = evenCounts.reduce((a, b) => a + b, 0) / n;

  // Sum
  const sums = games.map(g => g.reduce((a, b) => a + b, 0));
  const sumMin = Math.min(...sums);
  const sumMax = Math.max(...sums);
  const sumAvg = sums.reduce((a, b) => a + b, 0) / n;
  const sumVar = sums.reduce((acc, s) => acc + (s - sumAvg) ** 2, 0) / n;
  const sumStd = Math.sqrt(sumVar);

  // Sum distribution: 8 buckets between min/max
  const sumDist = bucketize(sums, 8, v => v.toFixed(0));

  // Decades
  const decadeCount = Math.ceil(totalNumbers / 10);
  const decades: DistributionBucket[] = [];
  for (let d = 0; d < decadeCount; d++) {
    const lo = d * 10 + 1;
    const hi = Math.min((d + 1) * 10, totalNumbers);
    let c = 0;
    for (const g of games) for (const num of g) if (num >= lo && num <= hi) c++;
    decades.push({
      label: `${lo}-${hi}`,
      value: d,
      count: c,
      percent: (c / (n * pick)) * 100,
    });
  }

  // Gaps
  const gapsAll: number[] = [];
  for (const g of games) {
    const s = [...g].sort((a, b) => a - b);
    for (let i = 1; i < s.length; i++) gapsAll.push(s[i] - s[i - 1]);
  }
  const gapAvg = gapsAll.length ? gapsAll.reduce((a, b) => a + b, 0) / gapsAll.length : 0;
  const gapMax = gapsAll.length ? Math.max(...gapsAll) : 0;
  const gapDist = bucketize(gapsAll, 6, v => v.toFixed(0));

  // Entropy (Shannon) sobre frequência normalizada
  const totalOccurrences = n * pick;
  let H = 0;
  for (const c of freq.values()) {
    const p = c / totalOccurrences;
    if (p > 0) H -= p * Math.log2(p);
  }
  const HMax = Math.log2(Math.max(1, freq.size));
  const entropy = HMax > 0 ? (H / HMax) * 100 : 0; // 0-100 (normalizado)

  const frequency = Array.from(freq.entries())
    .map(([number, count]) => ({ number, count, percent: (count / n) * 100 }))
    .sort((a, b) => b.count - a.count || a.number - b.number);

  const parityDistribution: DistributionBucket[] = Array.from(parityDist.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([even, count]) => ({
      label: `${even}P / ${pick - even}I`,
      value: even,
      count,
      percent: (count / n) * 100,
    }));

  const usedFromBase = base.filter(b => freq.has(b)).length;
  return {
    gameCount: n,
    parity: { evenAvg, oddAvg: pick - evenAvg, distribution: parityDistribution },
    sum: { min: sumMin, max: sumMax, avg: sumAvg, stdDev: sumStd, distribution: sumDist },
    decades,
    gaps: { avg: gapAvg, max: gapMax, distribution: gapDist },
    frequency,
    entropy,
    coverageOfBase: {
      used: usedFromBase,
      unused: base.length - usedFromBase,
      usedPercent: base.length > 0 ? (usedFromBase / base.length) * 100 : 0,
    },
  };
}

function bucketize(values: number[], count: number, fmt: (v: number) => string): DistributionBucket[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = Math.max(1, (max - min) / count);
  const buckets: DistributionBucket[] = [];
  for (let i = 0; i < count; i++) {
    const lo = min + i * step;
    const hi = i === count - 1 ? max : min + (i + 1) * step;
    const c = values.filter(v => v >= lo && (i === count - 1 ? v <= hi : v < hi)).length;
    buckets.push({
      label: `${fmt(lo)}–${fmt(hi)}`,
      value: (lo + hi) / 2,
      count: c,
      percent: (c / values.length) * 100,
    });
  }
  return buckets;
}

function emptyReport(): ClosingStatisticsReport {
  return {
    gameCount: 0,
    parity: { evenAvg: 0, oddAvg: 0, distribution: [] },
    sum: { min: 0, max: 0, avg: 0, stdDev: 0, distribution: [] },
    decades: [],
    gaps: { avg: 0, max: 0, distribution: [] },
    frequency: [],
    entropy: 0,
    coverageOfBase: { used: 0, unused: 0, usedPercent: 0 },
  };
}
