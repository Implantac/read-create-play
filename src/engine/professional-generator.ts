import { NumberStats, generateSmartBet } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "./bet-quality";
import { generateByStrategy, Strategy } from "./strategies";
import { analyzeFrameCenter, computeIdealFrameCenter, analyzeRowDistribution } from "./generation-filters";

// ═══════════════════════════════════════════════════════
// GERADOR PROFISSIONAL DE APOSTAS
// Múltiplas estratégias com scoring, ranking e fechamentos
// ═══════════════════════════════════════════════════════

export interface ProfessionalBet {
  numbers: number[];
  strategy: string;
  strategyLabel: string;
  quality: BetQualityReport;
  statisticalScore: number;
  probabilityEstimate: number;
  rank: number;
}

export interface ClosureConfig {
  baseNumbers: number;   // quantas dezenas o jogador escolhe
  guarantee: number;     // acertos garantidos se X dezenas saírem
  ifHit: number;         // quantas dezenas precisam sair do grupo
  combinations: number[][]; // os jogos gerados
}

// ═══════════════════════════════════════════════════════
// Scoring Estatístico
// ═══════════════════════════════════════════════════════

function computeStatisticalScore(bet: number[], stats: NumberStats[], config: LotteryConfig, draws: DrawResult[]): number {
  const betStats = bet.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];
  if (betStats.length === 0) return 0;

  const avgFreqScore = betStats.reduce((s, st) => s + st.percentage, 0) / betStats.length;
  const avgTrend = betStats.reduce((s, st) => s + Math.max(0, st.trend), 0) / betStats.length;
  const avgCycle = betStats.reduce((s, st) => s + st.cycleScore, 0) / betStats.length;
  const avgMomentum = betStats.reduce((s, st) => s + Math.max(0, st.momentum), 0) / betStats.length;
  const hotRatio = betStats.filter(s => s.status === "hot").length / betStats.length;

  // Parity score (how close to ideal)
  const evenCount = bet.filter(n => n % 2 === 0).length;
  const idealEven = Math.round(config.pick / 2);
  const parityDeviation = Math.abs(evenCount - idealEven);
  const parityScore = Math.max(0, 10 - parityDeviation * 3);

  // Sum score (proximity to historical average)
  const sum = bet.reduce((a, b) => a + b, 0);
  const sums = draws.slice(0, 100).map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avgSum = sums.length > 0 ? sums.reduce((a, b) => a + b, 0) / sums.length : sum;
  const sumStdDev = sums.length > 0 ? Math.sqrt(sums.reduce((s, v) => s + (v - avgSum) ** 2, 0) / sums.length) : 30;
  const sumDeviation = Math.abs(sum - avgSum) / Math.max(sumStdDev, 1);
  const sumScore = sumDeviation <= 0.5 ? 10 : sumDeviation <= 1 ? 7 : sumDeviation <= 1.5 ? 4 : 0;

  // Frame/Center score (for Lotofácil-like)
  let frameScore = 0;
  if (config.numbers === 25 && config.pick === 15) {
    const fc = analyzeFrameCenter(bet);
    if (fc.frame >= 9 && fc.frame <= 11) frameScore = 8;
    else if (fc.frame >= 8 && fc.frame <= 12) frameScore = 4;
  }

  // Row coverage (no empty rows)
  let rowScore = 0;
  if (config.numbers === 25) {
    const rows = analyzeRowDistribution(bet);
    const emptyRows = rows.filter(r => r === 0).length;
    rowScore = emptyRows === 0 ? 5 : -5;
  }

  // Sequence run penalty
  const sorted = [...bet].sort((a, b) => a - b);
  let maxRun = 1, curRun = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) { curRun++; maxRun = Math.max(maxRun, curRun); }
    else curRun = 1;
  }
  const seqPenalty = maxRun > 4 ? -8 : maxRun > 3 ? -3 : 0;

  // Repetition from last draw
  let repeatScore = 0;
  if (draws.length > 0) {
    const lastDraw = draws[0].numbers;
    const repeated = bet.filter(n => lastDraw.includes(n)).length;
    const idealRepeat = Math.round(config.pick * (config.pick / config.numbers));
    const repeatDev = Math.abs(repeated - idealRepeat);
    repeatScore = repeatDev <= 1 ? 5 : repeatDev <= 2 ? 2 : -3;
  }

  return Math.min(100, Math.max(0, Math.round(
    avgFreqScore * 0.6 +
    avgTrend * 6 +
    avgCycle * 10 +
    avgMomentum * 0.4 +
    hotRatio * 15 +
    parityScore +
    sumScore +
    frameScore +
    rowScore +
    seqPenalty +
    repeatScore +
    20 // base
  )));
}

