/**
 * Native Analysis Engine v2.0 — Enhanced Lottery Intelligence
 * Advanced statistical generation with lottery-specific knowledge,
 * Markov transitions, co-occurrence, cycle awareness, and multi-strategy diversity.
 * Replaces all AI gateway calls with deterministic, statistical processing.
 */

import { NumberStats } from "@/features/statistics/engine";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { getLotteryRules, PRIMES, FIBONACCI, LOTOFACIL_FRAME, LOTOFACIL_CENTER } from "@/ai/knowledge/lotteriesKnowledge";
import { buildConditionalNetwork, scoreByBayesianNetwork, computeMutualInformation } from "@/ai/engines/bayesianNetworkEngine";
import { computeZoneEntropy, computeGapEntropy } from "@/ai/engines/entropyEngine";
import { PatternReport } from "./pattern-detector";
import type { AINumberRanking } from "./autonomous-ai";

interface SimulationBet {
  bet?: number[];
  numbers?: number[];
  avgHits: number;
  bestHit: number;
  prizeCount?: number;
  stability?: number;
  score?: number;
  [key: string]: any;
}

interface SimulationData {
  bets: any[];
  totalDraws: number;
  [key: string]: any;
}

interface DistributionSummary {
  avgSum: number;
  avgEvenRatio: number;
  avgSpread: number;
  avgPrizeRate: number;
  bestHitOverall: number;
  [key: string]: any;
}

interface PatternInsights {
  dominantParity?: string;
  sumTrend?: string;
  [key: string]: any;
}

interface AutonomousReport {
  rankings?: AINumberRanking[];
  patterns?: any[];
  shifts?: any[];
  entropyAnalysis?: any;
  chiSquareResult?: any;
  gapAnalysis?: any[];
  markovTransitions?: any[];
  topCooccurrences?: any[];
  confidenceScore?: number;
  [key: string]: any;
}

// ═══════════════════════════════════════════
// ADVANCED HELPERS
// ═══════════════════════════════════════════

/** Build Markov transition matrix from draws */
function buildMarkovMatrix(draws: DrawResult[], totalNumbers: number): Map<number, Map<number, number>> {
  const transitions = new Map<number, Map<number, number>>();
  for (let i = 1; i < draws.length; i++) {
    const prev = new Set(draws[i].numbers);
    const curr = draws[i - 1].numbers;
    for (const p of prev) {
      if (!transitions.has(p)) transitions.set(p, new Map());
      const row = transitions.get(p)!;
      for (const c of curr) {
        row.set(c, (row.get(c) || 0) + 1);
      }
    }
  }
  return transitions;
}

