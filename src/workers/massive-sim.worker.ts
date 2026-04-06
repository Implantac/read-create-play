// ═══════════════════════════════════════════════════════
// Web Worker: Motor de Simulação Massiva v2.0
// Runs bitset simulation off the main thread
// ═══════════════════════════════════════════════════════

// ─── Inline PRNG (can't import from main thread modules) ───
let _seed = Date.now() | 0;

function seedRNG(s: number): void {
  _seed = s | 0;
}

function fastRandom(): number {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return (_seed >>> 0) / 4294967296;
}

function fastRandInt(max: number): number {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return ((_seed >>> 0) % max);
}

function fastGenerateDraw(maxNumber: number, pick: number, pool: Uint8Array): Uint8Array {
  for (let i = 0; i < maxNumber; i++) pool[i] = i + 1;
  for (let i = 0; i < pick; i++) {
    const j = i + fastRandInt(maxNumber - i);
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
  }
  const result = new Uint8Array(pick);
  for (let i = 0; i < pick; i++) result[i] = pool[i];
  result.sort();
  return result;
}

function fastWeightedDraw(weights: Float32Array, pick: number): Uint8Array {
  const n = weights.length;
  const selected = new Uint8Array(pick);
  const used = new Uint8Array(n);
  const cumulative = new Float32Array(n);
  let count = 0;

  while (count < pick) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      if (used[i]) { cumulative[i] = total; } else { total += weights[i]; cumulative[i] = total; }
    }
    if (total <= 0) {
      for (let i = 0; i < n && count < pick; i++) {
        if (!used[i]) { selected[count++] = i + 1; used[i] = 1; }
      }
      break;
    }
    const r = fastRandom() * total;
    for (let i = 0; i < n; i++) {
      if (!used[i] && cumulative[i] >= r) { selected[count++] = i + 1; used[i] = 1; break; }
    }
  }
  selected.sort();
  return selected;
}

// ─── Bitset ops ───
function toBitset(numbers: number[]): Uint32Array {
  const bs = new Uint32Array(4);
  for (const n of numbers) { bs[(n - 1) >> 5] |= (1 << ((n - 1) & 31)); }
  return bs;
}