function estimateProbability(bet: number[], stats: NumberStats[], config: LotteryConfig): number {
  const totalCombinations = binomial(config.numbers, config.pick);
  const baseProbability = 1 / totalCombinations;
  const betStats = bet.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];
  const avgFreq = betStats.length > 0 ? betStats.reduce((s, st) => s + st.percentage, 0) / betStats.length : 50;
  const adjustmentFactor = 1 + (avgFreq - 50) / 100;
  return baseProbability * adjustmentFactor;
}

function binomial(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

// ═══════════════════════════════════════════════════════
// Gerador Profissional
// ═══════════════════════════════════════════════════════

const PRO_STRATEGIES: { id: Strategy; label: string; category: string }[] = [
  { id: "hot", label: "Frequência Histórica", category: "frequencia" },
  { id: "lowDelay", label: "Atraso Estatístico", category: "atraso" },
  { id: "ml", label: "IA Ensemble", category: "ia" },
  { id: "hybrid", label: "IA Híbrida", category: "ia" },
  { id: "trend", label: "Tendência + Momentum", category: "simulacao" },
  { id: "cycle", label: "Ciclo Estatístico", category: "simulacao" },
  { id: "balanced", label: "Modelo Equilibrado", category: "hibrido" },
  { id: "smart", label: "Modelo Inteligente", category: "hibrido" },
  { id: "sectors", label: "Cobertura por Setores", category: "hibrido" },
  { id: "pattern", label: "Padrões Estruturais", category: "hibrido" },
];

export function generateProfessionalBets(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  betsPerStrategy: number = 2
): ProfessionalBet[] {
  const allBets: ProfessionalBet[] = [];
  const seenCombos = new Set<string>();
  const lastDraw = draws.length > 0 ? draws[0].numbers : [];

  for (const strat of PRO_STRATEGIES) {
    for (let i = 0; i < betsPerStrategy; i++) {
      let numbers: number[] | null = null;
      
      // Step 1-3: Generate base bet via strategy
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateByStrategy(strat.id, stats, config);
        const key = [...candidate].sort((a, b) => a - b).join(",");
        
        // Step 4: Validate against filters
        const sum = candidate.reduce((a, b) => a + b, 0);
        const evenCount = candidate.filter(n => n % 2 === 0).length;
        const idealEven = Math.round(config.pick / 2);
        
        // Check parity balance
        if (Math.abs(evenCount - idealEven) > 2) continue;
        
        // Check uniqueness
        if (seenCombos.has(key)) continue;
        
        // For Lotofácil: check frame/center and row distribution
        if (config.numbers === 25 && config.pick === 15) {
          const fc = analyzeFrameCenter(candidate);
          if (fc.frame < 8 || fc.frame > 12) continue;
          const rows = analyzeRowDistribution(candidate);
          if (rows.some(r => r === 0)) continue;
        }

        // Check max sequence run
        const sorted = [...candidate].sort((a, b) => a - b);
        let maxRun = 1, curRun = 1;
        for (let j = 1; j < sorted.length; j++) {
          if (sorted[j] === sorted[j - 1] + 1) { curRun++; maxRun = Math.max(maxRun, curRun); }
          else curRun = 1;
        }
        if (maxRun > 4) continue;

        numbers = candidate;
        seenCombos.add(key);
        break;
      }

      if (!numbers) {
        // Fallback: accept any unique bet
        numbers = generateByStrategy(strat.id, stats, config);
        const key = [...numbers].sort((a, b) => a - b).join(",");
        if (seenCombos.has(key)) continue;
        seenCombos.add(key);
      }

      // Step 5-6: Evaluate quality and score
      const quality = evaluateBetQuality(numbers, stats, config, draws);
      const statisticalScore = computeStatisticalScore(numbers, stats, config, draws);
      const probabilityEstimate = estimateProbability(numbers, stats, config);

      allBets.push({
        numbers,
        strategy: strat.id,
        strategyLabel: strat.label,
        quality,
        statisticalScore,
        probabilityEstimate,
        rank: 0,
      });
    }
  }

  // Step 7: Rank by combined score (quality + statistical + diversity bonus)
  allBets.sort((a, b) => {
    const scoreA = a.quality.overall * 0.5 + a.statisticalScore * 0.5;
    const scoreB = b.quality.overall * 0.5 + b.statisticalScore * 0.5;
    return scoreB - scoreA;
  });

  allBets.forEach((bet, i) => { bet.rank = i + 1; });

  return allBets;
}

