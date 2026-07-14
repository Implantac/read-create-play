/**
 * ClosingEngine — facade do Motor Universal de Fechamentos.
 *
 * API pública:
 *   - generateClosing(request)
 *   - validateClosing(games, ...)
 *   - calculateCoverage(games, ...)
 *   - calculateGuarantee(baseSize, pick, m)
 *   - compareClosings(a, b)
 */

import type {
  ClosingRequest, ClosingResult, ClosingStrategy,
  LotteryParams, ClosingValidation,
} from "./types";
import { greedyCover } from "../generators/GreedyOptimizer";
import { validateClosing as runValidation } from "../validation/ValidationEngine";
import { computeScore } from "../scoring/ScoreEngine";
import { calculateCoverage, type CoverageReport } from "./CoverageCalculator";
import { schonheimBound, binomial } from "./combinatorics";

export function generateClosing(request: ClosingRequest): ClosingResult {
  const start = performance.now();
  const strategy: ClosingStrategy = request.strategy ?? "greedy";
  const base = request.baseNumbers.slice().sort((a, b) => a - b);
  const b = base.length;
  const pick = request.lottery.pick;
  const m = request.guarantee.minHits;
  const notes: string[] = [];

  if (b < pick) {
    return emptyResult(request, strategy, start, [
      `Base insuficiente: ${b} dezenas selecionadas, mínimo ${pick}.`,
    ]);
  }
  if (m > pick) {
    return emptyResult(request, strategy, start, [
      `Garantia inválida: minHits (${m}) não pode ser maior que pick (${pick}).`,
    ]);
  }

  // Índices [0..b-1] → geramos jogos como índices, depois mapeamos para dezenas reais.
  const greedy = greedyCover(b, pick, m, { maxGames: request.maxGames });

  const gamesReal: number[][] = greedy.games.map(g => g.map(i => base[i]).sort((a, b) => a - b));

  const validation = runValidation(
    greedy.games,
    b,
    request.guarantee.hitsInBase,
    m,
  );

  const lowerBound = schonheimBound(b, pick, m);
  const elapsed = performance.now() - start;

  const score = computeScore({
    validation, gameCount: gamesReal.length, lowerBound,
    elapsedMs: elapsed, baseSize: b, pick,
  });

  if (!greedy.exhaustiveUniverse) {
    notes.push("Universo de M-subconjuntos muito grande — cobertura estimada por amostragem.");
  }
  if (!greedy.exhaustiveCandidates) {
    notes.push("Pool de candidatos amostrado (universo combinatório enorme).");
  }
  if (!validation.exhaustive) {
    notes.push("Validação por amostragem (cenários demais para checagem exaustiva).");
  }
  if (gamesReal.length === lowerBound && lowerBound > 0) {
    notes.push(`Ótimo alcançado: ${gamesReal.length} jogos = lower bound de Schönheim.`);
  }

  return {
    request,
    strategy,
    games: gamesReal,
    gameCount: gamesReal.length,
    cost: gamesReal.length * request.lottery.ticketPrice,
    validation,
    score,
    elapsedMs: Math.round(elapsed),
    lowerBound,
    notes,
  };
}

export function calculateGuarantee(baseSize: number, pick: number, m: number) {
  return {
    lowerBound: schonheimBound(baseSize, pick, m),
    universeSize: binomial(baseSize, m),
    candidatePoolSize: binomial(baseSize, pick),
  };
}

export function compareClosings(a: ClosingResult, b: ClosingResult) {
  return {
    winner: a.score.overall >= b.score.overall ? "a" : "b",
    delta: {
      overall: a.score.overall - b.score.overall,
      coverage: a.score.coverage - b.score.coverage,
      games: a.gameCount - b.gameCount,
      cost: a.cost - b.cost,
    },
  };
}

export function calculateCoverageForGames(
  games: number[][],
  base: number[],
  m: number,
): CoverageReport {
  const b = base.length;
  const idxMap = new Map(base.map((n, i) => [n, i]));
  const idxGames = games
    .map(g => g.map(n => idxMap.get(n)).filter((v): v is number => v !== undefined))
    .filter(g => g.length > 0);
  return calculateCoverage(idxGames, b, m);
}

function emptyResult(
  request: ClosingRequest, strategy: ClosingStrategy, start: number, notes: string[],
): ClosingResult {
  const elapsed = performance.now() - start;
  const validation: ClosingValidation = {
    guaranteedHits: 0, targetMinHits: request.guarantee.minHits, meetsGuarantee: false,
    coveragePercent: 0, redundancyPercent: 0, wastedCoveragePercent: 100,
    efficiencyPercent: 0, exhaustive: true, testedScenarios: 0, distribution: {},
  };
  return {
    request, strategy, games: [], gameCount: 0, cost: 0,
    validation,
    score: { coverage: 0, diversity: 0, redundancy: 0, efficiency: 0, time: 0, overall: 0 },
    elapsedMs: Math.round(elapsed), lowerBound: 0, notes,
  };
}

export function lotteryParamsFrom(
  id: string, name: string, totalNumbers: number, pick: number, ticketPrice: number,
): LotteryParams {
  return { id, name, totalNumbers, pick, ticketPrice };
}
