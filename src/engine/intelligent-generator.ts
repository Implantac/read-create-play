import { NumberStats, computeFrequencyStats, generateSmartBet } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "./bet-quality";
import { generateByStrategy, Strategy } from "./strategies";

// ═══════════════════════════════════════════════════════
// GERADOR INTELIGENTE DE APOSTAS v2.0
// Combina estatísticas, padrões, simulações e tendências
// para gerar apostas otimizadas automaticamente
// ═══════════════════════════════════════════════════════

export interface IntelligentBet {
  numbers: number[];
  score: number;           // 0-100 composite score
  quality: BetQualityReport;
  analysis: BetAnalysis;
  strategy: string;
  strategyLabel: string;
  rank: number;
  simulationHits: SimulationResult;
}

export interface BetAnalysis {
  parityBalance: string;
  sumRange: string;
  distributionQuality: string;
  trendAlignment: string;
  cycleAlignment: string;
  insights: string[];
}

export interface SimulationResult {
  avgHits: number;
  maxHits: number;
  minHits: number;
  prizeCount: number;    // how many draws would have won something
  totalDraws: number;
  consistency: number;   // 0-100
}

export interface GenerationConfig {
  totalBets: number;          // how many candidates to generate
  topResults: number;         // how many to return
  strategies: string[];       // which strategies to use
  simulateHistory: boolean;   // run historical simulation
  minScore: number;           // minimum score threshold
}

// ═══════════════════════════════════════════════════════
// Statistical Analysis Helpers
// ═══════════════════════════════════════════════════════

function analyzeParityBalance(bet: number[]): { score: number; label: string } {
  const evens = bet.filter(n => n % 2 === 0).length;
  const odds = bet.length - evens;
  const ratio = evens / bet.length;
  const score = 100 - Math.abs(ratio - 0.5) * 200;
  return {
    score: Math.max(0, Math.round(score)),
    label: `${evens}P/${odds}I`
  };
}

function analyzeSumRange(bet: number[], draws: DrawResult[]): { score: number; label: string } {
  const sum = bet.reduce((a, b) => a + b, 0);
  const historicalSums = draws.slice(0, 100).map(d => d.numbers.reduce((a, b) => a + b, 0));
  if (historicalSums.length === 0) return { score: 50, label: `Soma: ${sum}` };
  
  const avgSum = historicalSums.reduce((a, b) => a + b, 0) / historicalSums.length;
  const stdDev = Math.sqrt(historicalSums.reduce((s, v) => s + (v - avgSum) ** 2, 0) / historicalSums.length);
  const zScore = Math.abs((sum - avgSum) / (stdDev || 1));
  const score = Math.max(0, Math.round(100 - zScore * 30));
  
  return { score, label: `Soma ${sum} (média ${Math.round(avgSum)})` };
}

function analyzeDistribution(bet: number[], config: LotteryConfig): { score: number; label: string } {
  const sectors = Math.min(5, Math.ceil(config.numbers / 10));
  const sectorSize = Math.ceil(config.numbers / sectors);
  const sectorCounts = new Array(sectors).fill(0);
  
  bet.forEach(n => {
    const sector = Math.min(sectors - 1, Math.floor((n - 1) / sectorSize));
    sectorCounts[sector]++;
  });
  
  const expected = bet.length / sectors;
  const deviation = sectorCounts.reduce((s, c) => s + Math.abs(c - expected), 0) / sectors;
  const score = Math.max(0, Math.round(100 - deviation * 25));
  
  const emptySectors = sectorCounts.filter(c => c === 0).length;
  const label = emptySectors === 0 ? "Distribuição uniforme" : `${emptySectors} faixa(s) vazia(s)`;
  
  return { score, label };
}

function analyzeTrendAlignment(bet: number[], stats: NumberStats[]): { score: number; label: string } {
  const betStats = bet.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];
  if (betStats.length === 0) return { score: 50, label: "Sem dados" };
  
  const trendingUp = betStats.filter(s => s.trend > 0).length;
  const ratio = trendingUp / betStats.length;
  const score = Math.round(50 + ratio * 50);
  
  return { score, label: `${trendingUp}/${betStats.length} em alta` };
}

function analyzeCycleAlignment(bet: number[], stats: NumberStats[]): { score: number; label: string } {
  const betStats = bet.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];
  if (betStats.length === 0) return { score: 50, label: "Sem dados" };
  
  const avgCycle = betStats.reduce((s, st) => s + st.cycleScore, 0) / betStats.length;
  const score = Math.min(100, Math.round(avgCycle * 50));
  const dueCount = betStats.filter(s => s.cycleScore > 1.2).length;
  
  return { score, label: `${dueCount} dezenas "devidas"` };
}

// ═══════════════════════════════════════════════════════
// Historical Simulation
// ═══════════════════════════════════════════════════════

