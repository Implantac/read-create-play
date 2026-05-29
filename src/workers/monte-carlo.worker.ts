// ═══════════════════════════════════════════════════════
// Web Worker: Simulador Monte Carlo por Estratégias
// Runs strategy-based Monte Carlo off the main thread
// ═══════════════════════════════════════════════════════

// ─── Inline strategy generation (no module imports in workers) ───

interface StatInput {
  number: number; frequency: number; percentage: number; lastSeen: number;
  trend: number; status: string; recentFreq: number; stdDevIntervals: number;
  momentum: number; cycleScore: number;
}

interface ConfigInput { id: string; name: string; numbers: number; pick: number; color: string; icon: string; }
interface DrawInput { concurso: number; date: string; numbers: number[]; }

function generateSmartDraw(stats: StatInput[], config: ConfigInput): number[] {
  const sorted = [...stats].sort((a, b) => {
    const scoreA = a.percentage * 0.3 + a.recentFreq * 0.3 + a.trend * 0.2 + a.cycleScore * 0.2;
    const scoreB = b.percentage * 0.3 + b.recentFreq * 0.3 + b.trend * 0.2 + b.cycleScore * 0.2;
    return scoreB - scoreA;
  });
  const pool = sorted.slice(0, Math.min(config.numbers, Math.ceil(config.pick * 2.5)));
  const selected: number[] = [];
  while (selected.length < config.pick && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx].number);
    pool.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

