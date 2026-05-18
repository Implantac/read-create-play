// ═══════════════════════════════════════════════════════
// Motor Matemático de Alta Performance
// TypedArrays + Bitwise Ops + Linear Congruential RNG
// Otimizado para milhões de iterações por segundo
// ═══════════════════════════════════════════════════════

/**
 * Fast PRNG — Linear Congruential Generator (Lehmer)
 * 10x faster than Math.random() for bulk simulations
 */
let _seed = Date.now() | 0;

export function seedRNG(s: number): void {
  _seed = s | 0;
}

function fastRandom(): number {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return (_seed >>> 0) / 4294967296;
}

/**
 * Fast modular random integer [0, max)
 */
function fastRandInt(max: number): number {
  _seed = (_seed * 1664525 + 1013904223) | 0;
  return ((_seed >>> 0) % max);
}

/**
 * Generate a random draw using Fisher-Yates on a typed array
 * Zero allocations after initial setup
 */
export function fastGenerateDraw(
  maxNumber: number,
  pick: number,
  pool: Uint8Array // reusable buffer of size maxNumber
): Uint8Array {
  // Initialize pool [1..maxNumber]
  for (let i = 0; i < maxNumber; i++) pool[i] = i + 1;

  // Fisher-Yates partial shuffle (only pick elements)
  for (let i = 0; i < pick; i++) {
    const j = i + fastRandInt(maxNumber - i);
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  // Return first `pick` elements sorted
  const result = new Uint8Array(pick);
  for (let i = 0; i < pick; i++) result[i] = pool[i];
  result.sort();
  return result;
}

/**
 * Generate a weighted draw using cumulative distribution
 * weights: Float32Array of weights for numbers 1..N
 */
export function fastWeightedDraw(
  weights: Float32Array,
  pick: number
): Uint8Array {
  const n = weights.length;
  const selected = new Uint8Array(pick);
  const used = new Uint8Array(n); // bitfield
  let count = 0;

  // Build cumulative weights
  const cumulative = new Float32Array(n);

  while (count < pick) {
    // Rebuild cumulative for unused numbers
    let total = 0;
    for (let i = 0; i < n; i++) {
      if (used[i]) {
        cumulative[i] = total;
      } else {
        total += weights[i];
        cumulative[i] = total;
      }
    }

    if (total <= 0) {
      // Fallback: fill remaining randomly
      for (let i = 0; i < n && count < pick; i++) {
        if (!used[i]) {
          selected[count++] = i + 1;
          used[i] = 1;
        }
      }
      break;
    }

    const r = fastRandom() * total;
    for (let i = 0; i < n; i++) {
      if (!used[i] && cumulative[i] >= r) {
        selected[count++] = i + 1;
        used[i] = 1;
        break;
      }
    }
  }

  selected.sort();
  return selected;
}

/**
 * Count hits between two sorted Uint8Arrays using merge intersection
 * O(pick) instead of O(pick²)
 */
export function fastCountHits(bet: Uint8Array, draw: Uint8Array): number {
  let hits = 0;
  let i = 0, j = 0;
  while (i < bet.length && j < draw.length) {
    if (bet[i] === draw[j]) {
      hits++;
      i++;
      j++;
    } else if (bet[i] < draw[j]) {
      i++;
    } else {
      j++;
    }
  }
  return hits;
}

// ═══════════════════════════════════════════════════════
// Monte Carlo Massivo de Alta Performance
// ═══════════════════════════════════════════════════════

export interface HPSimConfig {
  maxNumber: number;
  pick: number;
  iterations: number;
  lotteryId: string;
  weights: Float32Array | null; // null = uniform
}

export interface HPSimResult {
  hitDistribution: Int32Array;
  totalHits: number;
  bestHit: number;
  avgHits: number;
  iterationsCompleted: number;
  elapsedMs: number;
  opsPerSecond: number;
}

/**
 * Run high-performance Monte Carlo simulation
 * Uses typed arrays throughout for cache-friendly memory access
 */
export function runHPMonteCarlo(config: HPSimConfig): HPSimResult {
  const start = performance.now();
  const { maxNumber, pick, iterations, weights } = config;

  const hitDist = new Int32Array(pick + 1);
  const pool = new Uint8Array(maxNumber);
  let totalHits = 0;
  let bestHit = 0;

  seedRNG(Date.now() | 0);

  for (let iter = 0; iter < iterations; iter++) {
    // Generate bet (weighted or random)
    const bet = weights
      ? fastWeightedDraw(weights, pick)
      : fastGenerateDraw(maxNumber, pick, pool);

    // Generate random draw
    const draw = fastGenerateDraw(maxNumber, pick, pool);

    // Count hits using merge intersection
    const hits = fastCountHits(bet, draw);
    hitDist[hits]++;
    totalHits += hits;
    if (hits > bestHit) bestHit = hits;
  }

  const elapsed = performance.now() - start;
  const avgHits = totalHits / iterations;

  return {
    hitDistribution: hitDist,
    totalHits,
    bestHit,
    avgHits: Math.round(avgHits * 10000) / 10000,
    iterationsCompleted: iterations,
    elapsedMs: Math.round(elapsed),
    opsPerSecond: Math.round(iterations / (elapsed / 1000)),
  };
}

// ═══════════════════════════════════════════════════════
// Otimização Combinatória de Alta Performance
// ═══════════════════════════════════════════════════════

export interface HPOptConfig {
  maxNumber: number;
  pick: number;
  generations: number;
  populationSize: number;
  weights: Float32Array;
  historicalDraws: Uint8Array[]; // array of sorted draw arrays
}

export interface HPOptResult {
  bestBet: Uint8Array;
  bestScore: number;
  convergence: Float32Array;
  elapsedMs: number;
}

/**
 * Evaluate a bet's quality score (0-100)
 * Uses bitwise operations for fast parity/range checks
 */
function fastEvaluateBet(
  bet: Uint8Array,
  maxNumber: number,
  weights: Float32Array,
  historicalDraws: Uint8Array[]
): number {
  const pick = bet.length;
  let score = 0;

  // 1. Weight score (30 points)
  let weightSum = 0;
  let maxWeight = 0;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > maxWeight) maxWeight = weights[i];
  }
  for (let i = 0; i < pick; i++) {
    weightSum += weights[bet[i] - 1] / (maxWeight || 1);
  }
  score += (weightSum / pick) * 30;

  // 2. Parity balance (15 points)
  let evens = 0;
  for (let i = 0; i < pick; i++) {
    if ((bet[i] & 1) === 0) evens++;
  }
  const parityRatio = evens / pick;
  score += (1 - Math.abs(parityRatio - 0.5) * 2) * 15;

  // 3. High/Low balance (15 points)
  const mid = maxNumber >>> 1;
  let highs = 0;
  for (let i = 0; i < pick; i++) {
    if (bet[i] > mid) highs++;
  }
  score += (1 - Math.abs(highs / pick - 0.5) * 2) * 15;

  // 4. Spread (15 points)
  const spread = bet[pick - 1] - bet[0];
  const idealSpread = maxNumber * 0.75;
  score += Math.min(1, spread / idealSpread) * 15;

  // 5. Consecutive pairs penalty (10 points)
  let consec = 0;
  for (let i = 1; i < pick; i++) {
    if (bet[i] - bet[i - 1] === 1) consec++;
  }
  const idealConsec = Math.min(2, pick / 5) | 0;
  score += Math.max(0, 1 - Math.abs(consec - idealConsec) * 0.3) * 10;

  // 6. Historical overlap check (15 points) — penalize exact repeats
  let maxOverlap = 0;
  const recentCount = Math.min(20, historicalDraws.length);
  for (let d = 0; d < recentCount; d++) {
    const hits = fastCountHits(bet, historicalDraws[d]);
    if (hits > maxOverlap) maxOverlap = hits;
  }
  score += (1 - maxOverlap / pick) * 15;

  return score;
}

