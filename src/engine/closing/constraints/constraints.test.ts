import { describe, it, expect } from "vitest";
import {
  applyConstraints,
  CONSTRAINT_PRESETS,
  parityConstraint,
  sumConstraint,
  consecutiveConstraint,
  frameCoreConstraint,
  excludedNumbersConstraint,
} from "@/engine/closing/constraints";
import type { ConstraintContext } from "@/engine/closing/constraints/types";

const ctx: ConstraintContext = {
  lottery: { id: "lotofacil", name: "Lotofácil", totalNumbers: 25, pick: 15, ticketPrice: 3 },
  baseNumbers: Array.from({ length: 25 }, (_, i) => i + 1),
};

describe("constraints/builtins", () => {
  it("parity: aceita/rejeita conforme faixa de pares", () => {
    const evens = [2, 4, 6, 8, 10];
    expect(parityConstraint.test(evens, { minEvens: 3, maxEvens: 5 }, ctx)).toBe(true);
    expect(parityConstraint.test(evens, { minEvens: 0, maxEvens: 2 }, ctx)).toBe(false);
  });

  it("sum: valida soma total", () => {
    const g = [1, 2, 3, 4, 5];
    expect(sumConstraint.test(g, { min: 10, max: 20 }, ctx)).toBe(true);
    expect(sumConstraint.test(g, { min: 100, max: 200 }, ctx)).toBe(false);
  });

  it("consecutive: rejeita sequência longa", () => {
    const seq = [1, 2, 3, 4, 5];
    expect(consecutiveConstraint.test(seq, { maxRun: 5 }, ctx)).toBe(true);
    expect(consecutiveConstraint.test(seq, { maxRun: 3 }, ctx)).toBe(false);
  });

  it("frameCore: conta dezenas na moldura 5x5", () => {
    // Cantos e bordas em grade 5x5 (1..25): frame quando r=0, r=4, c=0 ou c=4
    const allFrame = [1, 2, 3, 4, 5, 6, 10, 11];
    const ok = frameCoreConstraint.test(allFrame, { cols: 5, minFrame: 6, maxFrame: 25 }, ctx);
    expect(ok).toBe(true);
  });

  it("excluded: rejeita se contém dezena banida", () => {
    expect(excludedNumbersConstraint.test([1, 2, 3], { excluded: [3] }, ctx)).toBe(false);
    expect(excludedNumbersConstraint.test([1, 2, 4], { excluded: [3] }, ctx)).toBe(true);
  });
});

describe("constraints/ConstraintSolver", () => {
  it("aplica em série, mantém apenas jogos válidos", () => {
    const games = [
      [1, 2, 3, 4, 5],
      [2, 4, 6, 8, 10],
      [1, 3, 5, 7, 9],
    ];
    const result = applyConstraints(
      games,
      [{ id: "parity", params: { minEvens: 3, maxEvens: 5 } }],
      ctx,
    );
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0]).toEqual([2, 4, 6, 8, 10]);
    expect(result.stats.rejectedCount).toBe(2);
  });

  it("sem constraints: passa tudo", () => {
    const games = [[1, 2, 3]];
    const result = applyConstraints(games, [], ctx);
    expect(result.kept).toHaveLength(1);
    expect(result.rejected).toHaveLength(0);
  });

  it("presets: 'balanced' é definido e válido", () => {
    expect(Array.isArray(CONSTRAINT_PRESETS.balanced)).toBe(true);
    expect(CONSTRAINT_PRESETS.balanced.length).toBeGreaterThan(0);
  });
});
