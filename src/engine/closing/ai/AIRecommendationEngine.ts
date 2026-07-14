/**
 * AIRecommendationEngine — recomenda estratégia, garantia e nº ideal de jogos
 * a partir do contexto (modalidade, base disponível, orçamento, perfil de risco).
 *
 * Trabalha em duas camadas:
 *   1. `heuristicRecommendation` — puro, offline, determinístico.
 *   2. `aiRecommendation` — chama edge function `ai-closing-recommendation` para
 *      gerar racional em linguagem natural. Cai no heurístico se falhar.
 */

import type { ClosingStrategy, LotteryParams } from "../core/types";
import { schonheimBound, binomial } from "../core/combinatorics";
import { supabase } from "@/integrations/supabase/client";

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export interface RecommendationInput {
  lottery: LotteryParams;
  baseSize: number;
  budget?: number;         // R$
  ticketPrice?: number;    // R$ por jogo
  riskProfile?: RiskProfile;
  historicalDraws?: number[][];
}

export interface Recommendation {
  strategy: ClosingStrategy;
  minHits: number;
  maxGames: number;
  expectedCoverage: number;   // 0-100
  expectedROI: number;        // % relativo ao custo
  rationale: string[];
  source: "heuristic" | "ai";
  budgetFits: boolean;
}

const RISK_MULTIPLIER: Record<RiskProfile, number> = {
  conservative: 0.5,
  balanced: 1,
  aggressive: 2,
};

export function heuristicRecommendation(input: RecommendationInput): Recommendation {
  const { lottery, baseSize } = input;
  const pick = lottery.pick;
  const price = input.ticketPrice ?? lottery.ticketPrice ?? 3;
  const risk = input.riskProfile ?? "balanced";

  const minHits = Math.max(1, pick - (risk === "aggressive" ? 2 : risk === "conservative" ? 1 : 1));
  const lowerBound = schonheimBound(baseSize, pick, minHits);
  const budgetGames = input.budget ? Math.floor(input.budget / price) : Infinity;

  const targetGames = Math.min(
    Math.max(lowerBound, Math.ceil(lowerBound * RISK_MULTIPLIER[risk] * 1.4)),
    budgetGames,
  );

  const totalScenarios = binomial(baseSize, pick);
  const expectedCoverage = Math.min(99.9, 100 * (1 - Math.exp(-targetGames / Math.max(1, lowerBound))));

  const strategy: ClosingStrategy = targetGames >= 200
    ? "covering_design"
    : targetGames >= 50
      ? "genetic"
      : targetGames >= 15
        ? "simulated_annealing"
        : "greedy";

  const cost = targetGames * price;
  const expectedROI = Math.round((expectedCoverage / 100) * 200 - 100);
  const budgetFits = input.budget ? cost <= input.budget : true;

  const rationale = [
    `Base de ${baseSize} dezenas gera ${totalScenarios.toLocaleString("pt-BR")} cenários possíveis.`,
    `Lower bound de Schönheim (mínimo teórico): ${lowerBound} jogos.`,
    `Perfil ${risk}: alvo de ${targetGames} jogos (fator ${RISK_MULTIPLIER[risk]}× sobre o bound).`,
    `Cobertura esperada ~${expectedCoverage.toFixed(1)}% para garantia de ${minHits} acertos.`,
    `Estratégia sugerida: ${strategy} — melhor equilíbrio para essa escala.`,
    input.budget
      ? budgetFits
        ? `Orçamento de R$ ${input.budget.toFixed(2)} comporta o custo estimado de R$ ${cost.toFixed(2)}.`
        : `Orçamento insuficiente: ${targetGames} jogos custam R$ ${cost.toFixed(2)}, acima dos R$ ${input.budget.toFixed(2)}.`
      : "Orçamento não informado — considere definir um teto de custo.",
  ];

  return {
    strategy,
    minHits,
    maxGames: targetGames,
    expectedCoverage: Math.round(expectedCoverage * 10) / 10,
    expectedROI,
    rationale,
    source: "heuristic",
    budgetFits,
  };
}

export async function aiRecommendation(input: RecommendationInput): Promise<Recommendation> {
  const base = heuristicRecommendation(input);
  try {
    const { data, error } = await supabase.functions.invoke("ai-closing-recommendation", {
      body: { input, heuristic: base },
    });
    if (error || !data) return base;
    const payload = data as { rationale?: string[]; strategy?: ClosingStrategy; minHits?: number; maxGames?: number };
    return {
      ...base,
      strategy: payload.strategy ?? base.strategy,
      minHits: payload.minHits ?? base.minHits,
      maxGames: payload.maxGames ?? base.maxGames,
      rationale: (payload.rationale && payload.rationale.length > 0) ? payload.rationale : base.rationale,
      source: "ai",
    };
  } catch {
    return base;
  }
}
