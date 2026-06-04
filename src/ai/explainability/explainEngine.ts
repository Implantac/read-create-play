/**
 * Native AI — Explainability Engine
 * Generates human-readable explanations for all AI outputs
 */

import type { ScoredGame, WheelingResult, SimulationResult, HistoricalAnalysis } from "../core/aiTypes";
import { AI_POLICIES } from "../core/aiPolicies";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";
import { formatCurrency, formatNumber } from "../../utils/formatters";

export function explainGame(game: ScoredGame, lotteryId: string): string {
  const rules = getLotteryRules(lotteryId);
  const lines = [
    `🎯 **Jogo: ${game.numbers.join(" - ")}**`,
    `📊 Score: ${game.totalScore}/100 (Grau ${game.grade})`,
    "",
    "**Detalhamento do Score:**",
    `• Estatístico: ${game.scores.statistical}/100`,
    `• Estrutural: ${game.scores.structural}/100`,
    `• Cobertura: ${game.scores.coverage}/100`,
    `• Diversidade: ${game.scores.diversity}/100`,
    `• Aderência à estratégia: ${game.scores.strategyFit}/100`,
    `• Probabilístico: ${game.scores.probability}/100`,
    "",
    "**Análise:**",
    ...game.explanation,
    "",
    `⚠️ ${AI_POLICIES.disclaimers.general}`,
  ];
  return lines.join("\n");
}

export function explainWheeling(result: WheelingResult): string {
  const lines = [
    `🔒 **Fechamento Matemático**`,
    `📋 Base: ${formatNumber(result.baseNumbers.length)} dezenas → ${formatNumber(result.totalGames)} jogos`,
    `🎯 Garantia: ${formatNumber(result.guarantee)} pontos mínimos`,
    `💰 Custo estimado: ${formatCurrency(result.estimatedCost)}`,
    "",
    `**Validação de cobertura:**`,
    `• Cobertura: ${formatNumber(result.coverageValidation.coveragePercent)}%`,
    `• Pior caso: ${formatNumber(result.coverageValidation.worstCase)} acertos`,
    `• Combinações testadas: ${formatNumber(result.coverageValidation.testedCombinations)}`,
    "",
    result.explanation,
    "",
    `⚠️ ${AI_POLICIES.disclaimers.wheeling}`,
  ];
  return lines.join("\n");
}

export function explainSimulation(result: SimulationResult, lotteryId: string): string {
  const rules = getLotteryRules(lotteryId);
  const lines = [
    `🎲 **Resultado da Simulação**`,
    `📊 ${formatNumber(result.totalSimulations)} simulações realizadas`,
    `📈 Média geral de acertos: ${formatNumber(result.avgHits)}`,
    "",
    `**Melhor jogo:**`,
    `${result.bestGame.numbers.join(" - ")} (média: ${result.bestGame.avgHits.toFixed(2)})`,
    "",
    `**Distribuição de acertos:**`,
  ];

  const sortedHits = Object.entries(result.hitDistribution)
    .sort(([a], [b]) => Number(b) - Number(a));
  for (const [hits, count] of sortedHits) {
    const pct = (count / result.totalSimulations * 100).toFixed(2);
    lines.push(`• ${hits} acertos: ${count.toLocaleString()} vezes (${pct}%)`);
  }

  lines.push("", `⚠️ ${AI_POLICIES.disclaimers.simulation}`);
  return lines.join("\n");
}

export function explainAnalysis(analysis: HistoricalAnalysis, lotteryId: string): string {
  const lines = [
    `📊 **Análise Histórica — Últimos ${analysis.window} concursos**`,
    "",
    `**Números quentes:** ${analysis.hotNumbers.slice(0, 8).join(", ")}`,
    `**Números frios:** ${analysis.coldNumbers.slice(0, 8).join(", ")}`,
    `**Números atrasados:** ${analysis.dueNumbers.slice(0, 8).join(", ")}`,
    "",
    `📈 Soma média: ${analysis.avgSum}`,
    `📈 Pares médio: ${analysis.avgEven}`,
    `📈 Repetição média: ${analysis.avgRepeat}`,
    "",
    "**Padrões identificados:**",
    ...analysis.patterns.map(p => `• ${p}`),
    "",
    "**Recomendações:**",
    ...analysis.recommendations.map(r => `• ${r}`),
    "",
    `⚠️ ${AI_POLICIES.disclaimers.prediction}`,
  ];
  return lines.join("\n");
}

export function explainStrategy(strategyId: string): string {
  const strategies: Record<string, string> = {
    conservative: "A estratégia conservadora prioriza números com alta frequência histórica e padrões estáveis. Aplica filtros rigorosos de paridade, soma e sequência. Ideal para jogadores que buscam consistência estatística.",
    balanced: "A estratégia equilibrada combina números quentes, médios e frios em proporções balanceadas. Oferece boa cobertura sem extremos. Versátil para qualquer modalidade.",
    aggressive: "A estratégia agressiva favorece números atrasados e padrões incomuns. Maior dispersão e menor previsibilidade. Para jogadores que buscam combinações diferenciadas.",
    statistical: "Baseada puramente em análise estatística. Decisões orientadas por frequência, desvio padrão, tendência e ciclos. Sem viés subjetivo.",
    exploratory: "Explora combinações menos frequentes e padrões raros. Alta diversidade numérica. Para quem quer fugir do óbvio.",
    max_coverage: "Maximiza a dispersão numérica cobrindo o maior número de faixas possível. Ideal para fechamentos e desdobramentos.",
    anti_popular: "Evita combinações populares (datas, sequências). Reduz o rateio em caso de acerto. Baseada em anti-padrões.",
  };
  return strategies[strategyId] || strategies.balanced;
}