function bitsetIntersectionCount(a: Uint32Array, b: Uint32Array): number {
  let count = 0;
  for (let i = 0; i < 4; i++) {
    let v = a[i] & b[i];
    v = v - ((v >> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    count += (((v + (v >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
  }
  return count;
}

// ─── Pattern analysis ───
function analyzePattern(numbers: number[], maxNumber: number) {
  let evenCount = 0, sum = 0, consecutivePairs = 0, clusters = 1;
  for (let i = 0; i < numbers.length; i++) {
    const n = numbers[i]; sum += n;
    if (n % 2 === 0) evenCount++;
    if (i > 0) {
      if (numbers[i] - numbers[i - 1] === 1) consecutivePairs++;
      else if (numbers[i] - numbers[i - 1] > 3) clusters++;
    }
  }
  return { evenCount, oddCount: numbers.length - evenCount, sum, consecutivePairs, rangeSpread: numbers[numbers.length - 1] - numbers[0], clusters };
}

function getPrizeThreshold(lotteryId: string, pick: number): number {
  const t: Record<string, number> = { megasena: 4, lotofacil: 11, quina: 2, lotomania: 15, duplasena: 3, timemania: 3, diadesorte: 4, supersete: 3 };
  return t[lotteryId] ?? Math.max(2, pick - 3);
}

// ─── Weight building ───
interface StatInput { percentage: number; recentFreq: number; cycleScore: number; trend: number; momentum: number; lastSeen: number; }

function buildWeights(stats: StatInput[], numCount: number, mode: string): Float32Array {
  const w = new Float32Array(numCount);
  if (mode === "random") { for (let i = 0; i < numCount; i++) w[i] = 1; return w; }
  for (let i = 0; i < numCount; i++) {
    const s = stats[i];
    if (!s) { w[i] = 1; continue; }
    if (mode === "statistical") {
      w[i] = s.percentage * 0.3 + s.recentFreq * 0.4 + s.cycleScore * 0.3;
    } else if (mode === "ai_weighted") {
      const tb = s.trend > 0 ? 1 + s.trend * 0.5 : 1;
      const mb = s.momentum > 0 ? 1 + s.momentum * 0.3 : 1;
      const cb = s.cycleScore > 0.5 ? 1 + (s.cycleScore - 0.5) : 1;
      const rb = s.lastSeen < 5 ? 1.2 : s.lastSeen > 15 ? 0.8 : 1;
      w[i] = s.percentage * tb * mb * cb * rb;
    } else {
      const base = s.percentage * 0.25 + s.recentFreq * 0.25;
      const trend = s.trend > 0 ? 1 + s.trend * 0.3 : 1;
      const cycle = 1 + s.cycleScore * 0.2;
      w[i] = base * trend * cycle;
    }
    w[i] = Math.max(0.01, w[i]);
  }
  return w;
}

// ─── Insights ───
function generatePatternInsights(games: any[], config: any) {
  if (games.length === 0) return [];
  const insights: any[] = [];
  const n = games.length;

  const avgEven = games.reduce((s: number, g: any) => s + g.evenCount, 0) / n;
  const evenRatio = avgEven / config.pick;
  insights.push({ label: "Equilíbrio Par/Ímpar", description: `Jogos top têm em média ${avgEven.toFixed(1)} pares e ${(config.pick - avgEven).toFixed(1)} ímpares`, value: `${(evenRatio * 100).toFixed(0)}% / ${((1 - evenRatio) * 100).toFixed(0)}%`, trend: Math.abs(evenRatio - 0.5) < 0.1 ? "positive" : "neutral" });

  const avgSum = games.reduce((s: number, g: any) => s + g.sum, 0) / n;
  const minSum = Math.min(...games.map((g: any) => g.sum));
  const maxSum = Math.max(...games.map((g: any) => g.sum));
  insights.push({ label: "Soma das Dezenas", description: `Faixa ideal: ${minSum} a ${maxSum}`, value: `Média: ${avgSum.toFixed(0)}`, trend: "neutral" });

  const avgConsec = games.reduce((s: number, g: any) => s + g.consecutivePairs, 0) / n;
  insights.push({ label: "Pares Consecutivos", description: `Jogos eficientes têm ~${avgConsec.toFixed(1)} pares consecutivos`, value: avgConsec.toFixed(1), trend: avgConsec > 0.5 && avgConsec < 3 ? "positive" : "neutral" });

  const avgSpread = games.reduce((s: number, g: any) => s + g.rangeSpread, 0) / n;
  insights.push({ label: "Cobertura de Faixa", description: `Amplitude média dos jogos top`, value: `${avgSpread.toFixed(0)} de ${config.numbers}`, trend: avgSpread / config.numbers > 0.6 ? "positive" : "negative" });

  const numFreq = new Map<number, number>();
  for (const g of games) { for (const num of g.numbers) { numFreq.set(num, (numFreq.get(num) || 0) + 1); } }
  const topNums = [...numFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  insights.push({ label: "Dezenas Mais Frequentes nos Top", description: `Números que aparecem mais nos jogos de melhor desempenho`, value: topNums.map(([n]) => n.toString().padStart(2, "0")).join(", "), trend: "positive" });
  const bottomNums = [...numFreq.entries()].sort((a, b) => a[1] - b[1]).slice(0, 5);
  insights.push({ label: "Dezenas Raras nos Top Games", description: `Números que pouco aparecem nos jogos de melhor desempenho`, value: bottomNums.map(([n]) => n.toString().padStart(2, "0")).join(", "), trend: "negative" });

  return insights;
}

function computeDistributionSummary(games: any[], drawCount: number) {
  if (games.length === 0) return { avgSum: 0, avgEvenRatio: 0, avgConsecutive: 0, avgSpread: 0, bestHitOverall: 0, avgPrizeRate: 0 };
  const n = games.length;
  return {
    avgSum: Math.round(games.reduce((s: number, g: any) => s + g.sum, 0) / n),
    avgEvenRatio: Math.round((games.reduce((s: number, g: any) => s + g.evenCount / (g.evenCount + g.oddCount), 0) / n) * 100) / 100,
    avgConsecutive: Math.round((games.reduce((s: number, g: any) => s + g.consecutivePairs, 0) / n) * 10) / 10,
    avgSpread: Math.round(games.reduce((s: number, g: any) => s + g.rangeSpread, 0) / n),
    bestHitOverall: Math.max(...games.map((g: any) => g.bestHit)),
    avgPrizeRate: Math.round((games.reduce((s: number, g: any) => s + g.prizeCount / drawCount, 0) / n) * 10000) / 100,
  };
}

// ─── Binary insert for top-N (avoids O(N log N) full sort) ───
function binaryInsert(arr: any[], item: any, maxLen: number): void {
  const score = item.score;
  // Find insertion point (descending order)
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid].score > score) lo = mid + 1;
    else hi = mid;
  }
  if (lo < maxLen) {
    arr.splice(lo, 0, item);
    if (arr.length > maxLen) arr.length = maxLen;
  }
}

// ─── Main simulation ───
function runBatch(job: any) {
  const { config, draws, stats, totalGames, mode, topN } = job;
  if (draws.length === 0) return { topGames: [], totalGenerated: 0, totalEvaluated: 0, elapsedMs: 0, opsPerSecond: 0, patternInsights: [], distributionSummary: { avgSum: 0, avgEvenRatio: 0, avgConsecutive: 0, avgSpread: 0, bestHitOverall: 0, avgPrizeRate: 0 } };

  const drawBitsets = draws.map((d: any) => toBitset(d.numbers));
  const drawCount = draws.length;
  const prizeThreshold = getPrizeThreshold(config.id, config.pick);
  const weights = buildWeights(stats, config.numbers, mode);
  const pool = new Uint8Array(config.numbers);
  seedRNG(Date.now() | 0);

  const topGames: any[] = [];
  let minTopScore = -Infinity;
  let totalEvaluated = 0;
  const start = performance.now();

  for (let g = 0; g < totalGames; g++) {
    let gameNumbers: number[];
    if (mode === "random") {
      gameNumbers = Array.from(fastGenerateDraw(config.numbers, config.pick, pool));
    } else {
      gameNumbers = Array.from(fastWeightedDraw(weights, config.pick));
    }

    const gameBitset = toBitset(gameNumbers);
    let totalHits = 0, bestHit = 0, prizeCount = 0, hitSquaredSum = 0;

    // Use typed array for hit distribution (faster than object)
    const hitDistArr = new Uint32Array(config.pick + 1);

    for (let d = 0; d < drawCount; d++) {
      const hits = bitsetIntersectionCount(gameBitset, drawBitsets[d]);
      hitDistArr[hits]++;
      totalHits += hits;
      hitSquaredSum += hits * hits;
      if (hits > bestHit) bestHit = hits;
      if (hits >= prizeThreshold) prizeCount++;
    }
    totalEvaluated += drawCount;

    const avgHits = totalHits / drawCount;
    const variance = (hitSquaredSum / drawCount) - (avgHits * avgHits);
    const stability = Math.sqrt(Math.max(0, variance));
    const pattern = analyzePattern(gameNumbers, config.numbers);
    const score = avgHits * 30 + bestHit * 20 + (prizeCount / drawCount) * 100 * 25 + (1 / (1 + stability)) * 15 + (pattern.rangeSpread / config.numbers) * 10;

    if (topGames.length < topN || score > minTopScore) {
      // Convert typed array to object only for stored games
      const hitDist: Record<number, number> = {};
      for (let h = 0; h <= config.pick; h++) hitDist[h] = hitDistArr[h];

      const game = { numbers: gameNumbers, totalHits, avgHits: Math.round(avgHits * 1000) / 1000, bestHit, prizeCount, hitDistribution: hitDist, stability: Math.round(stability * 1000) / 1000, score: Math.round(score * 100) / 100, ...pattern };

      binaryInsert(topGames, game, topN);
      minTopScore = topGames.length >= topN ? topGames[topGames.length - 1].score : -Infinity;
    }
  }

  const elapsedMs = Math.round(performance.now() - start);
  return { topGames, totalGenerated: totalGames, totalEvaluated, elapsedMs, opsPerSecond: Math.round(totalEvaluated / (elapsedMs / 1000)), patternInsights: generatePatternInsights(topGames, config), distributionSummary: computeDistributionSummary(topGames, drawCount) };
}

// ─── Worker message handler ───
self.onmessage = (e: MessageEvent) => {
  const { type, job } = e.data;

  if (type === "run_massive_sim") {
    const { totalGames, batchSize } = job;
    const chunks = Math.ceil(totalGames / batchSize);
    const allTopGames: any[] = [];
    let totalEval = 0;
    const startTime = performance.now();

    for (let c = 0; c < chunks; c++) {
      const chunkGames = Math.min(batchSize, totalGames - c * batchSize);
      const result = runBatch({ ...job, totalGames: chunkGames });
      allTopGames.push(...result.topGames);
      totalEval += result.totalEvaluated;

      // Send progress
      self.postMessage({
        type: "progress",
        data: {
          gamesGenerated: Math.min((c + 1) * batchSize, totalGames),
          gamesEvaluated: totalEval,
          totalGames,
          elapsedMs: Math.round(performance.now() - startTime),
          opsPerSecond: result.opsPerSecond,
          phase: c === chunks - 1 ? "filtering" : "evaluating",
        },
      });
    }

    // Merge and finalize
    const topN = job.topN || 50;
    const finalTopGames = allTopGames.sort((a, b) => b.score - a.score).slice(0, topN);
    const totalElapsed = Math.round(performance.now() - startTime);
    const patternInsights = generatePatternInsights(finalTopGames, job.config);
    const distributionSummary = computeDistributionSummary(finalTopGames, job.draws.length);

    self.postMessage({
      type: "result",
      data: {
        topGames: finalTopGames,
        totalGenerated: totalGames,
        totalEvaluated: totalEval,
        elapsedMs: totalElapsed,
        opsPerSecond: Math.round(totalEval / (totalElapsed / 1000)),
        patternInsights,
        distributionSummary,
      },
    });
  }
};