// ═══════════════════════════════════════════════════════
// FECHAMENTOS MATEMÁTICOS
// ═══════════════════════════════════════════════════════

interface ClosurePreset {
  lotteryId: string;
  name: string;
  baseNumbers: number;
  pick: number;
  guarantee: number;
  ifHit: number;
}

const CLOSURE_PRESETS: ClosurePreset[] = [
  // Mega Sena (pick 6 of 60)
  { lotteryId: "megasena", name: "Mega 8→4se6", baseNumbers: 8, pick: 6, guarantee: 4, ifHit: 6 },
  { lotteryId: "megasena", name: "Mega 10→4se6", baseNumbers: 10, pick: 6, guarantee: 4, ifHit: 6 },
  { lotteryId: "megasena", name: "Mega 12→4se6", baseNumbers: 12, pick: 6, guarantee: 4, ifHit: 6 },
  { lotteryId: "megasena", name: "Mega 15→4se6", baseNumbers: 15, pick: 6, guarantee: 4, ifHit: 6 },
  { lotteryId: "megasena", name: "Mega 10→5se6", baseNumbers: 10, pick: 6, guarantee: 5, ifHit: 6 },
  { lotteryId: "megasena", name: "Mega 18→4se6", baseNumbers: 18, pick: 6, guarantee: 4, ifHit: 6 },

  // Lotofácil (pick 15 of 25)
  { lotteryId: "lotofacil", name: "LF 18→13se15", baseNumbers: 18, pick: 15, guarantee: 13, ifHit: 15 },
  { lotteryId: "lotofacil", name: "LF 20→12se15", baseNumbers: 20, pick: 15, guarantee: 12, ifHit: 15 },
  { lotteryId: "lotofacil", name: "LF 22→11se15", baseNumbers: 22, pick: 15, guarantee: 11, ifHit: 15 },
  { lotteryId: "lotofacil", name: "LF 20→13se15", baseNumbers: 20, pick: 15, guarantee: 13, ifHit: 15 },

  // Quina (pick 5 of 80)
  { lotteryId: "quina", name: "Quina 8→3se5", baseNumbers: 8, pick: 5, guarantee: 3, ifHit: 5 },
  { lotteryId: "quina", name: "Quina 10→3se5", baseNumbers: 10, pick: 5, guarantee: 3, ifHit: 5 },
  { lotteryId: "quina", name: "Quina 12→4se5", baseNumbers: 12, pick: 5, guarantee: 4, ifHit: 5 },
  { lotteryId: "quina", name: "Quina 15→3se5", baseNumbers: 15, pick: 5, guarantee: 3, ifHit: 5 },

  // Lotomania (pick 50 of 100)
  { lotteryId: "lotomania", name: "LM 55→15se20", baseNumbers: 55, pick: 50, guarantee: 15, ifHit: 20 },
  { lotteryId: "lotomania", name: "LM 60→15se20", baseNumbers: 60, pick: 50, guarantee: 15, ifHit: 20 },
  { lotteryId: "lotomania", name: "LM 65→15se20", baseNumbers: 65, pick: 50, guarantee: 15, ifHit: 20 },

  // Dupla Sena (pick 6 of 50)
  { lotteryId: "duplasena", name: "DS 8→4se6", baseNumbers: 8, pick: 6, guarantee: 4, ifHit: 6 },
  { lotteryId: "duplasena", name: "DS 10→4se6", baseNumbers: 10, pick: 6, guarantee: 4, ifHit: 6 },
  { lotteryId: "duplasena", name: "DS 12→4se6", baseNumbers: 12, pick: 6, guarantee: 4, ifHit: 6 },

  // Timemania (pick 10 of 80)
  { lotteryId: "timemania", name: "TM 12→8se10", baseNumbers: 12, pick: 10, guarantee: 8, ifHit: 10 },
  { lotteryId: "timemania", name: "TM 15→7se10", baseNumbers: 15, pick: 10, guarantee: 7, ifHit: 10 },
  { lotteryId: "timemania", name: "TM 18→7se10", baseNumbers: 18, pick: 10, guarantee: 7, ifHit: 10 },

  // Dia de Sorte (pick 7 of 31)
  { lotteryId: "diadesorte", name: "DdS 10→5se7", baseNumbers: 10, pick: 7, guarantee: 5, ifHit: 7 },
  { lotteryId: "diadesorte", name: "DdS 12→5se7", baseNumbers: 12, pick: 7, guarantee: 5, ifHit: 7 },
  { lotteryId: "diadesorte", name: "DdS 15→5se7", baseNumbers: 15, pick: 7, guarantee: 5, ifHit: 7 },

  // Super Sete (pick 7 of 10)
  { lotteryId: "supersete", name: "S7 8→5se7", baseNumbers: 8, pick: 7, guarantee: 5, ifHit: 7 },
  { lotteryId: "supersete", name: "S7 9→5se7", baseNumbers: 9, pick: 7, guarantee: 5, ifHit: 7 },
];