function generateHotDraw(stats: StatInput[], config: ConfigInput): number[] {
  const hot = [...stats].filter(s => s.status === "hot").sort((a, b) => b.frequency - a.frequency);
  const pool = hot.length >= config.pick ? hot : [...stats].sort((a, b) => b.frequency - a.frequency);
  const selected: number[] = [];
  const candidates = pool.slice(0, Math.ceil(config.pick * 2));
  while (selected.length < config.pick && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    selected.push(candidates[idx].number);
    candidates.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

function generateColdDraw(stats: StatInput[], config: ConfigInput): number[] {
  const cold = [...stats].filter(s => s.status === "cold").sort((a, b) => a.frequency - b.frequency);
  const pool = cold.length >= config.pick ? cold : [...stats].sort((a, b) => a.frequency - b.frequency);
  const candidates = pool.slice(0, Math.ceil(config.pick * 2));
  const selected: number[] = [];
  while (selected.length < config.pick && candidates.length > 0) {
    const idx = Math.floor(Math.random() * candidates.length);
    selected.push(candidates[idx].number);
    candidates.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

function generateBalancedDraw(stats: StatInput[], config: ConfigInput): number[] {
  const hot = stats.filter(s => s.status === "hot");
  const cold = stats.filter(s => s.status === "cold");
  const neutral = stats.filter(s => s.status === "neutral");
  const hotPick = Math.ceil(config.pick * 0.4);
  const coldPick = Math.ceil(config.pick * 0.3);
  const neutralPick = config.pick - hotPick - coldPick;
  const pick = (arr: StatInput[], n: number) => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n).map(s => s.number);
  };
  const result = [...pick(hot, hotPick), ...pick(cold, coldPick), ...pick(neutral, neutralPick)];
  while (result.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!result.includes(n)) result.push(n);
  }
  return result.slice(0, config.pick).sort((a, b) => a - b);
}

function generateRandomDraw(config: ConfigInput): number[] {
  const nums: number[] = [];
  while (nums.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums.sort((a, b) => a - b);
}

function generateTrendDraw(stats: StatInput[], config: ConfigInput): number[] {
  const sorted = [...stats].sort((a, b) => b.trend - a.trend);
  const pool = sorted.slice(0, Math.ceil(config.pick * 2));
  const selected: number[] = [];
  while (selected.length < config.pick && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx].number);
    pool.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

function generateCycleDraw(stats: StatInput[], config: ConfigInput): number[] {
  const sorted = [...stats].sort((a, b) => b.cycleScore - a.cycleScore);
  const pool = sorted.slice(0, Math.ceil(config.pick * 2));
  const selected: number[] = [];
  while (selected.length < config.pick && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx].number);
    pool.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

function generateHybridDraw(stats: StatInput[], config: ConfigInput): number[] {
  const sorted = [...stats].sort((a, b) => {
    const sa = a.percentage * 0.2 + a.recentFreq * 0.2 + a.trend * 0.2 + a.cycleScore * 0.2 + a.momentum * 0.2;
    const sb = b.percentage * 0.2 + b.recentFreq * 0.2 + b.trend * 0.2 + b.cycleScore * 0.2 + b.momentum * 0.2;
    return sb - sa;
  });
  const pool = sorted.slice(0, Math.ceil(config.pick * 2.5));
  const selected: number[] = [];
  while (selected.length < config.pick && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool[idx].number);
    pool.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

function generateByStrategy(strategy: string, stats: StatInput[], config: ConfigInput): number[] {
  switch (strategy) {
    case "smart": return generateSmartDraw(stats, config);
    case "hot": return generateHotDraw(stats, config);
    case "cold": return generateColdDraw(stats, config);
    case "balanced": return generateBalancedDraw(stats, config);
    case "trend": return generateTrendDraw(stats, config);
    case "cycle": return generateCycleDraw(stats, config);
    case "hybrid": return generateHybridDraw(stats, config);
    default: return generateSmartDraw(stats, config);
  }
}

// ─── Worker job/result typing (minimal, no runtime change) ───

type MonteCarloJob = {
  type: "run_monte_carlo";
  stats: StatInput[];
  config: ConfigInput;
  draws: Array<{ concurso: number; date: string; numbers: number[] }>;
  simConfig: {
    iterations: number;
    strategies: string[];
    compareWithRandom?: boolean;
  };
};

type MonteCarloProgress = {
  type: "progress";
  data: { completed: number; total: number; strategy: string };
};

type MonteCarloResult = {
  type: "result";
  data: {
    totalIterations: number;
    elapsedMs: number;
    performances: Array<{
      strategy: string;
      label: string;
      totalGames: number;
      hitDistribution: Record<number, number>;
      avgHits: number;
      bestHit: number;
      hitRate4Plus: number;
      hitRate5Plus: number;
      hitRateFull: number;
      expectedValue: number;
      consistency: number;
    }>;
    convergenceData: Array<{ iteration: number; avgHits: number; strategy: string }>;
    yearlyProjection: Array<{
      strategy: string;
      gamesPerYear: number;
      expectedHits4Plus: number;
      expectedHits5Plus: number;
      expectedFullHits: number;
      roi: number;
    }>;
  };
};

type WorkerRunMCTypedMsg = { type: "run_monte_carlo"; job: MonteCarloJob };


// ─── Simulation logic ───

function countHits(bet: number[], draw: number[]): number {
  let hits = 0;
  const drawSet = new Set(draw);
  for (const n of bet) { if (drawSet.has(n)) hits++; }
  return hits;
}

function getPrizeMultipliers(lotteryId: string, pick: number): Record<number, number> {
  const base: Record<number, number> = {};
  for (let i = 0; i <= pick; i++) base[i] = 0;
  switch (lotteryId) {
    case "megasena": base[4] = 50; base[5] = 5000; base[6] = 500000; break;
    case "lotofacil": base[11] = 5; base[12] = 10; base[13] = 25; base[14] = 1500; base[15] = 100000; break;
    case "quina": base[2] = 1; base[3] = 5; base[4] = 200; base[5] = 50000; break;
    case "lotomania": base[0] = 5; base[15] = 10; base[16] = 25; base[17] = 100; base[18] = 1000; base[19] = 20000; base[20] = 500000; break;
    case "duplasena": base[3] = 3; base[4] = 50; base[5] = 5000; base[6] = 300000; break;
    case "timemania": base[3] = 2; base[4] = 10; base[5] = 50; base[6] = 500; base[7] = 50000; break;
    case "diadesorte": base[4] = 10; base[5] = 50; base[6] = 2000; base[7] = 200000; break;
    case "supersete": base[3] = 5; base[4] = 20; base[5] = 200; base[6] = 10000; base[7] = 500000; break;
    default: base[pick - 2] = 10; base[pick - 1] = 1000; base[pick] = 100000;
  }
  return base;
}

const STRATEGY_LABELS: Record<string, string> = {
  smart: "Inteligente", hot: "Quentes", cold: "Frias", balanced: "Equilibrada",
  trend: "Tendência", cycle: "Ciclo", hybrid: "Híbrida", ml: "IA Ensemble",
  fibonacci: "Fibonacci", primes: "Primos", golden: "Razão Áurea",
  pattern: "Padrão", lowDelay: "Baixo Atraso", sectors: "Setores",
};

self.onmessage = (e: MessageEvent) => {
  const { type, job } = e.data as WorkerRunMCTypedMsg;

  if (type === "run_monte_carlo") {
    const { stats, config, draws, simConfig } = job;

    const start = performance.now();
    const prizeMultipliers = getPrizeMultipliers(config.id, config.pick);
    const performances: any[] = [];
    const convergenceData: any[] = [];

    const strategiesToRun = simConfig.compareWithRandom
      ? [...new Set([...simConfig.strategies, "smart"])]
      : [...new Set(simConfig.strategies)];

    for (let si = 0; si < strategiesToRun.length; si++) {
      const strategy = strategiesToRun[si];
      const iterPerStrategy = Math.floor(simConfig.iterations / strategiesToRun.length);
      const label = STRATEGY_LABELS[strategy] || strategy;

      const hitDist: Record<number, number> = {};
      for (let i = 0; i <= config.pick; i++) hitDist[i] = 0;
      let totalHits = 0, bestHit = 0;
      const convergence: number[] = [];
      const sampleInterval = Math.max(1, Math.floor(iterPerStrategy / 50));

      for (let i = 0; i < iterPerStrategy; i++) {
        const bet = generateByStrategy(strategy, stats, config);
        const draw = draws.length > 0 ? draws[Math.floor(Math.random() * draws.length)].numbers : generateRandomDraw(config);
        const hits = countHits(bet, draw);
        hitDist[hits] = (hitDist[hits] || 0) + 1;
        totalHits += hits;
        if (hits > bestHit) bestHit = hits;
        if ((i + 1) % sampleInterval === 0) convergence.push(totalHits / (i + 1));
      }

      convergence.forEach((avg, idx) => {
        convergenceData.push({ iteration: (idx + 1) * sampleInterval, avgHits: Math.round(avg * 1000) / 1000, strategy: label });
      });

      const avgHits = totalHits / iterPerStrategy;
      const hitRate4Plus = Object.entries(hitDist).filter(([h]) => Number(h) >= 4).reduce((s, [, c]) => s + c, 0) / iterPerStrategy;
      const hitRate5Plus = Object.entries(hitDist).filter(([h]) => Number(h) >= 5).reduce((s, [, c]) => s + c, 0) / iterPerStrategy;
      const hitRateFull = (hitDist[config.pick] || 0) / iterPerStrategy;

      let ev = 0;
      for (const [hits, count] of Object.entries(hitDist)) { ev += (prizeMultipliers[Number(hits)] || 0) * count; }
      ev /= iterPerStrategy;

      const hitValues = Object.entries(hitDist).flatMap(([h, c]) => Array(c).fill(Number(h)));
      const mean = avgHits;
      const variance = hitValues.reduce((s, v) => s + (v - mean) ** 2, 0) / hitValues.length;
      const consistency = mean > 0 ? Math.max(0, 1 - Math.sqrt(variance) / mean) : 0;

      performances.push({
        strategy, label, totalGames: iterPerStrategy, hitDistribution: hitDist,
        avgHits: Math.round(avgHits * 1000) / 1000, bestHit,
        hitRate4Plus: Math.round(hitRate4Plus * 10000) / 100,
        hitRate5Plus: Math.round(hitRate5Plus * 10000) / 100,
        hitRateFull: Math.round(hitRateFull * 1000000) / 10000,
        expectedValue: Math.round(ev * 100) / 100,
        consistency: Math.round(consistency * 1000) / 1000,
      });

      // Progress per strategy
      self.postMessage({ type: "progress", data: { completed: si + 1, total: strategiesToRun.length, strategy: label } });
    }

    performances.sort((a, b) => b.expectedValue - a.expectedValue);

    const gamesPerYear = 156;
    const yearlyProjection = performances.map((p: any) => ({
      strategy: p.label, gamesPerYear,
      expectedHits4Plus: Math.round(p.hitRate4Plus / 100 * gamesPerYear * 10) / 10,
      expectedHits5Plus: Math.round(p.hitRate5Plus / 100 * gamesPerYear * 10) / 10,
      expectedFullHits: Math.round(p.hitRateFull / 100 * gamesPerYear * 10000) / 10000,
      roi: Math.round(p.expectedValue * 100) / 100,
    }));

    self.postMessage({
      type: "result",
      data: {
        totalIterations: simConfig.iterations,
        elapsedMs: Math.round(performance.now() - start),
        performances, convergenceData, yearlyProjection,
      },
    });
  }
};
