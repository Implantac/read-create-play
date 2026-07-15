import { describe, it, expect } from "vitest";
import { analyzeClosingStatistics } from "./statisticsAnalyzer";

describe("StatisticsAnalyzer", () => {
  const games = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [1, 3, 5, 7, 9],
    [2, 4, 6, 8, 10],
  ];

  it("conta jogos", () => {
    const r = analyzeClosingStatistics(games, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 25);
    expect(r.gameCount).toBe(4);
  });

  it("paridade média correta", () => {
    const r = analyzeClosingStatistics(games, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 25);
    // pares: 2 (jogo1), 3 (jogo2), 0 (jogo3), 5 (jogo4) => média = 2.5
    expect(r.parity.evenAvg).toBeCloseTo(2.5, 2);
  });

  it("soma agrega estatísticas", () => {
    const r = analyzeClosingStatistics(games, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 25);
    // sums: 15, 40, 25, 30
    expect(r.sum.min).toBe(15);
    expect(r.sum.max).toBe(40);
    expect(r.sum.avg).toBeCloseTo(27.5, 2);
  });

  it("cobertura da base", () => {
    const r = analyzeClosingStatistics(games, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20], 25);
    expect(r.coverageOfBase.used).toBe(10);
    expect(r.coverageOfBase.unused).toBe(1);
  });

  it("entropia entre 0 e 100", () => {
    const r = analyzeClosingStatistics(games, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 25);
    expect(r.entropy).toBeGreaterThanOrEqual(0);
    expect(r.entropy).toBeLessThanOrEqual(100);
  });

  it("retorna vazio quando não há jogos", () => {
    const r = analyzeClosingStatistics([], [], 25);
    expect(r.gameCount).toBe(0);
  });
});