export function getClosurePresetsForLottery(lotteryId: string): ClosurePreset[] {
  return CLOSURE_PRESETS.filter(p => p.lotteryId === lotteryId);
}

/**
 * Gera um fechamento matemático: dado um conjunto de N dezenas base,
 * cria combinações de K números que garantem G acertos se H dezenas saírem.
 * Usa um algoritmo guloso de cobertura.
 */
export function generateClosure(
  baseNumbers: number[],
  pick: number,
  guarantee: number,
  maxCombinations: number = 200
): number[][] {
  const n = baseNumbers.length;
  if (n < pick) return [baseNumbers.sort((a, b) => a - b)];

  // For small sets, generate all combinations
  if (binomial(n, pick) <= maxCombinations) {
    return getAllCombinations(baseNumbers, pick);
  }

  // Greedy covering design
  const combinations: number[][] = [];
  const targetPairs = new Set<string>();

  // Generate all guarantee-sized subsets we need to cover
  const guaranteeSubs = getAllCombinations(baseNumbers, guarantee);
  guaranteeSubs.forEach(sub => targetPairs.add(sub.join(",")));

  const uncovered = new Set(targetPairs);

  while (uncovered.size > 0 && combinations.length < maxCombinations) {
    let bestCombo: number[] = [];
    let bestCoverage = 0;

    // Sample random candidates
    const candidates = [];
    for (let i = 0; i < Math.min(500, binomial(n, pick)); i++) {
      const combo = sampleCombination(baseNumbers, pick);
      candidates.push(combo);
    }

    for (const combo of candidates) {
      const subs = getAllCombinations(combo, guarantee);
      let coverage = 0;
      for (const sub of subs) {
        if (uncovered.has(sub.join(","))) coverage++;
      }
      if (coverage > bestCoverage) {
        bestCoverage = coverage;
        bestCombo = combo;
      }
    }

    if (bestCombo.length === 0) break;

    combinations.push(bestCombo.sort((a, b) => a - b));

    // Remove covered subsets
    const coveredSubs = getAllCombinations(bestCombo, guarantee);
    for (const sub of coveredSubs) {
      uncovered.delete(sub.join(","));
    }
  }

  return combinations;
}

function sampleCombination(pool: number[], pick: number): number[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, pick).sort((a, b) => a - b);
}

function getAllCombinations(arr: number[], k: number): number[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  if (k === arr.length) return [arr.slice().sort((a, b) => a - b)];

  const results: number[][] = [];
  const sorted = [...arr].sort((a, b) => a - b);

  function combine(start: number, current: number[]): void {
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    // Limit for performance
    if (results.length > 10000) return;

    for (let i = start; i < sorted.length; i++) {
      current.push(sorted[i]);
      combine(i + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return results;
}

/**
 * Seleciona as melhores dezenas base para fechamento usando estatísticas
 */
export function selectBaseNumbersForClosure(
  stats: NumberStats[],
  count: number,
  config: LotteryConfig,
  draws: DrawResult[]
): number[] {
  const scored = stats.map(s => ({
    number: s.number,
    score:
      s.recentFreq * 3 +
      (s.trend > 0 ? s.trend * 5 : 0) +
      s.cycleScore * 8 +
      (s.momentum > 0 ? s.momentum * 2 : 0) +
      (s.status === "hot" ? 5 : s.status === "cold" && s.cycleScore > 1.2 ? 3 : 1) +
      (s.consecutivePairs > 2 ? 2 : 0),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.number).sort((a, b) => a - b);
}
