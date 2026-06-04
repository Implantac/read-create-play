import { describe, expect, it } from "vitest";
import type { LotteryConfig } from "@/data/lotteries";
import type { NumberStats } from "@/engine/stats/statistics";
import { buildBettingBudgetPlan } from "@/engine/betting-budget";

const config: LotteryConfig = {
  id: "lotofacil",
  name: "Lotofacil",
  numbers: 25,
  pick: 15,
  color: "neon-blue",
  icon: "target",
};

const stats: NumberStats[] = Array.from({ length: 25 }, (_, index) => ({
  number: index + 1,
  frequency: 70 + index,
  percentage: 40,
  lastSeen: index % 6,
  recentFreq: 8,
  status: "normal",
  avgGap: 3,
  maxGap: 10,
  stdDev: 2,
  trend: index % 2,
  momentum: 1,
  consecutivePairs: 2,
  cycleScore: 1,
  expectedAppearance: 1,
  hotStreak: 0,
}));

const draws = Array.from({ length: 180 }, (_, index) => ({
  concurso: 3200 - index,
  date: "2026-06-01",
  numbers: Array.from({ length: 15 }, (_, n) => ((n + index) % 25) + 1),
}));

describe("buildBettingBudgetPlan", () => {
  it("keeps the recommended monthly cost inside the selected budget", () => {
    const plan = buildBettingBudgetPlan(config, stats, draws, 180, "medium");

    expect(plan.recommendedGamesPerDraw).toBeLessThanOrEqual(plan.maxGamesPerDraw);
    expect(plan.monthlyCost).toBeLessThanOrEqual(plan.monthlyBudget);
    expect(plan.budgetUsagePct).toBeGreaterThanOrEqual(0);
    expect(plan.budgetUsagePct).toBeLessThanOrEqual(100);
  });

  it("warns when the budget cannot cover one game per draw", () => {
    const plan = buildBettingBudgetPlan(config, stats, draws, 30, "low");

    expect(plan.recommendedGamesPerDraw).toBe(0);
    expect(plan.warning).toContain("insuficiente");
  });
});
