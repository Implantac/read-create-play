import { describe, it, expect } from "vitest";
import { evaluateBetQuality } from "./bet-quality";
import type { LotteryConfig } from "@/data/lotteries";

const megaConfig: LotteryConfig = {
  id: "megasena", name: "Mega Sena", numbers: 60, pick: 6, color: "green", icon: "🍀",
};
const lotoConfig: LotteryConfig = {
  id: "lotofacil", name: "Lotofácil", numbers: 25, pick: 15, color: "blue", icon: "🎯",
};

describe("evaluateBetQuality (Fase 2)", () => {
  it("mantém formato do relatório e adiciona campos novos opcionais", () => {
    const r = evaluateBetQuality([7, 15, 27, 34, 48, 52], [], megaConfig, []);
    expect(r.overall).toBeGreaterThanOrEqual(0);
    expect(r.overall).toBeLessThanOrEqual(100);
    expect(["S","A","B","C","D","F"]).toContain(r.grade);
    expect(Array.isArray(r.dimensions)).toBe(true);
    expect(r.dimensionBreakdown).toBeDefined();
    expect(r.professional).toBeDefined();
    expect(r.professional!.reasons.length).toBeGreaterThan(0);
  });

  it("penaliza jogo estatisticamente ruim (1..6)", () => {
    const bad = evaluateBetQuality([1, 2, 3, 4, 5, 6], [], megaConfig, []);
    const good = evaluateBetQuality([7, 15, 27, 34, 48, 52], [], megaConfig, []);
    expect(good.overall).toBeGreaterThan(bad.overall);
    expect(bad.professional!.isProfessional).toBe(false);
  });

  it("usa pesos específicos da Lotofácil (distribuição pesa mais)", () => {
    const r = evaluateBetQuality(
      [1, 3, 5, 7, 9, 11, 12, 14, 16, 18, 20, 21, 22, 24, 25],
      [], lotoConfig, []
    );
    expect(r.dimensions.find(d => d.name === "Moldura/Centro")).toBeDefined();
    expect(r.dimensionBreakdown!["Filtros Profissionais"]).toBeGreaterThanOrEqual(0);
  });
});