function simulateAgainstHistory(bet: number[], draws: DrawResult[], config: LotteryConfig): SimulationResult {
  if (draws.length === 0) {
    return { avgHits: 0, maxHits: 0, minHits: 0, prizeCount: 0, totalDraws: 0, consistency: 0 };
  }

  const hits: number[] = [];
  for (const draw of draws) {
    const matched = bet.filter(n => draw.numbers.includes(n)).length;
    hits.push(matched);
  }

  const avgHits = hits.reduce((a, b) => a + b, 0) / hits.length;
  const maxHits = Math.max(...hits);
  const minHits = Math.min(...hits);

  // Prize thresholds vary by lottery
  const prizeThreshold = getPrizeThreshold(config);
  const prizeCount = hits.filter(h => h >= prizeThreshold).length;

  // Consistency: low std dev of hits = more consistent
  const stdDev = Math.sqrt(hits.reduce((s, h) => s + (h - avgHits) ** 2, 0) / hits.length);
  const expectedStdDev = Math.sqrt(config.pick * (config.numbers - config.pick) / (config.numbers - 1) * config.pick / config.numbers);
  const consistency = Math.max(0, Math.min(100, Math.round(100 - (stdDev / (expectedStdDev || 1)) * 30)));

  return { avgHits, maxHits, minHits, prizeCount, totalDraws: draws.length, consistency };
}

function getPrizeThreshold(config: LotteryConfig): number {
  // Minimum hits to win any prize
  const thresholds: Record<string, number> = {
    megasena: 4,
    lotofacil: 11,
    quina: 2,
    lotomania: 15,
    duplasena: 3,
    timemania: 3,
    diadesorte: 4,
    supersete: 3,
  };
  return thresholds[config.id] || Math.ceil(config.pick * 0.6);
}

// ═══════════════════════════════════════════════════════
// Insight Generator
// ═══════════════════════════════════════════════════════

function generateInsights(
  bet: number[],
  stats: NumberStats[],
  draws: DrawResult[],
  config: LotteryConfig,
  sim: SimulationResult
): string[] {
  const insights: string[] = [];
  const betStats = bet.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];

  // Parity insight
  const evens = bet.filter(n => n % 2 === 0).length;
  const evenRatio = evens / bet.length;
  if (Math.abs(evenRatio - 0.5) < 0.1) {
    insights.push("Excelente equilíbrio entre pares e ímpares.");
  } else if (evenRatio > 0.65) {
    insights.push("Alta concentração de números pares.");
  } else if (evenRatio < 0.35) {
    insights.push("Alta concentração de números ímpares.");
  }

  // Sum insight
  const sum = bet.reduce((a, b) => a + b, 0);
  const historicalSums = draws.slice(0, 100).map(d => d.numbers.reduce((a, b) => a + b, 0));
  if (historicalSums.length > 0) {
    const avgSum = historicalSums.reduce((a, b) => a + b, 0) / historicalSums.length;
    if (Math.abs(sum - avgSum) < avgSum * 0.1) {
      insights.push(`Soma (${sum}) dentro da média histórica (${Math.round(avgSum)}).`);
    }
  }

  // Trend insight
  const hotCount = betStats.filter(s => s.status === "hot").length;
  if (hotCount > bet.length * 0.5) {
    insights.push(`${hotCount} dezenas em tendência de alta.`);
  }

  // Cycle insight
  const dueCount = betStats.filter(s => s.cycleScore > 1.3).length;
  if (dueCount > 0) {
    insights.push(`${dueCount} dezena(s) com ciclo favorável (prestes a sair).`);
  }

  // Simulation insight
  if (sim.prizeCount > 0) {
    const prizeRate = ((sim.prizeCount / sim.totalDraws) * 100).toFixed(1);
    insights.push(`Acertaria premiação em ${prizeRate}% dos concursos históricos.`);
  }

  if (sim.maxHits >= config.pick - 1) {
    insights.push(`Quase acertou tudo: ${sim.maxHits}/${config.pick} acertos no melhor caso.`);
  }

  return insights;
}

// ═══════════════════════════════════════════════════════
// Composite Scoring
// ═══════════════════════════════════════════════════════

function computeCompositeScore(
  quality: BetQualityReport,
  sim: SimulationResult,
  trendScore: number,
  cycleScore: number,
  distributionScore: number
): number {
  return Math.round(
    quality.overall * 0.30 +
    (sim.consistency) * 0.15 +
    (sim.prizeCount / Math.max(1, sim.totalDraws) * 100) * 0.20 +
    trendScore * 0.15 +
    cycleScore * 0.10 +
    distributionScore * 0.10
  );
}

// ═══════════════════════════════════════════════════════
// Strategy definitions for intelligent generation
// ═══════════════════════════════════════════════════════

