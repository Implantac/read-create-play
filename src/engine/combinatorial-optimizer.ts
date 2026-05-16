import { NumberStats } from "@/features/statistics/engine";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "./bet-quality";
import { fastRandom } from "./hp-math-engine";

// ═══════════════════════════════════════════════════════
// Otimizador Combinatório
// Gera e refina combinações para maximizar qualidade
// ═══════════════════════════════════════════════════════

export interface OptimizedBet {
  numbers: number[];
  quality: BetQualityReport;
  iteration: number;
}

export interface OptimizationResult {
  best: OptimizedBet;
  top5: OptimizedBet[];
  iterations: number;
  elapsedMs: number;
  convergenceHistory: { iteration: number; score: number }[];
}

/**
 * Genetic-style optimizer: generates candidates, evaluates, selects best,
 * mutates to explore neighbors, keeps elite pool
 */
export function runCombinatorialOptimization(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  maxIterations: number = 5000,
  populationSize: number = 20
): OptimizationResult {
  const start = performance.now();
  const convergence: { iteration: number; score: number }[] = [];

  // Weighted pool based on stats
  const weightedPool = stats.map(s => ({
    number: s.number,
    weight: Math.max(0.1,
      s.recentFreq * 2 +
      (s.trend > 0 ? s.trend * 3 : 0.5) +
      s.cycleScore * 4 +
      (s.momentum > 0 ? s.momentum : 0) +
      (s.status === "hot" ? 3 : s.status === "cold" && s.cycleScore > 1.2 ? 2 : 1)
    ),
  }));

  function generateWeightedBet(): number[] {
    const pool = [...weightedPool];
    const selected: number[] = [];
    while (selected.length < config.pick && pool.length > 0) {
      const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
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

  function mutate(bet: number[]): number[] {
    const mutated = [...bet];
    const mutations = Math.random() < 0.3 ? 2 : 1;
    for (let m = 0; m < mutations; m++) {
      const idx = Math.floor(Math.random() * mutated.length);
      let newNum: number;
      do {
        // Prefer nearby numbers or weighted random
        if (Math.random() < 0.5) {
          newNum = mutated[idx] + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
          newNum = Math.max(1, Math.min(config.numbers, newNum));
        } else {
          const pool = [...weightedPool];
          const totalWeight = pool.reduce((s, p) => s + p.weight, 0);
          let r = Math.random() * totalWeight;
          newNum = pool[0].number;
          for (const p of pool) {
            r -= p.weight;
            if (r <= 0) { newNum = p.number; break; }
          }
        }
      } while (mutated.includes(newNum));
      mutated[idx] = newNum;
    }
    return mutated.sort((a, b) => a - b);
  }

  function crossover(a: number[], b: number[]): number[] {
    const combined = new Set([...a, ...b]);
    const arr = [...combined];
    // Shuffle and pick
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, config.pick).sort((a, b) => a - b);
  }

  // Initialize population
  let population: { bet: number[]; score: number; quality: BetQualityReport }[] = [];
  for (let i = 0; i < populationSize; i++) {
    const bet = generateWeightedBet();
    const quality = evaluateBetQuality(bet, stats, config, draws);
    population.push({ bet, score: quality.overall, quality });
  }
  population.sort((a, b) => b.score - a.score);

  const sampleInterval = Math.max(1, Math.floor(maxIterations / 50));

  for (let iter = 0; iter < maxIterations; iter++) {
    // Generate new candidates via mutation and crossover
    const newCandidates: typeof population = [];

    // Mutate top half
    for (let i = 0; i < Math.min(populationSize / 2, population.length); i++) {
      const mutated = mutate(population[i].bet);
      const quality = evaluateBetQuality(mutated, stats, config, draws);
      newCandidates.push({ bet: mutated, score: quality.overall, quality });
    }

    // Crossover random pairs from top
    for (let i = 0; i < populationSize / 4; i++) {
      const a = population[Math.floor(Math.random() * Math.min(5, population.length))];
      const b = population[Math.floor(Math.random() * Math.min(10, population.length))];
      const child = crossover(a.bet, b.bet);
      const quality = evaluateBetQuality(child, stats, config, draws);
      newCandidates.push({ bet: child, score: quality.overall, quality });
    }

    // Fresh random to maintain diversity
    for (let i = 0; i < 2; i++) {
      const bet = generateWeightedBet();
      const quality = evaluateBetQuality(bet, stats, config, draws);
      newCandidates.push({ bet, score: quality.overall, quality });
    }

    // Merge and select elite
    population = [...population, ...newCandidates]
      .sort((a, b) => b.score - a.score)
      .slice(0, populationSize);

    // Deduplicate
    const seen = new Set<string>();
    population = population.filter(p => {
      const key = p.bet.join(",");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if ((iter + 1) % sampleInterval === 0) {
      convergence.push({ iteration: iter + 1, score: population[0].score });
    }
  }

  const top5: OptimizedBet[] = population.slice(0, 5).map((p, i) => ({
    numbers: p.bet,
    quality: p.quality,
    iteration: i,
  }));

  return {
    best: top5[0],
    top5,
    iterations: maxIterations,
    elapsedMs: Math.round(performance.now() - start),
    convergenceHistory: convergence,
  };
}
