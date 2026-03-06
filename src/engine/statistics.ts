import { DrawResult, LotteryConfig } from "@/data/lotteries";

export interface NumberStats {
  number: number;
  frequency: number;
  percentage: number;
  lastSeen: number; // draws ago
  recentFreq: number; // last 30 draws
  status: "hot" | "cold" | "normal";
}

export function computeFrequencyStats(draws: DrawResult[], totalNumbers: number): NumberStats[] {
  const freq = new Array(totalNumbers + 1).fill(0);
  const lastSeen = new Array(totalNumbers + 1).fill(draws.length);
  const recentFreq = new Array(totalNumbers + 1).fill(0);
  const recent = 30;

  draws.forEach((draw, i) => {
    draw.numbers.forEach(n => {
      freq[n]++;
      if (i < lastSeen[n]) lastSeen[n] = i;
      if (i < recent) recentFreq[n]++;
    });
  });

  const total = draws.length;
  const avgFreq = draws.length > 0 ? draws[0].numbers.length / totalNumbers : 0;

  const stats: NumberStats[] = [];
  for (let n = 1; n <= totalNumbers; n++) {
    const pct = total > 0 ? (freq[n] / total) * 100 : 0;
    const avgPct = avgFreq * 100;
    let status: "hot" | "cold" | "normal" = "normal";
    if (pct > avgPct * 1.15) status = "hot";
    else if (pct < avgPct * 0.85) status = "cold";

    stats.push({
      number: n,
      frequency: freq[n],
      percentage: pct,
      lastSeen: lastSeen[n],
      recentFreq: recentFreq[n],
      status,
    });
  }
  return stats;
}

export interface PairStats {
  even: number;
  odd: number;
}

export function computeParityDistribution(draws: DrawResult[]): PairStats[] {
  return draws.slice(0, 50).map(d => ({
    even: d.numbers.filter(n => n % 2 === 0).length,
    odd: d.numbers.filter(n => n % 2 !== 0).length,
  }));
}

export function computeSumDistribution(draws: DrawResult[]): { concurso: number; sum: number }[] {
  return draws.slice(0, 50).map(d => ({
    concurso: d.concurso,
    sum: d.numbers.reduce((a, b) => a + b, 0),
  }));
}

export function generateSmartBet(stats: NumberStats[], pick: number): number[] {
  // Weighted selection: hot numbers have higher weight
  const weighted = stats.map(s => ({
    number: s.number,
    weight: s.status === "hot" ? 3 : s.status === "cold" ? 1 : 2,
  }));

  const selected: number[] = [];
  const pool = [...weighted];

  while (selected.length < pick && pool.length > 0) {
    const totalWeight = pool.reduce((a, b) => a + b.weight, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        selected.push(pool[i].number);
        pool.splice(i, 1);
        break;
      }
    }
  }

  return selected.sort((a, b) => a - b);
}

export function runMonteCarloSimulation(
  config: LotteryConfig,
  stats: NumberStats[],
  iterations: number = 10000
): { number: number; wins: number }[] {
  const winCount = new Array(config.numbers + 1).fill(0);

  for (let i = 0; i < iterations; i++) {
    const bet = generateSmartBet(stats, config.pick);
    // Simulate a random draw
    const draw: number[] = [];
    while (draw.length < config.pick) {
      const n = Math.floor(Math.random() * config.numbers) + 1;
      if (!draw.includes(n)) draw.push(n);
    }
    // Count matches
    bet.forEach(n => {
      if (draw.includes(n)) winCount[n]++;
    });
  }

  return Array.from({ length: config.numbers }, (_, i) => ({
    number: i + 1,
    wins: winCount[i + 1],
  })).sort((a, b) => b.wins - a.wins);
}