const INTELLIGENT_STRATEGIES: { id: Strategy; label: string; weight: number }[] = [
  { id: "hot", label: "Frequência Histórica", weight: 1 },
  { id: "lowDelay", label: "Atraso Estatístico", weight: 1 },
  { id: "trend", label: "Tendência + Momentum", weight: 1.5 },
  { id: "cycle", label: "Ciclo Estatístico", weight: 1.5 },
  { id: "balanced", label: "Modelo Equilibrado", weight: 2 },
  { id: "smart", label: "Modelo Inteligente", weight: 2 },
  { id: "hybrid", label: "IA Híbrida", weight: 2 },
  { id: "ml", label: "IA Ensemble", weight: 1.5 },
  { id: "sectors", label: "Cobertura por Setores", weight: 1 },
  { id: "pattern", label: "Padrões Estruturais", weight: 1 },
];

// ═══════════════════════════════════════════════════════
// Main Generator Function
// ═══════════════════════════════════════════════════════

export function generateIntelligentBets(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  genConfig: GenerationConfig = {
    totalBets: 200,
    topResults: 20,
    strategies: INTELLIGENT_STRATEGIES.map(s => s.id),
    simulateHistory: true,
    minScore: 40,
  }
): IntelligentBet[] {
  const candidates: IntelligentBet[] = [];
  const usedStrategies = INTELLIGENT_STRATEGIES.filter(s => genConfig.strategies.includes(s.id));
  const totalWeight = usedStrategies.reduce((s, st) => s + st.weight, 0);

  // Distribute bets proportionally across strategies
  for (const strat of usedStrategies) {
    const betsForStrategy = Math.max(1, Math.round((strat.weight / totalWeight) * genConfig.totalBets));
    
    for (let i = 0; i < betsForStrategy && candidates.length < genConfig.totalBets; i++) {
      const numbers = generateByStrategy(strat.id, stats, config);
      const quality = evaluateBetQuality(numbers, stats, config, draws);
      
      const parity = analyzeParityBalance(numbers);
      const sumRange = analyzeSumRange(numbers, draws);
      const distribution = analyzeDistribution(numbers, config);
      const trendAlign = analyzeTrendAlignment(numbers, stats);
      const cycleAlign = analyzeCycleAlignment(numbers, stats);
      
      const sim = genConfig.simulateHistory
        ? simulateAgainstHistory(numbers, draws, config)
        : { avgHits: 0, maxHits: 0, minHits: 0, prizeCount: 0, totalDraws: 0, consistency: 50 };

      const score = computeCompositeScore(quality, sim, trendAlign.score, cycleAlign.score, distribution.score);

      const insights = generateInsights(numbers, stats, draws, config, sim);

      candidates.push({
        numbers,
        score,
        quality,
        strategy: strat.id,
        strategyLabel: strat.label,
        rank: 0,
        simulationHits: sim,
        analysis: {
          parityBalance: parity.label,
          sumRange: sumRange.label,
          distributionQuality: distribution.label,
          trendAlignment: trendAlign.label,
          cycleAlignment: cycleAlign.label,
          insights,
        },
      });
    }
  }

  // Filter by minimum score
  const filtered = candidates.filter(b => b.score >= genConfig.minScore);

  // Remove duplicates
  const seen = new Set<string>();
  const unique = filtered.filter(b => {
    const key = b.numbers.join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by composite score
  unique.sort((a, b) => b.score - a.score);

  // Assign ranks and return top results
  const top = unique.slice(0, genConfig.topResults);
  top.forEach((bet, i) => { bet.rank = i + 1; });

  return top;
}

// ═══════════════════════════════════════════════════════
// Summary Statistics
// ═══════════════════════════════════════════════════════

export interface GenerationSummary {
  totalGenerated: number;
  totalFiltered: number;
  avgScore: number;
  bestScore: number;
  strategyDistribution: { strategy: string; count: number; avgScore: number }[];
  commonNumbers: { number: number; frequency: number }[];
}

export function computeGenerationSummary(bets: IntelligentBet[], config: LotteryConfig): GenerationSummary {
  const stratMap = new Map<string, { count: number; totalScore: number }>();
  const numFreq = new Map<number, number>();

  for (const bet of bets) {
    const entry = stratMap.get(bet.strategyLabel) || { count: 0, totalScore: 0 };
    entry.count++;
    entry.totalScore += bet.score;
    stratMap.set(bet.strategyLabel, entry);

    for (const n of bet.numbers) {
      numFreq.set(n, (numFreq.get(n) || 0) + 1);
    }
  }

  return {
    totalGenerated: bets.length,
    totalFiltered: bets.length,
    avgScore: bets.length > 0 ? Math.round(bets.reduce((s, b) => s + b.score, 0) / bets.length) : 0,
    bestScore: bets.length > 0 ? bets[0].score : 0,
    strategyDistribution: Array.from(stratMap.entries()).map(([strategy, d]) => ({
      strategy,
      count: d.count,
      avgScore: Math.round(d.totalScore / d.count),
    })).sort((a, b) => b.avgScore - a.avgScore),
    commonNumbers: Array.from(numFreq.entries())
      .map(([number, frequency]) => ({ number, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 15),
  };
}
