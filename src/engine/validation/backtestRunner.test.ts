import { describe, it, expect } from "vitest";
import { runBacktest, compareStrategies, countHits, type BetGenerator } from "./backtestRunner";
import { evaluateBetProfessional } from "@/engine/filters/professionalFilters";
import type { DrawResult } from "@/data/lotteries";

// Gera um histórico sintético de Mega-Sena (60/6) determinístico
function makeMegaDraws(n: number): DrawResult[] {
  const out: DrawResult[] = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < n; i++) {
    const nums = new Set<number>();
    while (nums.size < 6) nums.add(1 + Math.floor(rand() * 60));
    out.push({
      concurso: 1000 - i,
      date: `2024-${String((i % 12) + 1).padStart(2, "0")}-01`,
      numbers: [...nums].sort((a, b) => a - b),
    });
  }
  return out;
}

describe("backtestRunner", () => {
  it("countHits conta interseção correta", () => {
    expect(countHits([1, 2, 3, 4, 5, 6], [1, 2, 7, 8, 9, 10])).toBe(2);
    expect(countHits([], [1, 2, 3])).toBe(0);
    expect(countHits([1, 2, 3], [4, 5, 6])).toBe(0);
  });

  it("runBacktest devolve métricas coerentes para gerador aleatório", () => {
    const draws = makeMegaDraws(80);
    const randomGen: BetGenerator = () => {
      const s = new Set<number>();
      while (s.size < 6) s.add(1 + Math.floor(Math.random() * 60));
      return [...s];
    };
    const result = runBacktest(draws, randomGen, { lotteryId: "megasena", lookback: 50 });
    expect(result.drawsEvaluated).toBe(50);
    expect(result.avgHits).toBeGreaterThanOrEqual(0);
    expect(result.avgHits).toBeLessThanOrEqual(6);
    expect(result.qualityScore).toBeGreaterThanOrEqual(0);
    expect(result.qualityScore).toBeLessThanOrEqual(100);
  });

  it("compareStrategies devolve delta e sinaliza melhoria", () => {
    const draws = makeMegaDraws(60);
    // "Antes": aposta sempre no mesmo jogo fraco
    const before: BetGenerator = () => [1, 2, 3, 4, 5, 6];
    // "Depois": aposta profissional (soma balanceada)
    const after: BetGenerator = () => [7, 15, 27, 34, 48, 52];

    const cmp = compareStrategies(draws, before, after, { lotteryId: "megasena", lookback: 40 });
    expect(cmp.before.drawsEvaluated).toBe(40);
    expect(cmp.after.drawsEvaluated).toBe(40);
    expect(typeof cmp.improved).toBe("boolean");
    expect(cmp.delta.avgHits).toBeDefined();
  });

  it("gerador filtrado por evaluateBetProfessional roda no backtest", () => {
    const draws = makeMegaDraws(50);
    const gen: BetGenerator = (history) => {
      // gera até 20 candidatos e devolve o com melhor score profissional
      let best: number[] = [];
      let bestScore = -1;
      for (let k = 0; k < 20; k++) {
        const s = new Set<number>();
        while (s.size < 6) s.add(1 + Math.floor(Math.random() * 60));
        const candidate = [...s];
        const evalRes = evaluateBetProfessional(candidate, "megasena", history);
        if (evalRes.averageScore > bestScore) {
          bestScore = evalRes.averageScore;
          best = candidate;
        }
      }
      return best;
    };
    const result = runBacktest(draws, gen, { lotteryId: "megasena", lookback: 30 });
    expect(result.drawsEvaluated).toBe(30);
    expect(result.avgHits).toBeGreaterThanOrEqual(0);
  });
});
