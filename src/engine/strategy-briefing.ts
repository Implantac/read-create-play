import type { DrawResult, LotteryConfig } from "@/data/lotteries";
import type { NumberStats } from "@/engine/statistics";
import { calculateAnalyticsSnapshot } from "@/engine/analytics-core";

export type StrategyBriefingTone = "conservative" | "balanced" | "aggressive";

export interface StrategyBriefing {
  confidenceScore: number;
  dataDepthLabel: string;
  riskLabel: string;
  recommendedTone: StrategyBriefingTone;
  headline: string;
  summary: string;
  strategyMix: Array<{
    label: string;
    weight: number;
    reason: string;
  }>;
  operatingPlan: string[];
  commercialSignal: string;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function asPercent(value: number) {
  return `${Math.round(clamp(value))}%`;
}

export function buildStrategyBriefing(
  config: LotteryConfig,
  stats: NumberStats[],
  draws: DrawResult[],
): StrategyBriefing {
  const analytics = calculateAnalyticsSnapshot(stats, draws);
  const historicalDepth = draws.length;
  const confidenceScore = clamp(
    analytics.institutionalConfidence * 0.42 +
    (100 - analytics.volatilityIndex) * 0.22 +
    (100 - analytics.saturationScore) * 0.18 +
    Math.min(100, historicalDepth / 10) * 0.18,
  );

  const hotPressure = stats.length > 0 ? (analytics.hotNumbers / stats.length) * 100 : 0;
  const coldPressure = stats.length > 0 ? (analytics.coldNumbers / stats.length) * 100 : 0;
  const riskScore = clamp(
    analytics.volatilityIndex * 1.8 +
    analytics.saturationScore * 0.9 +
    Math.max(0, 45 - analytics.institutionalConfidence) * 0.7,
  );

  const recommendedTone: StrategyBriefingTone =
    riskScore > 58 ? "conservative" : analytics.momentumIndex > 18 && confidenceScore > 55 ? "aggressive" : "balanced";

  const riskLabel = riskScore > 58 ? "Risco alto" : riskScore > 32 ? "Risco moderado" : "Risco controlado";
  const dataDepthLabel =
    historicalDepth >= 500 ? "Base historica ampla" :
    historicalDepth >= 120 ? "Base historica consistente" :
    historicalDepth >= 40 ? "Base historica util" :
    "Base historica curta";

  const strategyMix = [
    {
      label: "Backtest historico",
      weight: recommendedTone === "conservative" ? 40 : 30,
      reason: "Valida estrategias contra concursos anteriores antes de apostar dinheiro real.",
    },
    {
      label: "Filtros estatisticos",
      weight: recommendedTone === "aggressive" ? 25 : 30,
      reason: `Equilibra frequencia, atraso e distribuicao para ${config.name}.`,
    },
    {
      label: "Simulacao massiva",
      weight: recommendedTone === "aggressive" ? 30 : 20,
      reason: "Compara milhares de combinacoes e reduz dependencia de palpites isolados.",
    },
    {
      label: "Orcamento controlado",
      weight: recommendedTone === "conservative" ? 25 : 20,
      reason: "Define limite de jogos por concurso e preserva disciplina de banca.",
    },
  ];

  const headline =
    recommendedTone === "conservative"
      ? "Priorize validacao antes de ampliar volume"
      : recommendedTone === "aggressive"
        ? "Cenario favoravel para testar combinacoes mais amplas"
        : "Combine geracao inteligente com conferencia historica";

  const operatingPlan = [
    `Gerar ${recommendedTone === "conservative" ? "poucos jogos de alta disciplina" : "lotes comparaveis"} com filtros de paridade, soma e atraso.`,
    "Rodar backtest antes de salvar a estrategia como recorrente.",
    "Conferir resultados apos cada sorteio e manter apenas estrategias com performance documentada.",
  ];

  return {
    confidenceScore: Math.round(confidenceScore),
    dataDepthLabel,
    riskLabel,
    recommendedTone,
    headline,
    summary:
      `${historicalDepth} concursos processados, ${asPercent(hotPressure)} de dezenas quentes e ` +
      `${asPercent(coldPressure)} de dezenas frias. Use o sistema como laboratorio estatistico, nao como promessa de premio.`,
    strategyMix,
    operatingPlan,
    commercialSignal:
      "Diferencial competitivo: mostrar a justificativa, o teste historico e o custo operacional de cada estrategia.",
  };
}
