import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "@/engine/stats/bet-quality";
import { Strategy, STRATEGIES, generateByStrategy } from "@/engine/strategies";

// ═══════════════════════════════════════════════════════
// Score de Robustez — avalia apostas em 6 dimensões
// com radar chart data + comparativo entre estratégias
// ═══════════════════════════════════════════════════════

export interface RobustnessAxis {
  axis: string;
  value: number; // 0-100
  label: string;
}

export interface RobustnessResult {
  bet: number[];
  strategy: string;
  overallScore: number;
  grade: "S" | "A" | "B" | "C" | "D" | "F";
  axes: RobustnessAxis[];
  qualityReport: BetQualityReport;
}

export interface StrategyComparison {
  strategy: Strategy;
  label: string;
  category: string;
  avgScore: number;
  avgAxes: RobustnessAxis[];
  sampleBets: RobustnessResult[];
  backtestHitRate: number;
  consistency: number;
}

/** Compute robustness for a single bet */
export function computeRobustness(
  bet: number[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  strategyLabel?: string
): RobustnessResult {
  const quality = evaluateBetQuality(bet, stats, config, draws);

  // Map quality dimensions to 6 radar axes
  const dimMap = new Map(quality.dimensions.map(d => [d.name, d.score]));

  const axes: RobustnessAxis[] = [
    {
      axis: "Equilíbrio",
      value: avg(dimMap.get("Equilíbrio Par/Ímpar") ?? 50, dimMap.get("Equilíbrio Alto/Baixo") ?? 50),
      label: "Paridade + Faixa",
    },
    {
      axis: "Cobertura",
      value: avg(dimMap.get("Cobertura de Faixa") ?? 50, dimMap.get("Distribuição por Setores") ?? 50),
      label: "Espalhamento + Setores",
    },
    {
      axis: "Tendência",
      value: dimMap.get("Alinhamento de Tendência") ?? 50,
      label: "Momentum recente",
    },
    {
      axis: "Soma",
      value: dimMap.get("Soma dos Números") ?? 50,
      label: "Aderência à média histórica",
    },
    {
      axis: "Originalidade",
      value: dimMap.get("Originalidade") ?? 50,
      label: "Não repetir resultados",
    },
    {
      axis: "Mix Q/F",
      value: dimMap.get("Mix Quente/Frio") ?? 50,
      label: "Proporção quentes/frios",
    },
  ];

  return {
    bet,
    strategy: strategyLabel ?? "Manual",
    overallScore: quality.overall,
    grade: quality.grade,
    axes,
    qualityReport: quality,
  };
}

/** Compare multiple strategies by generating sample bets */
export function compareStrategies(
  strategies: Strategy[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  samplesPerStrategy = 10
): StrategyComparison[] {
  return strategies.map(stratId => {
    const info = STRATEGIES.find(s => s.id === stratId)!;
    const results: RobustnessResult[] = [];

    for (let i = 0; i < samplesPerStrategy; i++) {
      const bet = generateByStrategy(stratId, stats, config);
      results.push(computeRobustness(bet, stats, config, draws, info.label));
    }

    const avgScore = results.reduce((s, r) => s + r.overallScore, 0) / results.length;

    // Average axes
    const axisCount = results[0]?.axes.length ?? 0;
    const avgAxes: RobustnessAxis[] = [];
    for (let a = 0; a < axisCount; a++) {
      const axisAvg = results.reduce((s, r) => s + r.axes[a].value, 0) / results.length;
      avgAxes.push({
        axis: results[0].axes[a].axis,
        value: Math.round(axisAvg),
        label: results[0].axes[a].label,
      });
    }

    // Consistency = inverse of score std dev
    const scoreVar = results.reduce((s, r) => s + (r.overallScore - avgScore) ** 2, 0) / results.length;
    const consistency = Math.max(0, Math.min(100, 100 - Math.sqrt(scoreVar) * 3));

    // Backtest hit rate (quick: check overlap with last 20 draws)
    const recentDraws = draws.slice(0, 20);
    let totalHits = 0;
    let totalChecks = 0;
    for (const r of results) {
      for (const d of recentDraws.slice(0, 5)) {
        const hits = r.bet.filter(n => d.numbers.includes(n)).length;
        totalHits += hits;
        totalChecks++;
      }
    }
    const backtestHitRate = totalChecks > 0 ? (totalHits / totalChecks / config.pick) * 100 : 0;

    return {
      strategy: stratId,
      label: info.label,
      category: info.category,
      avgScore: Math.round(avgScore * 10) / 10,
      avgAxes,
      sampleBets: results.slice(0, 3),
      backtestHitRate: Math.round(backtestHitRate * 10) / 10,
      consistency: Math.round(consistency),
    };
  });
}

function avg(...values: number[]): number {
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