/** Get top Markov successors for a set of numbers */
function getMarkovSuccessors(lastDraw: number[], markov: Map<number, Map<number, number>>, topN: number): { number: number; score: number }[] {
  const scores = new Map<number, number>();
  for (const num of lastDraw) {
    const row = markov.get(num);
    if (!row) continue;
    for (const [target, count] of row) {
      scores.set(target, (scores.get(target) || 0) + count);
    }
  }
  return [...scores.entries()]
    .map(([number, score]) => ({ number, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/** Build co-occurrence matrix from draws */
function buildCooccurrenceMap(draws: DrawResult[], topN: number): Map<string, number> {
  const pairs = new Map<string, number>();
  for (const d of draws.slice(0, 200)) {
    const nums = d.numbers;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${Math.min(nums[i], nums[j])}-${Math.max(nums[i], nums[j])}`;
        pairs.set(key, (pairs.get(key) || 0) + 1);
      }
    }
  }
  return pairs;
}

/** Get co-occurrence boost for a game */
function cooccurrenceBoost(game: number[], cooccMap: Map<string, number>): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i < game.length; i++) {
    for (let j = i + 1; j < game.length; j++) {
      const key = `${Math.min(game[i], game[j])}-${Math.max(game[i], game[j])}`;
      total += cooccMap.get(key) || 0;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

/** Count repeats from previous draw */
function countRepeats(game: number[], lastDraw: number[]): number {
  return game.filter(n => lastDraw.includes(n)).length;
}

/** Compute ideal repeat count based on lottery rules */
function idealRepeatCount(config: LotteryConfig): [number, number] {
  const rules = getLotteryRules(config.id);
  return rules.avgRepeatFromPrevious || [Math.floor(config.pick * 0.2), Math.ceil(config.pick * 0.45)];
}

/** Check frame/center balance for Lotofácil */
function frameBalance(game: number[], lotteryId: string): number {
  if (lotteryId !== 'lotofacil') return 1;
  const frameCount = game.filter(n => LOTOFACIL_FRAME.has(n)).length;
  const centerCount = game.filter(n => LOTOFACIL_CENTER.has(n)).length;
  const rules = getLotteryRules(lotteryId);
  const idealFrame = rules.idealFrameRange || [8, 11];
  if (frameCount >= idealFrame[0] && frameCount <= idealFrame[1]) return 1;
  return 0.7;
}

/** Compute consecutive sequences count */
function maxConsecutive(game: number[]): number {
  let max = 1, cur = 1;
  for (let i = 1; i < game.length; i++) {
    if (game[i] - game[i - 1] === 1) { cur++; max = Math.max(max, cur); }
    else cur = 1;
  }
  return max;
}

/** Sum deviation score (0-1, 1 = perfect) */
function sumScore(game: number[], lotteryId: string): number {
  const rules = getLotteryRules(lotteryId);
  const sum = game.reduce((a, b) => a + b, 0);
  if (rules.idealSumRange) {
    const [lo, hi] = rules.idealSumRange;
    if (sum >= lo && sum <= hi) return 1;
    const mid = (lo + hi) / 2;
    const range = hi - lo;
    return Math.max(0, 1 - Math.abs(sum - mid) / range);
  }
  return 0.5;
}

/** Prime ratio in game */
function primeRatio(game: number[]): number {
  return game.filter(n => PRIMES.has(n)).length / game.length;
}

/** Fibonacci ratio in game */
function fibRatio(game: number[]): number {
  return game.filter(n => FIBONACCI.has(n)).length / game.length;
}

// ═══════════════════════════════════════════
// PATTERN ANALYSIS (text report)
// ═══════════════════════════════════════════
export function generatePatternAnalysis(
  report: PatternReport,
  config: LotteryConfig,
  drawCount: number
): string {
  const { summary, parityPatterns, sumPatterns, consecutivePatterns, spatialDistribution, hotStreaks, frequencyTrends } = report;

  const top10Trending = (frequencyTrends || []).slice(0, 10);
  const rising = top10Trending.filter((f: any) => f.momentum > 0);
  const declining = top10Trending.filter((f: any) => f.momentum < 0);

  const bestParity = parityPatterns?.[0];
  const sumRange = sumPatterns?.find((s: any) => s.count === Math.max(...sumPatterns.map((p: any) => p.count)));

  let md = `## 📊 Análise de Padrões — ${config.name}\n\n`;
  md += `Análise baseada nos últimos **${drawCount}** concursos.\n\n`;

  if (bestParity) {
    md += `### Paridade\nPadrão dominante: **${bestParity.evens}P/${bestParity.odds}I** (${bestParity.percentage.toFixed(1)}% dos sorteios)\n\n`;
  }
  if (sumRange) {
    md += `### Soma\nFaixa mais frequente: **${sumRange.rangeLabel}** (${sumRange.percentage.toFixed(1)}%)\nSoma média: **${summary?.avgSum?.toFixed(0) || 'N/A'}** | Desvio: **${summary?.sumStdDev?.toFixed(1) || 'N/A'}**\n\n`;
  }
  if (consecutivePatterns?.length) {
    const mostCommon = consecutivePatterns[0];
    md += `### Sequências Consecutivas\nPadrão mais comum: **${mostCommon.occurrences}** ocorrências com ${mostCommon.consecutiveCount} consecutivos (${mostCommon.percentage.toFixed(1)}%)\n\n`;
  }
  if (spatialDistribution?.sectors?.length) {
    md += `### Distribuição Espacial\n`;
    spatialDistribution.sectors.forEach((s: any) => {
      md += `- **${s.label}**: média ${s.avgCount.toFixed(1)} dezenas\n`;
    });
    md += `\n`;
  }
  if (rising.length > 0) {
    md += `### 🔥 Dezenas em Alta\n`;
    md += rising.map((f: any) => `**${String(f.number).padStart(2, '0')}** (momentum: +${f.momentum.toFixed(1)})`).join(', ') + '\n\n';
  }
  if (declining.length > 0) {
    md += `### ❄️ Dezenas em Declínio\n`;
    md += declining.map((f: any) => `**${String(f.number).padStart(2, '0')}** (momentum: ${f.momentum.toFixed(1)})`).join(', ') + '\n\n';
  }
  if (report.cooccurrenceMatrix?.length > 0) {
    md += `### 🔗 Pares Frequentes\n`;
    report.cooccurrenceMatrix.slice(0, 8).forEach((c: any) => {
      md += `- **(${String(c.num1).padStart(2, '0')}, ${String(c.num2).padStart(2, '0')})**: ${c.count}x (lift: ${c.lift?.toFixed(2) || 'N/A'})\n`;
    });
    md += `\n`;
  }
  if (report.cycleDetection?.length > 0) {
    const overdue = report.cycleDetection.filter((c: any) => c.status === 'overdue');
    if (overdue.length > 0) {
      md += `### ⏰ Dezenas Atrasadas (Overdue)\n`;
      md += overdue.slice(0, 10).map((c: any) => `**${String(c.number).padStart(2, '0')}** (atraso: ${c.currentGap}, média: ${c.avgCycle.toFixed(1)})`).join(', ') + '\n\n';
    }
  }
  if (summary?.overallScore !== undefined) {
    md += `### 🎯 Score Geral dos Dados\n`;
    md += `**${summary.overallScore}/100** — ${summary.overallScore >= 70 ? 'Dados de alta qualidade com padrões claros' : summary.overallScore >= 50 ? 'Dados moderados, padrões parciais' : 'Dados ruidosos, recomenda-se cautela'}\n\n`;
  }
  md += `---\n*Análise gerada pelo motor estatístico nativo v2.0. Sem custo de créditos.*`;
  return md;
}

// ═══════════════════════════════════════════
// SIMULATION ANALYSIS (text report)
// ═══════════════════════════════════════════
export function generateSimulationAnalysis(
  simulationData: SimulationData,
  config: LotteryConfig
): string {
  const bets = simulationData.bets || [];
  const totalDraws = simulationData.totalDraws || 0;

  if (bets.length === 0) return "Sem dados de simulação disponíveis.";

  const avgHits = bets.reduce((s: number, b: any) => s + b.avgHits, 0) / bets.length;
  const bestOverall = Math.max(...bets.map((b: any) => b.bestHit || 0));
  const totalPrizes = bets.reduce((s: number, b: any) => s + (b.prizeCount || 0), 0);
  const avgPrizeRate = (totalPrizes / (bets.length * Math.max(totalDraws, 1)) * 100);

  const ranked = [...bets].sort((a: any, b: any) => (b.avgHits + b.bestHit * 0.5) - (a.avgHits + a.bestHit * 0.5));
  const best3 = ranked.slice(0, 3);

  let md = `## 📈 Análise da Simulação — ${config.name}\n\n`;
  md += `**${bets.length} apostas** simuladas contra **${totalDraws} concursos**\n\n`;
  md += `### Métricas Gerais\n`;
  md += `- Acertos médios: **${avgHits.toFixed(2)}** de ${config.pick}\n`;
  md += `- Melhor acerto: **${bestOverall}** de ${config.pick}\n`;
  md += `- Total de premiações: **${totalPrizes}**\n`;
  md += `- Taxa de premiação: **${avgPrizeRate.toFixed(2)}%**\n\n`;

  md += `### 🏆 Top 3 Apostas\n`;
  best3.forEach((b: any, i: number) => {
    md += `${i + 1}. [${(b.bet || []).map((n: number) => String(n).padStart(2, '0')).join(', ')}] — Média: ${b.avgHits.toFixed(2)}, Melhor: ${b.bestHit}, Prêmios: ${b.prizeCount || 0}\n`;
  });
  md += `\n`;

  const stableBets = bets.filter((b: any) => (b.stability || 0) > 0.7);
  md += `### Estabilidade\n**${stableBets.length}** de ${bets.length} apostas têm alta estabilidade (>70%)\n\n`;

  md += `### 💡 Recomendações\n`;
  if (avgPrizeRate > 5) md += `- ✅ Taxa de premiação acima de 5% — bom desempenho geral\n`;
  else md += `- ⚠️ Taxa de premiação baixa — considere ajustar as estratégias\n`;
  if (bestOverall >= config.pick - 2) md += `- 🎯 Acertos próximos ao máximo detectados — estratégia promissora\n`;
  md += `- Priorize as apostas do ranking superior para uso real\n`;
  md += `- Combine apostas estáveis com apostas agressivas para diversificação\n\n`;
  md += `---\n*Análise gerada pelo motor estatístico nativo v2.0.*`;
  return md;
}

// ═══════════════════════════════════════════
// MASSIVE SIMULATION ANALYSIS (text report)
// ═══════════════════════════════════════════
export function generateMassiveSimAnalysis(
  topGames: SimulationBet[],
  patternInsights: PatternInsights,
  distributionSummary: DistributionSummary,
  config: LotteryConfig,
  totalGenerated: number,
  totalEvaluated: number
): string {
  const numFreq: Record<number, number> = {};
  topGames.forEach((g: any) => {
    (g.numbers || []).forEach((n: number) => { numFreq[n] = (numFreq[n] || 0) + 1; });
  });

  const topNumbers = Object.entries(numFreq).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const bottomNumbers = Object.entries(numFreq).sort((a, b) => a[1] - b[1]).slice(0, 10);

  let md = `## 🚀 Análise da Simulação Massiva — ${config.name}\n\n`;
  md += `**${totalGenerated.toLocaleString()}** jogos gerados → **${totalEvaluated.toLocaleString()}** avaliados → **Top ${topGames.length}** selecionados\n\n`;

  md += `### 🎯 Dezenas "Must-Have"\n`;
  topNumbers.forEach(([n, freq]) => {
    const pct = (freq / topGames.length * 100).toFixed(0);
    const bar = Number(pct) >= 80 ? '🔥' : Number(pct) >= 60 ? '✅' : '➖';
    md += `- ${bar} **${String(n).padStart(2, '0')}**: ${pct}% dos top jogos (${freq}x)\n`;
  });
  md += `\n`;

  md += `### ❌ Dezenas "Tóxicas"\n`;
  bottomNumbers.forEach(([n, freq]) => {
    md += `- **${String(n).padStart(2, '0')}**: apenas ${freq}x nos top jogos\n`;
  });
  md += `\n`;

  if (distributionSummary) {
    md += `### 📊 Distribuição dos Top Jogos\n`;
    md += `- Soma média: **${distributionSummary.avgSum?.toFixed(0) || 'N/A'}**\n`;
    md += `- Ratio par/ímpar: **${((distributionSummary.avgEvenRatio || 0) * 100).toFixed(0)}%** pares\n`;
    md += `- Spread médio: **${distributionSummary.avgSpread?.toFixed(0) || 'N/A'}**\n`;
    md += `- Taxa de premiação: **${(distributionSummary.avgPrizeRate || 0).toFixed(2)}%**\n`;
    md += `- Melhor acerto geral: **${distributionSummary.bestHitOverall || 0}** de ${config.pick}\n\n`;
  }

  if (patternInsights) {
    md += `### 🔍 Padrões Detectados\n`;
    if (patternInsights.dominantParity) md += `- Paridade dominante: **${patternInsights.dominantParity}**\n`;
    if (patternInsights.sumTrend) md += `- Tendência de soma: **${patternInsights.sumTrend}**\n`;
    md += `\n`;
  }

  md += `### 🏆 Top 5 Jogos\n`;
  topGames.slice(0, 5).forEach((g: any, i: number) => {
    md += `${i + 1}. [${(g.numbers || []).map((n: number) => String(n).padStart(2, '0')).join(', ')}] — Score: **${g.score?.toFixed(0) || 'N/A'}**\n`;
  });
  md += `\n`;

  md += `### 💡 Como Usar\n`;
  md += `- Priorize dezenas "must-have" na construção de apostas\n`;
  md += `- Evite concentrar dezenas "tóxicas" no mesmo jogo\n`;
  md += `- Os top 5 jogos representam as combinações mais otimizadas\n`;
  md += `- Use como base para fechamentos matemáticos\n\n`;
  md += `---\n*Análise gerada pelo motor estatístico nativo v2.0.*`;
  return md;
}

/**
 * Monte Carlo Strategy Comparison Analysis — v3.0
 */
export function generateMonteCarloAnalysis(
  result: any, // MonteCarloResult
  config: LotteryConfig
): string {
  const { performances, robustnessScore, yearlyProjection } = result;
  if (!performances || performances.length === 0) return "Sem dados de simulação.";

  const top = performances[0];
  const avgROI = performances.reduce((s: number, p: any) => s + p.expectedValue, 0) / performances.length;
  
  let md = `## 🧬 Relatório de Viabilidade Monte Carlo — ${config.name}\n\n`;
  md += `Análise de **robustez estratégica** baseada em ${result.totalIterations.toLocaleString()} simulações.\n\n`;

  md += `### 🏅 Estratégia Dominante: **${top.label}**\n`;
  md += `- Expectativa de Valor (ROI): **${top.expectedValue.toFixed(2)}x**\n`;
  md += `- Consistência do Algoritmo: **${(top.consistency * 100).toFixed(1)}%**\n`;
  md += `- Melhor acerto simulado: **${top.bestHit}** de ${config.pick}\n\n`;

  md += `### 🛡️ Robustez do Sistema: **${robustnessScore}/100**\n`;
  if (robustnessScore >= 80) {
    md += `O sistema apresenta **alta estabilidade**. As médias de acerto são resilientes a variações estatísticas.\n\n`;
  } else if (robustnessScore >= 50) {
    md += `O sistema apresenta **estabilidade moderada**. Alguma volatilidade é esperada em curto prazo.\n\n`;
  } else {
    md += `O sistema apresenta **baixa estabilidade**. Resultados podem variar significativamente entre ciclos.\n\n`;
  }

  md += `### 📅 Projeção de Longo Prazo\n`;
  const bestYear = yearlyProjection.find((p: any) => p.strategy === top.label);
  if (bestYear) {
    md += `Seguindo a estratégia **${top.label}** (156 jogos/ano):\n`;
    md += `- Expectativa de Quadras/Ternos (4+): **~${bestYear.expectedHits4Plus.toFixed(1)}** por ano\n`;
    md += `- Retorno Financeiro Estimado: **${bestYear.roi.toFixed(2)}x** o capital investido\n\n`;
  }

  md += `### ⚖️ Comparativo de Performance\n`;
  performances.slice(0, 5).forEach((p: any) => {
    const diff = p.expectedValue - avgROI;
    const diffLabel = diff > 0 ? `(+${diff.toFixed(2)})` : `(${diff.toFixed(2)})`;
    md += `- **${p.label}**: ${p.expectedValue.toFixed(2)}x ${diffLabel}\n`;
  });
  md += `\n`;

  md += `### 💡 Conclusão Técnica\n`;
  if (top.expectedValue > 1.2) {
    md += `🚀 **Sinal de Compra**: A estratégia ${top.label} demonstra uma vantagem estatística clara sobre o aleatório.\n`;
  } else {
    md += `⚖️ **Sinal Neutro**: As estratégias estão próximas da paridade matemática. Recomendado usar fechamentos para aumentar as chances.\n`;
  }
  md += `\n---\n*Relatório gerado pelo Motor Monte Carlo v3.0.*`;

  return md;
}

// ═══════════════════════════════════════════
// AUTONOMOUS AI ANALYSIS (text report + 10 games)
// ═══════════════════════════════════════════
export function generateAutonomousAnalysis(
  report: AutonomousReport,
  config: LotteryConfig
): string {
  const topRankings = report.rankings?.slice(0, 25) || [];
  const patterns = report.patterns || [];
  const shifts = report.shifts?.slice(0, 15) || [];
  const entropy = report.entropyAnalysis || {};
  const chiSquare = report.chiSquareResult || {};
  const gaps = report.gapAnalysis?.slice(0, 15) || [];
  const markov = report.markovTransitions?.slice(0, 15) || [];
  const cooccurrences = report.topCooccurrences?.slice(0, 10) || [];
  const rules = getLotteryRules(config.id);

  const tierS = topRankings.filter((r: any) => r.compositeScore >= 80);
  const tierA = topRankings.filter((r: any) => r.compositeScore >= 60 && r.compositeScore < 80);

  let md = `## 🧠 Análise Autônoma Profunda — ${config.name}\n\n`;
  md += `Score de confiança: **${report.confidenceScore || 0}/100**\n`;
  md += `Metodologia: Frequência + Markov + Entropia + Chi² + Ciclos + Co-ocorrência\n\n`;

  // Rankings
  md += `### 🏅 Ranking de Dezenas\n`;
  if (tierS.length > 0) {
    md += `**Tier S** (score ≥80): ${tierS.map((r: any) => `**${String(r.number).padStart(2, '0')}** (${r.compositeScore})`).join(', ')}\n\n`;
  }
  if (tierA.length > 0) {
    md += `**Tier A** (score ≥60): ${tierA.map((r: any) => `**${String(r.number).padStart(2, '0')}** (${r.compositeScore})`).join(', ')}\n\n`;
  }

  // Entropy
  if (entropy.entropy !== undefined) {
    const entropyPct = ((entropy.entropy / Math.log2(config.numbers)) * 100).toFixed(1);
    md += `### 📐 Análise de Entropia\nEntropia: **${entropy.entropy?.toFixed(3) || 'N/A'}** (${entropyPct}% da máxima)\n`;
    md += `${Number(entropyPct) > 95 ? '✅ Distribuição muito uniforme' : Number(entropyPct) > 85 ? '⚠️ Leve concentração' : '❌ Concentração significativa'}\n\n`;
  }

  // Chi-square
  if (chiSquare.chiSquare !== undefined) {
    md += `### 📊 Teste Chi-Quadrado\nχ² = **${chiSquare.chiSquare?.toFixed(2) || 'N/A'}** | p-valor = **${chiSquare.pValue?.toFixed(4) || 'N/A'}**\n`;
    md += `${(chiSquare.pValue || 1) > 0.05 ? '✅ Sem evidência de não-aleatoriedade' : '⚠️ Distribuição não-uniforme detectada'}\n\n`;
  }

  // Gaps
  if (gaps.length > 0) {
    const overdue = gaps.filter((g: any) => g.currentGap > g.avgGap * 1.3);
    if (overdue.length > 0) {
      md += `### ⏰ Dezenas Atrasadas\n${overdue.map((g: any) => `**${String(g.number).padStart(2, '0')}** (gap: ${g.currentGap}, média: ${g.avgGap.toFixed(1)})`).join(', ')}\n\n`;
    }
  }

  // Markov
  if (markov.length > 0) {
    md += `### 🔗 Transições de Markov\nTop transições: ${markov.slice(0, 8).map((m: any) => `${String(m.from).padStart(2, '0')}→${String(m.to).padStart(2, '0')} (${m.count}x)`).join(', ')}\n\n`;
  }

  // Patterns
  if (patterns.length > 0) {
    md += `### 🔍 Padrões Detectados\n`;
    patterns.slice(0, 5).forEach((p: any) => {
      md += `- **${p.type || p.name}**: ${p.description || `Score: ${p.score || 'N/A'}`}\n`;
    });
    md += `\n`;
  }

  // Shifts
  if (shifts.length > 0) {
    md += `### 📈 Mudanças de Regime\n`;
    const risingShifts = shifts.filter((s: any) => s.direction === 'up' || s.shift > 0);
    const fallingShifts = shifts.filter((s: any) => s.direction === 'down' || s.shift < 0);
    if (risingShifts.length > 0) md += `Em alta: ${risingShifts.slice(0, 5).map((s: any) => `**${String(s.number).padStart(2, '0')}**`).join(', ')}\n`;
    if (fallingShifts.length > 0) md += `Em queda: ${fallingShifts.slice(0, 5).map((s: any) => `**${String(s.number).padStart(2, '0')}**`).join(', ')}\n`;
    md += `\n`;
  }

  md += `### 💡 Recomendações Estratégicas\n`;
  md += `- Priorize dezenas Tier S e A como núcleo das apostas\n`;
  md += `- Inclua 1-2 dezenas atrasadas (overdue) para diversificação\n`;
  md += `- Respeite transições de Markov para sequências prováveis\n`;
  md += `- Mantenha soma dentro da faixa ideal: **${rules.idealSumRange?.[0] || '?'}–${rules.idealSumRange?.[1] || '?'}**\n`;
  md += `- Paridade ideal: **${rules.idealParityRange?.[0] || '?'}–${rules.idealParityRange?.[1] || '?'}** pares\n`;
  if (config.id === 'lotofacil') {
    md += `- Moldura/Centro ideal: **${rules.idealFrameRange?.[0] || 8}–${rules.idealFrameRange?.[1] || 11}** na moldura\n`;
  }
  md += `\n`;

  // Generate 10 games using enhanced strategy
  const allRanked = topRankings.map((r: any) => r.number);
  const overdueList = gaps.filter((g: any) => g.isOverdue || g.currentGap > (g.avgGap || 5) * 1.2).map((g: any) => g.number);
  const markovFavored = markov.slice(0, 10).map((m: any) => m.to);

  md += `## 🎯 10 JOGOS OTIMIZADOS\n\n`;

  const strategies = [
    { name: 'Conservador', desc: 'Núcleo Tier S/A, alta frequência' },
    { name: 'Conservador', desc: 'Frequência + co-ocorrência forte' },
    { name: 'Conservador', desc: 'Estabilidade máxima, soma ideal' },
    { name: 'Equilibrado', desc: 'Mix frequência + Markov + ciclos' },
    { name: 'Equilibrado', desc: 'Transições de Markov + momentum' },
    { name: 'Equilibrado', desc: 'Dispersão otimizada + primos' },
    { name: 'Agressivo', desc: 'Overdue + momentum positivo' },
    { name: 'Agressivo', desc: 'Anti-padrão + dezenas em alta' },
    { name: 'Contrário', desc: 'Dezenas frias com ciclo favorável' },
    { name: 'Cobertura Máxima', desc: 'Máxima dispersão + Fibonacci' },
  ];

  const seenGames = new Set<string>();
  let gameIndex = 0;

  for (let g = 0; g < 10; g++) {
    let pool = [...allRanked];

    // Enrich pool based on strategy
    if (g >= 3 && g < 6) {
      markovFavored.forEach((n: number) => { if (!pool.includes(n)) pool.push(n); });
    }
    if (g >= 6 && g < 8) {
      overdueList.forEach((n: number) => { if (!pool.includes(n)) pool.push(n); });
    }
    if (g === 8) {
      // Contrarian: reverse ranking
      pool = [...allRanked].reverse();
      overdueList.forEach((n: number) => { if (!pool.includes(n)) pool.unshift(n); });
    }
    if (g === 9) {
      // Max coverage: spread across all ranges
      const rangeSize = Math.ceil(config.numbers / 5);
      pool = [];
      for (let r = 0; r < 5; r++) {
        const lo = r * rangeSize + 1;
        const hi = Math.min((r + 1) * rangeSize, config.numbers);
        const rangeNums = allRanked.filter((n: number) => n >= lo && n <= hi);
        pool.push(...rangeNums.slice(0, Math.ceil(config.pick / 5) + 1));
      }
      // Add Fibonacci
      FIBONACCI.forEach(n => { if (n <= config.numbers && !pool.includes(n)) pool.push(n); });
    }

    // Ensure enough in pool
    if (pool.length < config.pick) {
      for (let n = 1; n <= config.numbers; n++) {
        if (!pool.includes(n)) pool.push(n);
        if (pool.length >= config.pick * 2) break;
      }
    }

    // Generate game with bias
    let bestGame: number[] | null = null;
    let bestScore = -1;

    for (let attempt = 0; attempt < 200; attempt++) {
      const game: number[] = [];
      const available = [...pool];

      while (game.length < config.pick && available.length > 0) {
        const bias = g < 3 ? 0.75 : g < 6 ? 0.5 : 0.3;
        const idx = Math.random() < bias
          ? Math.floor(Math.random() * Math.min(available.length, Math.ceil(config.pick * 1.5)))
          : Math.floor(Math.random() * available.length);
        const safeIdx = Math.min(idx, available.length - 1);
        const num = available[safeIdx];
        if (!game.includes(num) && num >= 1 && num <= config.numbers) {
          game.push(num);
        }
        available.splice(safeIdx, 1);
      }

      while (game.length < config.pick) {
        const n = Math.floor(Math.random() * config.numbers) + 1;
        if (!game.includes(n)) game.push(n);
      }

      game.sort((a, b) => a - b);
      const key = game.join(',');
      if (seenGames.has(key)) continue;

      // Score this game
      let score = 0;
      // Sum score
      score += sumScore(game, config.id) * 25;
      // Parity
      const evens = game.filter(n => n % 2 === 0).length;
      const idealParity = rules.idealParityRange || [Math.floor(config.pick * 0.4), Math.ceil(config.pick * 0.6)];
      if (evens >= idealParity[0] && evens <= idealParity[1]) score += 20;
      else score += 10;
      // Consecutive
      const maxSeq = maxConsecutive(game);
      if (maxSeq <= (rules.maxRecommendedSequence || 3)) score += 15;
      else score += 5;
      // Frame balance (Lotofácil)
      score += frameBalance(game, config.id) * 10;
      // Ranking position bonus
      const rankedSet = new Set(allRanked.slice(0, config.pick + 5));
      const inRanked = game.filter(n => rankedSet.has(n)).length;
      score += (inRanked / config.pick) * 20;
      // Prime/Fib bonus
      score += primeRatio(game) * 5;
      score += fibRatio(game) * 5;

      if (score > bestScore) {
        bestScore = score;
        bestGame = game;
      }
    }

    if (!bestGame) continue;
    const key = bestGame.join(',');
    if (seenGames.has(key)) continue;
    seenGames.add(key);

    gameIndex++;
    const confidence = Math.round(Math.min(95, bestScore));
    const nums = bestGame.map(n => String(n).padStart(2, '0')).join(', ');
    const sum = bestGame.reduce((a, b) => a + b, 0);
    const evens = bestGame.filter(n => n % 2 === 0).length;
    const primes = bestGame.filter(n => PRIMES.has(n)).length;

    md += `GAME_START\nJogo ${gameIndex} - ${strategies[g].name} (Confiança: ${confidence}/100)\n`;
    md += `Estratégia: ${strategies[g].desc}\n`;
    md += `Dezenas: ${nums}\n`;
    md += `Soma: ${sum} | Pares: ${evens} | Primos: ${primes}\n`;
    md += `GAME_END\n\n`;
  }

  md += `---\n*Análise gerada pelo motor estatístico nativo v2.0 com Markov + Entropia + Co-ocorrência.*`;
  return md;
}

// ═══════════════════════════════════════════
// NATIVE BET GENERATION v2.0 (enhanced)
// ═══════════════════════════════════════════
export function generateNativeBets(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  count: number
): { bets: number[][]; analysis: string; quality: { avgScore: number; scores: number[]; details?: string[][]; grade: string } } {
  const rules = getLotteryRules(config.id);
  const minNum = config.name === "Super Sete" ? 0 : 1;
  const allNums = Array.from({ length: config.numbers - minNum + 1 }, (_, i) => i + minNum);

  // Frequency maps
  const freq50: Record<number, number> = {};
  const freq30: Record<number, number> = {};
  const freq10: Record<number, number> = {};
  const lastSeen: Record<number, number> = {};
  for (const n of allNums) { freq50[n] = 0; freq30[n] = 0; freq10[n] = 0; lastSeen[n] = 999; }

  draws.forEach((d, i) => {
    d.numbers.forEach(n => {
      if (i < 50) freq50[n] = (freq50[n] || 0) + 1;
      if (i < 30) freq30[n] = (freq30[n] || 0) + 1;
      if (i < 10) freq10[n] = (freq10[n] || 0) + 1;
      if (lastSeen[n] === 999) lastSeen[n] = i;
    });
  });

  // Build Markov matrix
  const markov = buildMarkovMatrix(draws.slice(0, 100), config.numbers);
  const lastDraw = draws[0]?.numbers || [];
  const markovSuccessors = getMarkovSuccessors(lastDraw, markov, 20);
  const markovSet = new Set(markovSuccessors.map(m => m.number));

  // Build co-occurrence map
  const cooccMap = buildCooccurrenceMap(draws, 100);

  // Build Bayesian conditional network
  const bayesNetwork = buildConditionalNetwork(draws, config.id, 120);

  // Compute mutual information scores
  const miScores = computeMutualInformation(draws, config.id, 100);

  // Repeat analysis
  const [minRepeat, maxRepeat] = idealRepeatCount(config);

  // Composite score per number (enhanced)
  const compositeScores = allNums.map(n => {
    const s = stats.find(st => st.number === n);
    let score = 0;
    // Historical frequency (normalized)
    score += (freq50[n] || 0) * 1.5;
    // Recent frequency (higher weight)
    score += (freq30[n] || 0) * 2;
    score += (freq10[n] || 0) * 3;
    // Trend
    if (s?.trend && s.trend > 0) score += s.trend * 8;
    // Cycle (overdue bonus)
    if (s?.cycleScore && s.cycleScore > 1) score += (s.cycleScore - 1) * 12;
    // Recency
    if (lastSeen[n] <= 2) score += 6;
    else if (lastSeen[n] <= 5) score += 3;
    // Momentum
    if (s?.momentum && s.momentum > 0) score += s.momentum * 0.005;
    // Markov boost
    if (markovSet.has(n)) {
      const ms = markovSuccessors.find(m => m.number === n);
      score += (ms?.score || 0) * 0.5;
    }
    // Prime/Fibonacci subtle boost
    if (PRIMES.has(n)) score += 1;
    if (FIBONACCI.has(n)) score += 0.5;

    return { number: n, score };
  }).sort((a, b) => b.score - a.score);

  const bets: number[][] = [];
  const scores: number[] = [];
  const qualityDetails: string[][] = [];
  const seenKeys = new Set<string>();

  // Strategy profiles for diverse generation
  const strategyProfiles = [
    { name: 'Conservadora', topBias: 0.80, poolMult: 1.8, markovWeight: 0.2, cycleWeight: 0.1 },
    { name: 'Conservadora', topBias: 0.75, poolMult: 2.0, markovWeight: 0.3, cycleWeight: 0.1 },
    { name: 'Equilibrada', topBias: 0.55, poolMult: 2.5, markovWeight: 0.4, cycleWeight: 0.3 },
    { name: 'Equilibrada', topBias: 0.50, poolMult: 2.8, markovWeight: 0.3, cycleWeight: 0.4 },
    { name: 'Agressiva', topBias: 0.35, poolMult: 3.0, markovWeight: 0.2, cycleWeight: 0.6 },
    { name: 'Markov', topBias: 0.40, poolMult: 2.0, markovWeight: 0.7, cycleWeight: 0.2 },
    { name: 'Ciclos', topBias: 0.30, poolMult: 3.5, markovWeight: 0.1, cycleWeight: 0.8 },
    { name: 'Anti-Padrão', topBias: 0.25, poolMult: 4.0, markovWeight: 0.3, cycleWeight: 0.3 },
    { name: 'Cobertura', topBias: 0.45, poolMult: 3.0, markovWeight: 0.2, cycleWeight: 0.2 },
    { name: 'Momentum', topBias: 0.60, poolMult: 2.2, markovWeight: 0.4, cycleWeight: 0.1 },
  ];

  for (let attempt = 0; attempt < 3000 && bets.length < count; attempt++) {
    const profileIdx = bets.length % strategyProfiles.length;
    const profile = strategyProfiles[Math.min(profileIdx, strategyProfiles.length - 1)];

    // Build weighted pool
    const poolSize = Math.min(allNums.length, Math.ceil(config.pick * profile.poolMult));
    const pool = compositeScores.slice(0, poolSize).map(c => ({
      number: c.number,
      weight: c.score * (1 - profile.markovWeight - profile.cycleWeight)
        + (markovSet.has(c.number) ? (markovSuccessors.find(m => m.number === c.number)?.score || 0) * profile.markovWeight : 0)
        + ((stats.find(s => s.number === c.number)?.cycleScore || 0) > 1 ? 10 * profile.cycleWeight : 0),
    }));

    // Add some random numbers for aggressive/coverage strategies
    if (profile.topBias < 0.4) {
      const extras = allNums
        .filter(n => !pool.find(p => p.number === n))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(config.pick * 0.3));
      extras.forEach(n => pool.push({ number: n, weight: 2 }));
    }

    // Weighted sampling
    const candidate: number[] = [];
    const remaining = [...pool];

    while (candidate.length < config.pick && remaining.length > 0) {
      const totalW = remaining.reduce((s, p) => s + Math.max(0.1, p.weight), 0);
      let r = Math.random() * totalW;
      let idx = 0;
      for (; idx < remaining.length; idx++) {
        r -= Math.max(0.1, remaining[idx].weight);
        if (r <= 0) break;
      }
      idx = Math.min(idx, remaining.length - 1);
      candidate.push(remaining[idx].number);
      remaining.splice(idx, 1);
    }

    // Fill if needed
    while (candidate.length < config.pick) {
      const n = Math.floor(Math.random() * config.numbers) + minNum;
      if (!candidate.includes(n)) candidate.push(n);
    }

    candidate.sort((a, b) => a - b);
    if (new Set(candidate).size !== config.pick) continue;
    const key = candidate.join(',');
    if (seenKeys.has(key)) continue;

    // ═══ VALIDATION FILTERS ═══
    // Sum range
    const sum = candidate.reduce((a, b) => a + b, 0);
    if (rules.idealSumRange) {
      const [lo, hi] = rules.idealSumRange;
      const margin = (hi - lo) * 0.2;
      if (sum < lo - margin || sum > hi + margin) continue;
    }

    // Parity
    const evens = candidate.filter(n => n % 2 === 0).length;
    if (rules.idealParityRange) {
      const [minP, maxP] = rules.idealParityRange;
      if (evens < minP - 1 || evens > maxP + 1) continue;
    }

    // Consecutive sequences
    const mSeq = maxConsecutive(candidate);
    if (mSeq > (rules.maxRecommendedSequence || 3)) continue;

    // Repeat from last draw
    if (lastDraw.length > 0) {
      const repeats = countRepeats(candidate, lastDraw);
      if (repeats < Math.max(0, minRepeat - 1) || repeats > maxRepeat + 1) continue;
    }

    // Frame balance (Lotofácil)
    if (config.id === 'lotofacil') {
      const frameCount = candidate.filter(n => LOTOFACIL_FRAME.has(n)).length;
      const idealFrame = rules.idealFrameRange || [8, 11];
      if (frameCount < idealFrame[0] - 1 || frameCount > idealFrame[1] + 1) continue;
    }

    // Diversity from existing bets
    const isDiverse = bets.every(b => {
      const overlap = candidate.filter(n => b.includes(n)).length;
      return config.pick - overlap >= Math.max(2, Math.floor(config.pick * 0.15));
    });
    if (!isDiverse) continue;

    // ═══ SCORING v3.0 (0-100) ═══
    let score = 0;
    const details: string[] = [];

    // Sum adherence (0-20)
    const sumSc = sumScore(candidate, config.id) * 20;
    score += sumSc;
    if (sumSc >= 18) details.push("✅ Soma ideal");
    else if (sumSc < 10) details.push("⚠ Soma fora da faixa");

    // Parity balance (0-15)
    if (rules.idealParityRange) {
      const [minP, maxP] = rules.idealParityRange;
      if (evens >= minP && evens <= maxP) { score += 15; details.push(`✅ ${evens}P/${config.pick - evens}I`); }
      else { score += 8; details.push(`⚠ ${evens}P/${config.pick - evens}I`); }
    } else {
      score += (1 - Math.abs(evens / config.pick - 0.5) * 2) * 15;
    }

    // Frequency bonus (0-15)
    const avgFreq = candidate.reduce((s, n) => s + (freq30[n] || 0), 0) / config.pick;
    score += Math.min(15, avgFreq * 1.5);

    // Recent frequency (0-10)
    const avgRecent = candidate.reduce((s, n) => s + (freq10[n] || 0), 0) / config.pick;
    score += Math.min(10, avgRecent * 2.5);

    // Markov alignment (0-10)
    const markovCount = candidate.filter(n => markovSet.has(n)).length;
    const markovSc = Math.min(10, (markovCount / config.pick) * 15);
    score += markovSc;
    if (markovCount >= 3) details.push(`🔗 ${markovCount} Markov`);

    // Co-occurrence boost (0-10)
    const coocBoost = cooccurrenceBoost(candidate, cooccMap);
    score += Math.min(10, coocBoost * 0.3);

    // Cycle/overdue (0-5)
    const overdueCount = candidate.filter(n => {
      const s = stats.find(st => st.number === n);
      return s && s.cycleScore > 1.2;
    }).length;
    score += Math.min(5, overdueCount * 2);
    if (overdueCount >= 2) details.push(`⏰ ${overdueCount} overdue`);

    // Consecutive penalty
    if (mSeq > 2) score -= (mSeq - 2) * 3;

    // Repeat from last draw bonus (0-5)
    if (lastDraw.length > 0) {
      const repeats = countRepeats(candidate, lastDraw);
      if (repeats >= minRepeat && repeats <= maxRepeat) score += 5;
    }

    // Frame bonus for Lotofácil (0-5)
    if (config.id === 'lotofacil') {
      score += (frameBalance(candidate, config.id) - 0.7) / 0.3 * 5;
    }

    // Prime ratio (0-3)
    const pr = primeRatio(candidate);
    if (pr >= 0.2 && pr <= 0.5) score += 3;

    // ═══ NEW v3.0: Bayesian Network bonus (0-8) ═══
    if (bayesNetwork.length > 0) {
      const bayesResult = scoreByBayesianNetwork(candidate, bayesNetwork);
      const bayesBonusVal = Math.min(8, Math.max(0, (bayesResult.networkScore - 40) * 0.15));
      score += bayesBonusVal;
      if (bayesResult.networkScore >= 65) details.push("🧠 Bayes+");
      if (bayesResult.internalConsistency >= 0.7) details.push("🔄 Coerente");
    }

    // ═══ NEW v3.0: Zone Entropy bonus (0-5) ═══
    const zoneEnt = computeZoneEntropy(candidate, config.numbers, 5);
    const gapEnt = computeGapEntropy(candidate);
    const entropySc = Math.min(5, (zoneEnt + gapEnt) * 3);
    score += entropySc;
    if (zoneEnt >= 0.85) details.push("📐 Entropia alta");

    // ═══ NEW v3.0: Mutual Information bonus (0-4) ═══
    if (miScores.size > 0) {
      let totalMI = 0;
      for (const n of candidate) totalMI += miScores.get(n) || 0;
      const avgMI = totalMI / candidate.length;
      const allMI = [...miScores.values()];
      const globalAvgMI = allMI.reduce((a, b) => a + b, 0) / allMI.length;
      if (globalAvgMI > 0) {
        const miBonus = Math.min(4, Math.max(0, (avgMI / globalAvgMI - 0.8) * 6));
        score += miBonus;
      }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    seenKeys.add(key);
    bets.push(candidate);
    scores.push(score);
    qualityDetails.push(details);
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const grade = avgScore >= 90 ? "S" : avgScore >= 80 ? "A" : avgScore >= 70 ? "B" : avgScore >= 60 ? "C" : "D";

  // Build rich analysis text
  const strategyNames = ['Conservadora', 'Equilibrada', 'Agressiva', 'Markov', 'Ciclos', 'Anti-Padrão', 'Cobertura', 'Momentum'];
  let analysis = `⚡ **${bets.length} apostas** geradas pelo motor nativo v3.0\n`;
  analysis += `📊 Metodologia: Frequência + Markov + Bayes + Ciclos + Co-ocorrência + Entropia + MI\n\n`;

  bets.forEach((b, i) => {
    const profIdx = i % strategyProfiles.length;
    const strat = strategyProfiles[profIdx]?.name || 'Mista';
    const sum = b.reduce((a, c) => a + c, 0);
    const evens = b.filter(n => n % 2 === 0).length;
    const repeats = lastDraw.length > 0 ? countRepeats(b, lastDraw) : 0;
    const primes = b.filter(n => PRIMES.has(n)).length;
    analysis += `**Jogo ${i + 1}** (${strat}): Soma=${sum}, P=${evens}/I=${config.pick - evens}, Rep=${repeats}, Primos=${primes}, Score=${scores[i]}\n`;
  });

  return { bets, analysis, quality: { avgScore, scores, details: qualityDetails, grade } };
}

// ═══════════════════════════════════════════
// NATIVE BET IMPROVEMENT v2.0
// ═══════════════════════════════════════════
export function generateNativeImprovements(
  betsToImprove: { numbers: number[]; label?: string; avgHits?: number; bestHit?: number; prizeHits?: number }[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[]
): { original: number[]; suggested: number[]; reason: string; expectedGain: string }[] {
  const rules = getLotteryRules(config.id);
  const minNum = config.name === "Super Sete" ? 0 : 1;
  const allNums = Array.from({ length: config.numbers - minNum + 1 }, (_, i) => i + minNum);

  const freq10: Record<number, number> = {};
  for (const n of allNums) freq10[n] = 0;
  draws.slice(0, 10).forEach(d => d.numbers.forEach(n => { freq10[n] = (freq10[n] || 0) + 1; }));

  const markov = buildMarkovMatrix(draws.slice(0, 50), config.numbers);
  const lastDraw = draws[0]?.numbers || [];
  const markovSuccessors = getMarkovSuccessors(lastDraw, markov, 15);
  const markovSet = new Set(markovSuccessors.map(m => m.number));

  return betsToImprove.map(bet => {
    const nums = [...bet.numbers];
    const statsMap = new Map(stats.map(s => [s.number, s]));

    // Score each number in bet
    const scored = nums.map(n => {
      const s = statsMap.get(n);
      let score = (s?.frequency || 0) * 0.2 + (s?.recentFreq || 0) * 0.3 + (s?.cycleScore || 0) * 0.2 + (freq10[n] || 0) * 2;
      if (markovSet.has(n)) score += 3;
      if (s?.trend && s.trend > 0) score += s.trend * 2;
      return { number: n, score };
    }).sort((a, b) => a.score - b.score);

    const replaceCount = Math.min(3, Math.max(1, Math.floor(nums.length * 0.15)));
    const toRemove = scored.slice(0, replaceCount).map(s => s.number);
    const remaining = nums.filter(n => !toRemove.includes(n));

    // Find replacements considering balance
    const mid = config.numbers / 2;
    const evenCount = remaining.filter(r => r % 2 === 0).length;
    const highCount = remaining.filter(r => r > mid).length;
    const idealEvens = rules.idealParityRange ? rules.idealParityRange[0] : Math.round(config.pick / 2);
    const needEven = idealEvens - evenCount;
    const needHigh = Math.round(config.pick / 2) - highCount;

    const candidates = allNums
      .filter(n => !remaining.includes(n))
      .map(n => {
        const s = statsMap.get(n);
        let score = (s?.frequency || 0) * 0.2 + (s?.recentFreq || 0) * 0.3 + (freq10[n] || 0) * 2;
        if (markovSet.has(n)) score += 5;
        if (s?.trend && s.trend > 0) score += s.trend * 3;
        if (s?.cycleScore && s.cycleScore > 1.2) score += 4;
        if (needEven > 0 && n % 2 === 0) score += 8;
        if (needEven < 0 && n % 2 !== 0) score += 8;
        if (needHigh > 0 && n > mid) score += 6;
        if (needHigh < 0 && n <= mid) score += 6;
        return { number: n, score };
      })
      .sort((a, b) => b.score - a.score);

    const toAdd = candidates.slice(0, replaceCount).map(c => c.number);
    const suggested = [...remaining, ...toAdd].sort((a, b) => a - b);

    const reasons: string[] = [];
    toRemove.forEach(n => {
      const s = statsMap.get(n);
      if (s && s.status === 'cold') reasons.push(`${String(n).padStart(2, '0')} (frio) removido`);
      else if (s && s.trend && s.trend < 0) reasons.push(`${String(n).padStart(2, '0')} (queda) removido`);
    });
    toAdd.forEach(n => {
      if (markovSet.has(n)) reasons.push(`${String(n).padStart(2, '0')} adicionado (Markov)`);
      else {
        const s = statsMap.get(n);
        if (s && s.status === 'hot') reasons.push(`${String(n).padStart(2, '0')} adicionado (quente)`);
        else if (s && s.cycleScore && s.cycleScore > 1.2) reasons.push(`${String(n).padStart(2, '0')} adicionado (overdue)`);
      }
    });

    const oldSum = nums.reduce((a, b) => a + b, 0);
    const newSum = suggested.reduce((a, b) => a + b, 0);
    const oldSumScore = sumScore(nums, config.id);
    const newSumScore = sumScore(suggested, config.id);
    const gain = Math.round((newSumScore - oldSumScore) * 100);

    if (reasons.length === 0) reasons.push('Números estatisticamente fracos substituídos por candidatos mais fortes');

    return {
      original: bet.numbers,
      suggested,
      reason: reasons.join('. ') + '.',
      expectedGain: gain > 0 ? `+${gain}% soma otimizada` : "+10-20% estimado",
    };
  });
}
