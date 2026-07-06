import { describe, it, expect } from "vitest";
import {
  filterSum,
  filterParity,
  filterHighLow,
  filterConsecutive,
  filterGap,
  filterPreviousRepeat,
  filterHistoricalSimilarity,
  evaluateBetProfessional,
} from "./professionalFilters";
import { getLotteryProfile } from "@/ai/knowledge/lotteryProfiles";

const mega = getLotteryProfile("megasena");
const lotofacil = getLotteryProfile("lotofacil");

describe("professionalFilters — Mega-Sena", () => {
  it("aprova jogo com soma na faixa ideal", () => {
    const bet = [7, 15, 27, 34, 48, 52]; // soma = 183
    const r = filterSum(bet, mega);
    expect(r.pass).toBe(true);
    expect(r.score).toBeGreaterThan(0.9);
  });

  it("reprova soma fora da faixa", () => {
    const bet = [1, 2, 3, 4, 5, 6]; // soma = 21
    expect(filterSum(bet, mega).pass).toBe(false);
  });

  it("penaliza excesso de consecutivos", () => {
    const bet = [10, 11, 12, 13, 14, 15];
    const r = filterConsecutive(bet, mega);
    expect(r.pass).toBe(false);
    expect(r.score).toBeLessThan(0.5);
  });

  it("aprova paridade equilibrada", () => {
    const bet = [4, 11, 22, 33, 44, 55]; // 3 pares
    expect(filterParity(bet, mega).pass).toBe(true);
  });
});

describe("professionalFilters — Lotofácil", () => {
  it("valida repetição do sorteio anterior", () => {
    const previous = { concurso: 1, date: "2024-01-01", numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] };
    const bet = [1, 2, 3, 4, 5, 6, 7, 8, 9, 16, 17, 18, 19, 20, 21]; // 9 repetidos
    const r = filterPreviousRepeat(bet, lotofacil, [previous]);
    expect(r.pass).toBe(true);
    expect(r.score).toBeGreaterThan(0.9); // ideal = 9
  });

  it("detecta semelhança histórica excessiva", () => {
    const historical = [
      { concurso: 1, date: "2024-01-01", numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    ];
    const bet = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // idêntico
    const r = filterHistoricalSimilarity(bet, lotofacil, historical);
    expect(r.pass).toBe(false);
  });
});

describe("evaluateBetProfessional", () => {
  it("retorna estrutura completa sem lançar", () => {
    const bet = [7, 15, 27, 34, 48, 52];
    const evaluation = evaluateBetProfessional(bet, "megasena", []);
    expect(evaluation.results.length).toBeGreaterThan(5);
    expect(evaluation.passRate).toBeGreaterThanOrEqual(0);
    expect(evaluation.passRate).toBeLessThanOrEqual(1);
    expect(typeof evaluation.isProfessional).toBe("boolean");
  });

  it("classifica jogo horrível como não-profissional", () => {
    const evaluation = evaluateBetProfessional([1, 2, 3, 4, 5, 6], "megasena", []);
    expect(evaluation.isProfessional).toBe(false);
  });

  it("funciona para lotteryId desconhecido (usa default)", () => {
    const evaluation = evaluateBetProfessional([7, 15, 27, 34, 48, 52], "loteria_nova", []);
    expect(evaluation).toBeDefined();
  });

  it("gap e alto/baixo respondem consistentemente", () => {
    const bet = [3, 8, 22, 31, 47, 58];
    expect(filterHighLow(bet, mega).pass).toBe(true);
    expect(filterGap(bet, mega).score).toBeGreaterThan(0.3);
  });
});
