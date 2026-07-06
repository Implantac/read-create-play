import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import {
  computeParityScore,
  computeHighLowScore,
  computeSpreadScore,
  computeFrameScore,
  computeFibonacciScore,
  computeSumScore,
  type BetQualityReport,
  type QualityDimension,
} from "./quality-metrics";
import { evaluateBetProfessional } from "@/engine/filters/professionalFilters";
import { getLotteryProfile } from "@/ai/knowledge/lotteryProfiles";

export type { BetQualityReport, QualityDimension };

/**
 * Titan Score — recalibrado na Fase 2 para consumir pesos por modalidade
 * (LOTTERY_PROFILES) e integrar a avaliação profissional (Fase 1).
 *
 * Assinatura pública INALTERADA. Novos campos `dimensionBreakdown` e
 * `professional` são opcionais em BetQualityReport para preservar
 * compatibilidade com todos os consumidores existentes.
 */
export function evaluateBetQuality(
  bet: number[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[]
): BetQualityReport {
  const profile = getLotteryProfile(config.id);
  const dimensions: QualityDimension[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  // ---- Dimensões clássicas (mantidas) -----------------------------------
  const parity = computeParityScore(bet);
  dimensions.push({ name: "Equilíbrio Par/Ímpar", ...parity });
  if (parity.ratio > 0.7 || parity.ratio < 0.3) warnings.push("Desequilíbrio forte par/ímpar");
  if (Math.abs(parity.ratio - 0.5) < 0.15) strengths.push("Excelente equilíbrio par/ímpar");

  const highLow = computeHighLowScore(bet, config.numbers);
  dimensions.push({ name: "Equilíbrio Alto/Baixo", ...highLow });
  if (highLow.ratio > 0.75 || highLow.ratio < 0.25) warnings.push("Concentração em faixa alta ou baixa");

  const spread = computeSpreadScore(bet, config.numbers);
  dimensions.push({ name: "Cobertura de Faixa", ...spread });
  if (spread.spread < config.numbers * 0.4) warnings.push("Números muito concentrados");
  if (spread.spread > config.numbers * 0.7) strengths.push("Boa cobertura do intervalo");

  if (config.id === "lotofacil") {
    const frame = computeFrameScore(bet, config);
    dimensions.push({ name: "Moldura/Centro", ...frame });
    if (frame.score < 60) warnings.push("Desequilíbrio moldura/centro");
  }

  const fibo = computeFibonacciScore(bet);
  dimensions.push({ name: "Padrão Fibonacci", ...fibo });

  const sumMetric = computeSumScore(bet, config);
  dimensions.push({ name: "Soma de Dezenas", ...sumMetric });
  if (sumMetric.score < 50) warnings.push("Soma fora da faixa ideal");

  // ---- Nova dimensão: Filtros Profissionais (Fase 1) --------------------
  const professional = evaluateBetProfessional(bet, config.id, draws);
  const profScore = Math.round(professional.averageScore * 100);
  dimensions.push({
    name: "Filtros Profissionais",
    score: profScore,
    detail: `${Math.round(professional.passRate * 100)}% dos filtros aprovados (${professional.results.length} verificações)`,
  });
  if (professional.isProfessional) strengths.push("Aprovado no crivo profissional");
  else if (professional.passRate < 0.5) warnings.push("Falha em vários filtros profissionais");

  // ---- Pesos vindos do perfil da modalidade -----------------------------
  // Mapeamento dimensão → categoria de peso do perfil
  const weightMap: Record<string, keyof typeof profile.scoreWeights> = {
    "Equilíbrio Par/Ímpar": "distribution",
    "Equilíbrio Alto/Baixo": "distribution",
    "Cobertura de Faixa": "coverage",
    "Moldura/Centro": "distribution",
    "Padrão Fibonacci": "patterns",
    "Soma de Dezenas": "patterns",
    "Filtros Profissionais": "robustness",
  };

  // Distribui o peso da categoria igualmente entre as dimensões que a compartilham
  const categoryCounts = dimensions.reduce<Record<string, number>>((acc, d) => {
    const cat = weightMap[d.name] ?? "patterns";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  let totalWeight = 0;
  const weightedScores = dimensions.map((d) => {
    const cat = weightMap[d.name] ?? "patterns";
    const w = (profile.scoreWeights[cat] ?? 10) / (categoryCounts[cat] || 1);
    totalWeight += w;
    return d.score * w;
  });

  // Bônus/penalidade global vindo do professional pass rate (até ±5 pontos)
  const professionalBonus = (professional.averageScore - 0.5) * 10;

  const raw = weightedScores.reduce((a, b) => a + b, 0) / (totalWeight || 1);
  const overall = Math.max(0, Math.min(100, Math.round(raw + professionalBonus)));

  const grade: BetQualityReport["grade"] =
    overall >= 90 ? "S" :
    overall >= 75 ? "A" :
    overall >= 60 ? "B" :
    overall >= 45 ? "C" :
    overall >= 30 ? "D" : "F";

  const dimensionBreakdown = dimensions.reduce<Record<string, number>>((acc, d) => {
    acc[d.name] = d.score;
    return acc;
  }, {});

  return {
    overall,
    dimensions,
    warnings,
    strengths,
    grade,
    dimensionBreakdown,
    professional: {
      passRate: professional.passRate,
      averageScore: professional.averageScore,
      isProfessional: professional.isProfessional,
      reasons: professional.reasons,
      warnings: professional.warnings,
    },
  };
}
