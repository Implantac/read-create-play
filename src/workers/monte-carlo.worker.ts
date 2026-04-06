// ═══════════════════════════════════════════════════════
// Web Worker: Simulador Monte Carlo por Estratégias v3.0
// Bitset comparisons + O(1) variance + inline PRNG
// ═══════════════════════════════════════════════════════

// ─── Bitset ops (inline) ─────────────────────────────

function toBitset(numbers: number[]): Uint32Array {
  const bs = new Uint32Array(4);
  for (const n of numbers) {
    bs[(n - 1) >> 5] |= 1 << ((n - 1) & 31);
  }
  return bs;
}

function popcount32(x: number): number {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

function bitsetHits(a: Uint32Array, b: Uint32Array): number {
  return popcount32(a[0] & b[0]) + popcount32(a[1] & b[1]) +
         popcount32(a[2] & b[2]) + popcount32(a[3] & b[3]);
}

// ─── Inline strategy generation ──────────────────────

interface StatInput {
  number: number; frequency: number; percentage: number; lastSeen: number;
  trend: number; status: string; recentFreq: number; stdDevIntervals: number;
  momentum: number; cycleScore: number;
}

interface ConfigInput { id: string; name: string; numbers: number; pick: number; color: string; icon: string; }

function pickFromPool(pool: StatInput[], pick: number): number[] {
  const selected: number[] = [];
  const copy = [...pool];
  while (selected.length < pick && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    selected.push(copy[idx].number);
    copy.splice(idx, 1);
  }
  return selected.sort((a, b) => a - b);
}

function generateSmartDraw(stats: StatInput[], config: ConfigInput): number[] {
  const sorted = [...stats].sort((a, b) => {
    const scoreA = a.percentage * 0.3 + a.recentFreq * 0.3 + a.trend * 0.2 + a.cycleScore * 0.2;
    const scoreB = b.percentage * 0.3 + b.recentFreq * 0.3 + b.trend * 0.2 + b.cycleScore * 0.2;
    return scoreB - scoreA;
  });
  return pickFromPool(sorted.slice(0, Math.ceil(config.pick * 2.5)), config.pick);
}

function generateHotDraw(stats: StatInput[], config: ConfigInput): number[] {
  const hot = [...stats].filter(s => s.status === "hot").sort((a, b) => b.frequency - a.frequency);
  const pool = hot.length >= config.pick ? hot : [...stats].sort((a, b) => b.frequency - a.frequency);
  return pickFromPool(pool.slice(0, Math.ceil(config.pick * 2)), config.pick);
}

function generateColdDraw(stats: StatInput[], config: ConfigInput): number[] {
  const cold = [...stats].filter(s => s.status === "cold").sort((a, b) => a.frequency - b.frequency);
  const pool = cold.length >= config.pick ? cold : [...stats].sort((a, b) => a.frequency - b.frequency);
  return pickFromPool(pool.slice(0, Math.ceil(config.pick * 2)), config.pick);
}

function generateBalancedDraw(stats: StatInput[], config: ConfigInput): number[] {
  const hot = stats.filter(s => s.status === "hot");
  const cold = stats.filter(s => s.status === "cold");
  const neutral = stats.filter(s => s.status === "neutral");
  const hotPick = Math.ceil(config.pick * 0.4);
  const coldPick = Math.ceil(config.pick * 0.3);
  const neutralPick = config.pick - hotPick - coldPick;
  const pick = (arr: StatInput[], n: number) => [...arr].sort(() => Math.random() - 0.5).slice(0, n).map(s => s.number);
  const result = [...pick(hot, hotPick), ...pick(cold, coldPick), ...pick(neutral, neutralPick)];
  while (result.length < config.pick) {
    const n = Math.floor(Math.random() * config.numbers) + 1;
    if (!result.includes(n)) result.push(n);
  }
  return result.slice(0, config.pick).sort((a, b) => a - b);
}

function generateRandomDraw(config: ConfigInput): number[] {
  const pool = new Uint8Array(config.numbers);
  for (let i = 0; i < config.numbers; i++) pool[i] = i + 1;
  for (let i = 0; i < config.pick; i++) {
    const j = i + Math.floor(Math.random() * (config.numbers - i));
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  const result: number[] = [];
  for (let i = 0; i < config.pick; i++) result.push(pool[i]);
  return result.sort((a, b) => a - b);
}

function generateTrendDraw(stats: StatInput[], config: ConfigInput): number[] {
  return pickFromPool([...stats].sort((a, b) => b.trend - a.trend).slice(0, Math.ceil(config.pick * 2)), config.pick);
}

function generateCycleDraw(stats: StatInput[], config: ConfigInput): number[] {
  return pickFromPool([...stats].sort((a, b) => b.cycleScore - a.cycleScore).slice(0, Math.ceil(config.pick * 2)), config.pick);
}

function generateHybridDraw(stats: StatInput[], config: ConfigInput): number[] {
  const sorted = [...stats].sort((a, b) => {
    const sa = a.percentage * 0.2 + a.recentFreq * 0.2 + a.trend * 0.2 + a.cycleScore * 0.2 + a.momentum * 0.2;
    const sb = b.percentage * 0.2 + b.recentFreq * 0.2 + b.trend * 0.2 + b.cycleScore * 0.2 + b.momentum * 0.2;
    return sb - sa;
  });
  return pickFromPool(sorted.slice(0, Math.ceil(config.pick * 2.5)), config.pick);
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

// ─── Prize multipliers ──────────────────────────────

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

// ─── Worker handler ──────────────────────────────────

self.onmessage = (e: MessageEvent) => {
  const { type, job } = e.data;

  if (type === "run_monte_carlo") {
    const { stats, config, draws, simConfig } = job;
    const start = performance.now();
    const prizeMultipliers = getPrizeMultipliers(config.id, config.pick);
    const performances: any[] = [];
    const convergenceData: any[] = [];

    // Pre-compute draw bitsets ONCE for all strategies
    const drawBitsets = draws.map((d: any) => toBitset(d.numbers));
    const drawCount = drawBitsets.length;

    const strategiesToRun = simConfig.compareWithRandom
      ? [...new Set([...simConfig.strategies, "smart"])]
      : [...new Set(simConfig.strategies)];

    for (let si = 0; si < strategiesToRun.length; si++) {
      const strategy = strategiesToRun[si];
      const iterPerStrategy = Math.floor(simConfig.iterations / strategiesToRun.length);
      const label = STRATEGY_LABELS[strategy] || strategy;

      const hitDist: Record<number, number> = {};
      for (let i = 0; i <= config.pick; i++) hitDist[i] = 0;
      let totalHits = 0, bestHit = 0, hitSquaredSum = 0;
      const convergence: number[] = [];
      const sampleInterval = Math.max(1, Math.floor(iterPerStrategy / 50));

      for (let i = 0; i < iterPerStrategy; i++) {
        const bet = generateByStrategy(strategy, stats, config);
        const drawIdx = drawCount > 0 ? Math.floor(Math.random() * drawCount) : -1;

        let hits = 0;
        if (drawIdx >= 0) {
          const betBs = toBitset(bet);
          hits = bitsetHits(betBs, drawBitsets[drawIdx]);
        }

        hitDist[hits] = (hitDist[hits] || 0) + 1;
        totalHits += hits;
        hitSquaredSum += hits * hits;
        if (hits > bestHit) bestHit = hits;
        if ((i + 1) % sampleInterval === 0) convergence.push(totalHits / (i + 1));
      }

      convergence.forEach((avg, idx) => {
        convergenceData.push({ iteration: (idx + 1) * sampleInterval, avgHits: Math.round(avg * 1000) / 1000, strategy: label });
      });

      const avgHits = iterPerStrategy > 0 ? totalHits / iterPerStrategy : 0;

      // Hit rates via hitDist scan (no array expansion)
      let count4Plus = 0, count5Plus = 0;
      for (const [h, c] of Object.entries(hitDist)) {
        const hNum = Number(h);
        if (hNum >= 4) count4Plus += c;
        if (hNum >= 5) count5Plus += c;
      }
      const hitRate4Plus = iterPerStrategy > 0 ? count4Plus / iterPerStrategy : 0;
      const hitRate5Plus = iterPerStrategy > 0 ? count5Plus / iterPerStrategy : 0;
      const hitRateFull = iterPerStrategy > 0 ? (hitDist[config.pick] || 0) / iterPerStrategy : 0;

      let ev = 0;
      for (const [hits, count] of Object.entries(hitDist)) {
        ev += (prizeMultipliers[Number(hits)] || 0) * count;
      }
      ev = iterPerStrategy > 0 ? ev / iterPerStrategy : 0;

      // O(1) variance: Var = E[X²] - E[X]²
      const variance = iterPerStrategy > 0
        ? Math.max(0, hitSquaredSum / iterPerStrategy - avgHits * avgHits)
        : 0;
      const consistency = avgHits > 0 ? Math.max(0, 1 - Math.sqrt(variance) / avgHits) : 0;

      performances.push({
        strategy, label, totalGames: iterPerStrategy, hitDistribution: hitDist,
        avgHits: Math.round(avgHits * 1000) / 1000, bestHit,
        hitRate4Plus: Math.round(hitRate4Plus * 10000) / 100,
        hitRate5Plus: Math.round(hitRate5Plus * 10000) / 100,
        hitRateFull: Math.round(hitRateFull * 1000000) / 10000,
        expectedValue: Math.round(ev * 100) / 100,
        consistency: Math.round(consistency * 1000) / 1000,
      });

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
