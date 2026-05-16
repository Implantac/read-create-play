import { describe, it, expect } from "vitest";
import {
  computeFrequencyStats,
  computeSumDistribution,
  generateSmartBet,
  NumberStats,
} from "@/features/statistics/engine";
import { DrawResult } from "@/data/lotteries";

const makeDraw = (concurso: number, numbers: number[]): DrawResult => ({
  concurso,
  date: "2026-01-01",
  numbers,
});

const sampleDraws: DrawResult[] = [
  makeDraw(1, [1, 2, 3, 4, 5, 6]),
  makeDraw(2, [1, 3, 5, 7, 9, 11]),
  makeDraw(3, [2, 4, 6, 8, 10, 12]),
  makeDraw(4, [1, 2, 5, 10, 15, 20]),
  makeDraw(5, [3, 6, 9, 12, 15, 18]),
];

describe("computeFrequencyStats", () => {
  it("returns stats for all numbers 1..totalNumbers", () => {
    const stats = computeFrequencyStats(sampleDraws, 25);
    expect(stats).toHaveLength(25);
    expect(stats[0].number).toBe(1);
    expect(stats[24].number).toBe(25);
  });

  it("calculates correct frequencies", () => {
    const stats = computeFrequencyStats(sampleDraws, 25);
    const n1 = stats.find((s) => s.number === 1)!;
    // number 1 appears in draws 1, 2, 4 → frequency 3
    expect(n1.frequency).toBe(3);
  });

  it("marks hot/cold/normal status", () => {
    const stats = computeFrequencyStats(sampleDraws, 25);
    const statuses = new Set(stats.map((s) => s.status));
    // Should have at least some classification
    expect(statuses.size).toBeGreaterThanOrEqual(1);
    stats.forEach((s) => {
      expect(["hot", "cold", "normal"]).toContain(s.status);
    });
  });

  it("handles empty draws array", () => {
    const stats = computeFrequencyStats([], 25);
    expect(stats).toHaveLength(25);
    stats.forEach((s) => {
      expect(s.frequency).toBe(0);
      expect(s.percentage).toBe(0);
    });
  });

  it("handles draws with invalid data gracefully", () => {
    const bad = [
      makeDraw(1, [1, 2, 3]),
      { concurso: 2, date: "x", numbers: null } as any,
    ];
    expect(() => computeFrequencyStats(bad, 10)).not.toThrow();
  });
});

describe("computeSumDistribution", () => {
  it("returns correct sum for each draw", () => {
    const result = computeSumDistribution(sampleDraws);
    expect(result[0].sum).toBe(1 + 2 + 3 + 4 + 5 + 6); // 21
    expect(result).toHaveLength(sampleDraws.length);
  });

  it("returns empty for no draws", () => {
    expect(computeSumDistribution([])).toHaveLength(0);
  });
});

describe("generateSmartBet", () => {
  it("returns exactly pick numbers sorted ascending", () => {
    const stats = computeFrequencyStats(sampleDraws, 25);
    const bet = generateSmartBet(stats, 6);
    expect(bet).toHaveLength(6);
    expect(bet).toEqual([...bet].sort((a, b) => a - b));
  });

  it("returns unique numbers within valid range", () => {
    const stats = computeFrequencyStats(sampleDraws, 25);
    const bet = generateSmartBet(stats, 15);
    expect(new Set(bet).size).toBe(15);
    bet.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(25);
    });
  });

  it("works for all supported lotteries", () => {
    const configs = [
      { numbers: 60, pick: 6 },
      { numbers: 25, pick: 15 },
      { numbers: 80, pick: 5 },
      { numbers: 31, pick: 7 },
    ];
    configs.forEach(({ numbers, pick }) => {
      const stats = computeFrequencyStats([], numbers);
      const bet = generateSmartBet(stats, pick);
      expect(bet).toHaveLength(pick);
      expect(new Set(bet).size).toBe(pick);
    });
  });
});
