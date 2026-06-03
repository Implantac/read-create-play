import { describe, expect, it } from "vitest";
import type { LotteryConfig } from "@/data/lotteries";
import type { NumberStats } from "@/engine/statistics";
import { buildStrategyBriefing } from "@/engine/strategy-briefing";

const config: LotteryConfig = {
  id: "lotofacil",
  name: "Lotofacil",
  numbers: 25,
  pick: 15,
  color: "neon-blue",
  icon: "target",
};

const stats: NumberStats[] = Array.from({ length: 25 }, (_, index) => {
  const number = index + 1;
  return {
    number,
    frequency: 80 + (index % 5),
    percentage: 46 + (index % 5),
    lastSeen: index % 8,
    recentFreq: 10 + (index % 4),
    status: index % 7 === 0 ? "hot" : index % 6 === 0 ? "cold" : "normal",
    avgGap: 2 + (index % 4),
    maxGap: 8 + (index % 5),
    stdDev: 1.5 + (index % 3),
    trend: index % 4 === 0 ? 2 : -1,
    momentum: index % 3,
    consecutivePairs: index % 6,
    cycleScore: 0.8 + (index % 4) * 0.1,
    expectedAppearance: 1,
    hotStreak: index % 2,
  };
});

const draws = Array.from({ length: 160 }, (_, index) => ({
  concurso: 3000 - index,
  date: "2026-06-01",
  numbers: Array.from({ length: 15 }, (_, n) => ((n + index) % 25) + 1),
}));

describe("buildStrategyBriefing", () => {
  it("returns a decision-ready briefing from lottery data", () => {
    const briefing = buildStrategyBriefing(config, stats, draws);

    expect(briefing.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(briefing.confidenceScore).toBeLessThanOrEqual(100);
    expect(briefing.strategyMix).toHaveLength(4);
    expect(briefing.operatingPlan).toHaveLength(3);
    expect(["conservative", "balanced", "aggressive"]).toContain(briefing.recommendedTone);
    expect(briefing.summary).toContain("160 concursos");
  });
});