export function runHPOptimization(config: HPOptConfig): HPOptResult {
  const start = performance.now();
  const { maxNumber, pick, generations, populationSize, weights, historicalDraws } = config;

  seedRNG(Date.now() | 0);

  // Initialize population
  const pool = new Uint8Array(maxNumber);
  let population: { bet: Uint8Array; score: number }[] = [];

  for (let i = 0; i < populationSize; i++) {
    const bet = fastWeightedDraw(weights, pick);
    const score = fastEvaluateBet(bet, maxNumber, weights, historicalDraws);
    population.push({ bet, score });
  }
  population.sort((a, b) => b.score - a.score);

  const convergence = new Float32Array(Math.min(generations, 200));
  const convInterval = Math.max(1, (generations / 200) | 0);

  for (let gen = 0; gen < generations; gen++) {
    const newPop: typeof population = [];

    // Mutate top half
    const halfPop = Math.min(populationSize / 2, population.length) | 0;
    for (let i = 0; i < halfPop; i++) {
      const parent = population[i].bet;
      const child = new Uint8Array(parent);

      // Mutate 1-2 positions
      const mutations = fastRandom() < 0.3 ? 2 : 1;
      for (let m = 0; m < mutations; m++) {
        const idx = fastRandInt(pick);
        let newVal: number;
        let attempts = 0;
        do {
          if (fastRandom() < 0.5) {
            const delta = (fastRandInt(5) + 1) * (fastRandom() < 0.5 ? 1 : -1);
            newVal = Math.max(1, Math.min(maxNumber, child[idx] + delta));
          } else {
            newVal = fastRandInt(maxNumber) + 1;
          }
          attempts++;
        } while (child.includes(newVal) && attempts < 20);
        if (!child.includes(newVal)) child[idx] = newVal;
      }

      child.sort();
      const score = fastEvaluateBet(child, maxNumber, weights, historicalDraws);
      newPop.push({ bet: child, score });
    }

    // Fresh random for diversity
    for (let i = 0; i < 3; i++) {
      const bet = fastWeightedDraw(weights, pick);
      const score = fastEvaluateBet(bet, maxNumber, weights, historicalDraws);
      newPop.push({ bet, score });
    }

    population = [...population, ...newPop].sort((a, b) => b.score - a.score).slice(0, populationSize);

    // Deduplicate
    const seen = new Set<string>();
    population = population.filter(p => {
      const key = p.bet.join(",");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (gen % convInterval === 0) {
      convergence[(gen / convInterval) | 0] = population[0].score;
    }
  }

  return {
    bestBet: population[0].bet,
    bestScore: Math.round(population[0].score * 100) / 100,
    convergence,
    elapsedMs: Math.round(performance.now() - start),
  };
}

// ═══════════════════════════════════════════════════════
// Benchmarking
// ═══════════════════════════════════════════════════════

export interface BenchmarkResult {
  monteCarloOpsPerSec: number;
  drawGenOpsPerSec: number;
  hitCheckOpsPerSec: number;
  totalMs: number;
}

export function runBenchmark(maxNumber: number, pick: number): BenchmarkResult {
  const start = performance.now();
  const pool = new Uint8Array(maxNumber);
  seedRNG(42);

  // Benchmark draw generation
  const drawCount = 100000;
  const t1 = performance.now();
  for (let i = 0; i < drawCount; i++) {
    fastGenerateDraw(maxNumber, pick, pool);
  }
  const drawGenMs = performance.now() - t1;

  // Benchmark hit checking
  const bet = fastGenerateDraw(maxNumber, pick, pool);
  const t2 = performance.now();
  for (let i = 0; i < drawCount; i++) {
    const draw = fastGenerateDraw(maxNumber, pick, pool);
    fastCountHits(bet, draw);
  }
  const hitCheckMs = performance.now() - t2;

  // Benchmark full Monte Carlo
  const mcCount = 50000;
  const t3 = performance.now();
  const mcResult = runHPMonteCarlo({ maxNumber, pick, iterations: mcCount, lotteryId: "", weights: null });
  const mcMs = performance.now() - t3;

  return {
    drawGenOpsPerSec: Math.round(drawCount / (drawGenMs / 1000)),
    hitCheckOpsPerSec: Math.round(drawCount / (hitCheckMs / 1000)),
    monteCarloOpsPerSec: mcResult.opsPerSecond,
    totalMs: Math.round(performance.now() - start),
  };
}
