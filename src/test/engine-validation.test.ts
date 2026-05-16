/**
 * Integration tests: Coverage Engine + Strategy Evolution + Statistics
 */
import { describe, it, expect } from "vitest";
import { computeFrequencyStats, NumberStats } from "@/features/statistics/engine";
import { generateByStrategy, Strategy, STRATEGIES } from "@/features/statistics/strategies";
import { runExtremeCoverage } from "@/engine/extreme-coverage";
import { CoverageConfig } from "@/engine/extreme-coverage";
import { runStrategyLab, getStrategiesForLottery, STRATEGY_REGISTRY } from "@/engine/strategy-evolution";
import { LotteryConfig, DrawResult } from "@/data/lotteries";

// Mock data
const LOTOFACIL_CONFIG: LotteryConfig = {
  id: "lotofacil", name: "Lotofácil", numbers: 25, pick: 15, color: "neon-blue", icon: "🎯",
  betPrice: 3.0, prizeTiers: [],
};

const MEGASENA_CONFIG: LotteryConfig = {
  id: "megasena", name: "Mega-Sena", numbers: 60, pick: 6, color: "neon-green", icon: "🍀",
  betPrice: 5.0, prizeTiers: [],
};

function generateMockDraws(count: number, maxNum: number, pick: number): DrawResult[] {
  const draws: DrawResult[] = [];
  for (let i = 0; i < count; i++) {
    const nums = new Set<number>();
    while (nums.size < pick) nums.add(Math.floor(Math.random() * maxNum) + 1);
    draws.push({
      concurso: 3000 + i,
      date: `2024-01-${String(i + 1).padStart(2, "0")}`,
      numbers: [...nums].sort((a, b) => a - b),
    });
  }
  return draws;
}

describe("Statistics Engine", () => {
  it("computes frequency stats for all numbers", () => {
    const draws = generateMockDraws(50, 25, 15);
    const stats = computeFrequencyStats(draws, 25);
    expect(stats.length).toBe(25);
    stats.forEach(s => {
      expect(s.number).toBeGreaterThanOrEqual(1);
      expect(s.number).toBeLessThanOrEqual(25);
      expect(s.frequency).toBeGreaterThanOrEqual(0);
      expect(typeof s.trend).toBe("number");
      expect(typeof s.cycleScore).toBe("number");
    });
  });
});

describe("Strategy Generation", () => {
  it("generates valid games for each strategy", () => {
    const draws = generateMockDraws(50, 25, 15);
    const stats = computeFrequencyStats(draws, 25);

    const strategies: Strategy[] = ["smart", "hot", "cold", "balanced", "trend", "fibonacci", "primes", "sectors"];
    strategies.forEach(strat => {
      const game = generateByStrategy(strat, stats, LOTOFACIL_CONFIG);
      expect(game.length).toBe(15);
      expect(new Set(game).size).toBe(15); // no duplicates
      game.forEach(n => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(25);
      });
    });
  });

  it("generates valid mega-sena games", () => {
    const draws = generateMockDraws(50, 60, 6);
    const stats = computeFrequencyStats(draws, 60);
    const game = generateByStrategy("smart", stats, MEGASENA_CONFIG);
    expect(game.length).toBe(6);
    expect(new Set(game).size).toBe(6);
    game.forEach(n => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(60);
    });
  });
});

describe("Coverage Engine", () => {
  it("generates optimized coverage for Lotofácil 18→15", () => {
    const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const config: CoverageConfig = {
      lotteryId: "lotofacil",
      baseNumbers: base,
      pick: 15,
      universeSize: 25,
      maxGames: 20,
      maxBudget: 100,
      ticketPrice: 3.0,
      profile: "equilibrado",
      objective: "geral",
      priority: "melhor_equilibrio",
      maxOverlap: 0,
    };

    const result = runExtremeCoverage(config);

    // Validate structure
    expect(result.games.length).toBeGreaterThan(0);
    expect(result.games.length).toBeLessThanOrEqual(20);
    expect(result.metrics.totalPossibleCombinations).toBe(816); // C(18,15) = 816
    expect(result.metrics.globalScore).toBeGreaterThan(0);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);

    // Validate each game
    result.games.forEach(game => {
      expect(game.length).toBe(15);
      expect(new Set(game).size).toBe(15);
      game.forEach(n => expect(base).toContain(n));
    });

    // Validate no duplicate games
    const keys = new Set(result.games.map(g => g.join(",")));
    expect(keys.size).toBe(result.games.length);

    // Validate metrics are real
    expect(result.metrics.pairCoverage).toBeGreaterThan(0);
    expect(result.metrics.pairCoverage).toBeLessThanOrEqual(100);
    expect(result.metrics.numberCoverage).toBeGreaterThan(0);
    expect(result.metrics.redundancyIndex).toBeGreaterThanOrEqual(0);
    expect(result.metrics.redundancyIndex).toBeLessThanOrEqual(1);
  });
});

describe("Strategy Evolution Engine", () => {
  it("registry has strategies for lotofacil", () => {
    const strats = getStrategiesForLottery("lotofacil");
    expect(strats.length).toBeGreaterThan(5);
  });

  it("runs strategy lab with backtesting", () => {
    const draws = generateMockDraws(100, 25, 15);

    const result = runStrategyLab(
      {
        lotteryId: "lotofacil",
        strategies: ["freq_recente", "atrasadas", "equilibrio_paridade"],
        gamesPerStrategy: 3,
        drawRange: [3000, 3099],
        profile: "equilibrado",
      },
      draws,
      LOTOFACIL_CONFIG,
    );

    expect(result.rankings.length).toBe(3);
    expect(result.rankings[0].rank).toBe(1);
    expect(result.rankings[0].metrics.globalScore).toBeGreaterThanOrEqual(0);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);

    // Rankings should be sorted by score
    for (let i = 1; i < result.rankings.length; i++) {
      expect(result.rankings[i].metrics.globalScore).toBeLessThanOrEqual(
        result.rankings[i - 1].metrics.globalScore
      );
    }
  });

  it("generates evolution suggestions", () => {
    const draws = generateMockDraws(100, 25, 15);
    const result = runStrategyLab(
      {
        lotteryId: "lotofacil",
        strategies: [],
        gamesPerStrategy: 3,
        drawRange: [3000, 3099],
        profile: "equilibrado",
      },
      draws,
      LOTOFACIL_CONFIG,
    );

    // Should have at least promote/combine suggestions
    expect(result.suggestions.length).toBeGreaterThan(0);
    result.suggestions.forEach(s => {
      expect(["adjust_param", "combine", "discard", "promote"]).toContain(s.type);
      expect(s.reason.length).toBeGreaterThan(0);
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
    });
  });
});
