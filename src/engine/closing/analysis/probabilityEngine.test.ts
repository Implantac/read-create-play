import { describe, it, expect } from "vitest";
import {
  singleGameHitProbability,
  hitsInBaseProbability,
  computeClosingProbability,
} from "./probabilityEngine";

describe("ProbabilityEngine", () => {
  it("Mega-Sena: P(6 acertos) ≈ 1/50.063.860", () => {
    const p = singleGameHitProbability(60, 6, 6);
    expect(1 / p).toBeCloseTo(50063860, -3);
  });

  it("Lotofácil: distribuição soma 1", () => {
    let total = 0;
    for (let h = 0; h <= 15; h++) total += singleGameHitProbability(25, 15, h);
    expect(total).toBeCloseTo(1, 6);
  });

  it("hitsInBase: base = universo entrega P(k=pick)=1", () => {
    expect(hitsInBaseProbability(25, 15, 25, 15)).toBeCloseTo(1, 6);
  });

  it("computeClosingProbability: aumenta com mais jogos", () => {
    const r1 = computeClosingProbability(25, 15, 18, 1);
    const r10 = computeClosingProbability(25, 15, 18, 10);
    const p1 = r1.atLeastOneGameHits.find(r => r.hits === 11)!.probability;
    const p10 = r10.atLeastOneGameHits.find(r => r.hits === 11)!.probability;
    expect(p10).toBeGreaterThan(p1);
  });

  it("cumulativa é monotônica decrescente com h", () => {
    const r = computeClosingProbability(60, 6, 20, 5);
    for (let i = 1; i < r.singleGame.length; i++) {
      expect(r.singleGame[i].probabilityCumulative).toBeGreaterThanOrEqual(
        r.singleGame[i - 1].probabilityCumulative - 1e-9,
      );
    }
  });
});
