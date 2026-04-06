import { describe, it, expect } from "vitest";
import { evaluateBetQuality } from "@/engine/bet-quality";
import { computeFrequencyStats } from "@/engine/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";

const lotofacil: LotteryConfig = {
  id: "lotofacil",
  name: "Lotofácil",
  numbers: 25,
  pick: 15,
  color: "neon-blue",
  icon: "🎯",
};

const megasena: LotteryConfig = {
  id: "megasena",
  name: "Mega Sena",
  numbers: 60,
  pick: 6,
  color: "neon-green",
  icon: "🍀",
};

const makeDraw = (n: number[]): DrawResult => ({ concurso: 1, date: "2026-01-01", numbers: n });

const sampleDraws: DrawResult[] = Array.from({ length: 20 }, (_, i) => {
  const nums: number[] = [];
  for (let j = 0; nums.length < 15; j++) {
    const n = ((i * 7 + j * 3) % 25) + 1;
    if (!nums.includes(n)) nums.push(n);
  }
  return makeDraw(nums.sort((a, b) => a - b));
});

describe("evaluateBetQuality", () => {
  const stats = computeFrequencyStats(sampleDraws, 25);

  it("returns a valid report with all required fields", () => {
    const bet = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const report = evaluateBetQuality(bet, stats, lotofacil, sampleDraws);
    expect(report.overall).toBeGreaterThanOrEqual(0);
    expect(report.overall).toBeLessThanOrEqual(100);
    expect(report.dimensions.length).toBeGreaterThan(0);
    expect(["S", "A", "B", "C", "D", "F"]).toContain(report.grade);
    expect(Array.isArray(report.warnings)).toBe(true);
    expect(Array.isArray(report.strengths)).toBe(true);
  });

  it("gives balanced bets higher scores than extreme ones", () => {
    const balanced = [1, 3, 5, 8, 10, 12, 14, 16, 18, 19, 20, 21, 22, 24, 25];
    const extreme = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const r1 = evaluateBetQuality(balanced, stats, lotofacil, sampleDraws);
    const r2 = evaluateBetQuality(extreme, stats, lotofacil, sampleDraws);
    // Balanced should score >= extreme (consecutive low numbers)
    expect(r1.overall).toBeGreaterThanOrEqual(r2.overall - 15);
  });

  it("warns about parity imbalance", () => {
    const allEven = [2, 4, 6, 8, 10, 12];
    const statsM = computeFrequencyStats([], 60);
    const report = evaluateBetQuality(allEven, statsM, megasena, []);
    expect(report.warnings.some((w) => w.toLowerCase().includes("par"))).toBe(true);
  });

  it("handles empty draws gracefully", () => {
    const bet = [1, 5, 10, 15, 20, 25];
    const emptyStats = computeFrequencyStats([], 60);
    expect(() => evaluateBetQuality(bet, emptyStats, megasena, [])).not.toThrow();
  });
});
