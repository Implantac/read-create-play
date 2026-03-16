import { NumberStats } from "./statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "./bet-quality";
import { generateByStrategy, Strategy } from "./strategies";
import { analyzeFrameCenter, analyzeRowDistribution } from "./generation-filters";

// ═══════════════════════════════════════════════════════
// GERADOR EXTREMO — Pipeline de 8 Etapas
// 1. Analisar histórico  2. Calcular estatísticas
// 3. Gerar milhares      4. Filtros matemáticos
// 5. Filtros estatísticos 6. Filtros de padrões
// 7. Otimização           8. Ranking final
// ═══════════════════════════════════════════════════════

export interface ExtremeConfig {
  totalCandidates: number;       // step 3: how many to generate
  topN: number;                  // final output size
  // Math filters (step 4)
  parityRange: [number, number]; // [minEven, maxEven]
  sumRange: [number, number];    // [minSum, maxSum]
  // Stat filters (step 5)
  minPerRow: number;
  maxPerRow: number;
  minPerCol: number;
  maxPerCol: number;
  maxSequenceRun: number;
  // Pattern filters (step 6)
  frameRange: [number, number];  // [minFrame, maxFrame] for Lotofácil
  repeatRange: [number, number]; // repetition from last draw
  // Frequency mix (step 6)
  hotCount: number;
  mediumCount: number;
  coldCount: number;
}

export interface ExtremeBet {
  numbers: number[];
  rank: number;
  score: number;
  quality: BetQualityReport;
  parityLabel: string;
  sum: number;
  frameCenter: string;
  rowDist: string;
  repeatFromLast: number;
  hotNumbers: number;
  coldNumbers: number;
}

export interface ExtremeResult {
  bets: ExtremeBet[];
  pipeline: PipelineStep[];
  elapsedMs: number;
}

export interface PipelineStep {
  name: string;
  inputCount: number;
  outputCount: number;
  filtered: number;
  fallback?: boolean;
}

// ═══════════════════════════════════════════════════════
// Default configs per lottery
// ═══════════════════════════════════════════════════════

export function getDefaultExtremeConfig(config: LotteryConfig, draws: DrawResult[]): ExtremeConfig {
  const isLF = config.id === "lotofacil";
  const isSuperSete = config.id === "supersete";
  const isLotomania = config.id === "lotomania";
  const idealEven = Math.round(config.pick / 2);

  // Compute sum range from history (wider for edge lotteries)
  let sumMin = 0, sumMax = 99999;
  if (draws.length > 0) {
    const sums = draws.slice(0, 200).map(d => d.numbers.reduce((a, b) => a + b, 0));
    const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
    const std = Math.sqrt(sums.reduce((s, v) => s + (v - avg) ** 2, 0) / sums.length);
    const spread = isSuperSete || isLotomania ? 2.5 : 1.5;
    sumMin = Math.max(0, Math.round(avg - std * spread));
    sumMax = Math.round(avg + std * spread);
  }

  // Compute repeat range from history (wider tolerance)
  let repMin = 0, repMax = config.pick;
  if (draws.length > 1) {
    const reps = [];
    for (let i = 0; i < Math.min(200, draws.length - 1); i++) {
      const rep = draws[i].numbers.filter(n => draws[i + 1].numbers.includes(n)).length;
      reps.push(rep);
    }
    const avg = reps.reduce((a, b) => a + b, 0) / reps.length;
    const std = Math.sqrt(reps.reduce((s, v) => s + (v - avg) ** 2, 0) / reps.length);
    const spread = isSuperSete || isLotomania ? 2.5 : 1.5;
    repMin = Math.max(0, Math.round(avg - std * spread));
    repMax = Math.min(config.pick, Math.round(avg + std * spread));
  }

  // Parity range — wider for extreme lotteries
  const parityMargin = isSuperSete ? 3 : isLotomania ? 5 : 2;

  // Candidate count — fewer for lotteries with limited combinations
  const maxPossible = isSuperSete ? 120 : isLotomania ? 50000 : isLF ? 50000 : 30000;
  const totalCandidates = Math.min(maxPossible, isLF ? 50000 : 30000);

  // Max sequence — relaxed for Super Sete (pick 7 from 10, sequences are inevitable)
  const maxSeq = isSuperSete ? 6 : isLotomania ? 6 : isLF ? 4 : 4;

  return {
    totalCandidates,
    topN: 50,
    parityRange: [Math.max(0, idealEven - parityMargin), Math.min(config.pick, idealEven + parityMargin)],
    sumRange: [sumMin, sumMax],
    minPerRow: isLF ? 2 : 0,
    maxPerRow: isLF ? 4 : config.pick,
    minPerCol: isLF ? 1 : 0,
    maxPerCol: isLF ? 4 : config.pick,
    maxSequenceRun: maxSeq,
    frameRange: isLF ? [8, 11] : [0, config.pick],
    repeatRange: [repMin, repMax],
    hotCount: isLF ? 6 : Math.round(config.pick * 0.4),
    mediumCount: isLF ? 5 : Math.round(config.pick * 0.35),
    coldCount: isLF ? 4 : Math.round(config.pick * 0.25),
  };
}

// ═══════════════════════════════════════════════════════
// Step 1-2: Analyze & classify numbers
// ═══════════════════════════════════════════════════════

interface ClassifiedNumbers {
  hot: number[];
  medium: number[];
  cold: number[];
}

function classifyNumbers(stats: NumberStats[]): ClassifiedNumbers {
  const sorted = [...stats].sort((a, b) => b.recentFreq - a.recentFreq);
  const third = Math.ceil(sorted.length / 3);
  return {
    hot: sorted.slice(0, third).map(s => s.number),
    medium: sorted.slice(third, third * 2).map(s => s.number),
    cold: sorted.slice(third * 2).map(s => s.number),
  };
}

// ═══════════════════════════════════════════════════════
// Step 3: Mass generation using multiple strategies
// ═══════════════════════════════════════════════════════

const GENERATION_STRATEGIES: Strategy[] = [
  "smart", "hot", "cold", "balanced", "trend", "cycle",
  "ml", "hybrid", "sectors", "pattern", "fibonacci", "lowDelay",
];

function massGenerate(
  total: number,
  stats: NumberStats[],
  config: LotteryConfig,
  classified: ClassifiedNumbers,
  ecfg: ExtremeConfig
): number[][] {
  const candidates: number[][] = [];
  const seen = new Set<string>();
  const perStrategy = Math.ceil(total / (GENERATION_STRATEGIES.length + 2));

  // Strategy-based generation
  for (const strat of GENERATION_STRATEGIES) {
    for (let i = 0; i < perStrategy && candidates.length < total; i++) {
      const bet = generateByStrategy(strat, stats, config);
      const key = bet.join(",");
      if (!seen.has(key)) {
        seen.add(key);
        candidates.push(bet);
      }
    }
  }

  // Frequency-mix generation (hot + medium + cold)
  for (let i = 0; i < perStrategy * 2 && candidates.length < total; i++) {
    const bet = generateFrequencyMix(classified, ecfg, config);
    const key = [...bet].sort((a, b) => a - b).join(",");
    if (!seen.has(key)) {
      seen.add(key);
      candidates.push(bet.sort((a, b) => a - b));
    }
  }

  return candidates;
}

function generateFrequencyMix(
  classified: ClassifiedNumbers,
  ecfg: ExtremeConfig,
  config: LotteryConfig
): number[] {
  const pick: number[] = [];
  const hotNeeded = Math.min(ecfg.hotCount, classified.hot.length);
  const coldNeeded = Math.min(ecfg.coldCount, classified.cold.length);
  const medNeeded = config.pick - hotNeeded - coldNeeded;

  const shuffled = (arr: number[]) => [...arr].sort(() => Math.random() - 0.5);

  pick.push(...shuffled(classified.hot).slice(0, hotNeeded));
  pick.push(...shuffled(classified.medium).slice(0, medNeeded));
  pick.push(...shuffled(classified.cold).slice(0, coldNeeded));

  // Fill remaining if needed
  const all = [...classified.hot, ...classified.medium, ...classified.cold];
  while (pick.length < config.pick) {
    const n = all[Math.floor(Math.random() * all.length)];
    if (!pick.includes(n)) pick.push(n);
  }

  return pick.slice(0, config.pick);
}

// ═══════════════════════════════════════════════════════
// Step 4: Mathematical filters
// ═══════════════════════════════════════════════════════

function applyMathFilters(candidates: number[][], ecfg: ExtremeConfig): { result: number[][]; fallback: boolean } {
  const filtered = candidates.filter(bet => {
    const evens = bet.filter(n => n % 2 === 0).length;
    if (evens < ecfg.parityRange[0] || evens > ecfg.parityRange[1]) return false;
    const sum = bet.reduce((a, b) => a + b, 0);
    if (sum < ecfg.sumRange[0] || sum > ecfg.sumRange[1]) return false;
    return true;
  });
  const fallback = filtered.length === 0;
  return { result: fallback ? candidates : filtered, fallback };
}

// ═══════════════════════════════════════════════════════
// Step 5: Statistical filters (rows, cols, sequences)
// ═══════════════════════════════════════════════════════

function applyStatFilters(candidates: number[][], ecfg: ExtremeConfig, config: LotteryConfig): { result: number[][]; fallback: boolean } {
  const gridCols = config.id === "lotofacil" ? 5 : Math.ceil(Math.sqrt(config.numbers));

  const filtered = candidates.filter(bet => {
    if (ecfg.minPerRow > 0 || ecfg.maxPerRow < config.pick) {
      const rows = analyzeRowDistribution(bet, gridCols, config.numbers);
      if (rows.some(r => r < ecfg.minPerRow) || rows.some(r => r > ecfg.maxPerRow)) return false;
    }

    if (ecfg.minPerCol > 0 || ecfg.maxPerCol < config.pick) {
      const colDist = new Array(gridCols).fill(0);
      for (const n of bet) {
        const col = (n - 1) % gridCols;
        if (col < gridCols) colDist[col]++;
      }
      if (colDist.some(c => c < ecfg.minPerCol) || colDist.some(c => c > ecfg.maxPerCol)) return false;
    }

    const sorted = [...bet].sort((a, b) => a - b);
    let maxRun = 1, curRun = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) { curRun++; maxRun = Math.max(maxRun, curRun); }
      else curRun = 1;
    }
    if (maxRun > ecfg.maxSequenceRun) return false;

    return true;
  });

  const fallback = filtered.length === 0;
  return { result: fallback ? candidates : filtered, fallback };
}

// ═══════════════════════════════════════════════════════
// Step 6: Pattern filters (frame, repeat, frequency mix)
// ═══════════════════════════════════════════════════════

function applyPatternFilters(
  candidates: number[][],
  ecfg: ExtremeConfig,
  config: LotteryConfig,
  lastDraw: number[],
  classified: ClassifiedNumbers
): { result: number[][]; fallback: boolean } {
  const filtered = candidates.filter(bet => {
    if (config.id === "lotofacil") {
      const fc = analyzeFrameCenter(bet);
      if (fc.frame < ecfg.frameRange[0] || fc.frame > ecfg.frameRange[1]) return false;
    }

    if (lastDraw.length > 0) {
      const repeated = bet.filter(n => lastDraw.includes(n)).length;
      if (repeated < ecfg.repeatRange[0] || repeated > ecfg.repeatRange[1]) return false;
    }

    const tolerance = config.pick >= 15 ? 5 : config.pick >= 10 ? 4 : 3;
    const hotCount = bet.filter(n => classified.hot.includes(n)).length;
    const coldCount = bet.filter(n => classified.cold.includes(n)).length;
    if (Math.abs(hotCount - ecfg.hotCount) > tolerance) return false;
    if (Math.abs(coldCount - ecfg.coldCount) > tolerance) return false;

    return true;
  });

  const fallback = filtered.length === 0 && candidates.length > 0;
  return { result: fallback ? candidates : filtered, fallback };
}

// ═══════════════════════════════════════════════════════
// Step 7: Scoring & Optimization
// ═══════════════════════════════════════════════════════

function scoreBet(
  bet: number[],
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  classified: ClassifiedNumbers,
  ecfg: ExtremeConfig
): number {
  const betStats = bet.map(n => stats.find(s => s.number === n)).filter(Boolean) as NumberStats[];
  if (betStats.length === 0) return 0;

  // Frequency component
  const avgFreq = betStats.reduce((s, st) => s + st.percentage, 0) / betStats.length;

  // Trend component
  const avgTrend = betStats.reduce((s, st) => s + Math.max(0, st.trend), 0) / betStats.length;

  // Cycle component (overdue numbers score higher)
  const avgCycle = betStats.reduce((s, st) => s + st.cycleScore, 0) / betStats.length;

  // Momentum component
  const avgMomentum = betStats.reduce((s, st) => s + Math.max(0, st.momentum), 0) / betStats.length;

  // Parity balance (closer to ideal = higher)
  const evens = bet.filter(n => n % 2 === 0).length;
  const idealEven = Math.round(config.pick / 2);
  const parityScore = 10 - Math.abs(evens - idealEven) * 3;

  // Sum proximity to historical average
  const sum = bet.reduce((a, b) => a + b, 0);
  const midSum = (ecfg.sumRange[0] + ecfg.sumRange[1]) / 2;
  const sumRange = ecfg.sumRange[1] - ecfg.sumRange[0];
  const sumScore = 10 - (Math.abs(sum - midSum) / Math.max(sumRange / 2, 1)) * 10;

  // Frame balance for Lotofácil
  let frameScore = 0;
  if (config.id === "lotofacil") {
    const fc = analyzeFrameCenter(bet);
    if (fc.frame >= 9 && fc.frame <= 10) frameScore = 10;
    else if (fc.frame >= 8 && fc.frame <= 11) frameScore = 6;
    else frameScore = 2;
  }

  // Coverage diversity (how many unique sectors are covered)
  const sectors = new Set(bet.map(n => Math.ceil(n / Math.ceil(config.numbers / 5))));
  const coverageScore = (sectors.size / 5) * 10;

  // Sequence penalty
  const sorted = [...bet].sort((a, b) => a - b);
  let maxRun = 1, curRun = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) { curRun++; maxRun = Math.max(maxRun, curRun); }
    else curRun = 1;
  }
  const seqPenalty = maxRun > 3 ? -(maxRun - 3) * 3 : 0;

  // Historical performance simulation (mini backtest against last 50 draws)
  let histScore = 0;
  const recentDraws = draws.slice(0, 50);
  if (recentDraws.length > 0) {
    const avgHits = recentDraws.reduce((s, d) => {
      return s + bet.filter(n => d.numbers.includes(n)).length;
    }, 0) / recentDraws.length;
    // Normalize: expected hits = pick * pick / numbers
    const expectedHits = (config.pick * config.pick) / config.numbers;
    histScore = Math.min(15, (avgHits - expectedHits) * 5);
  }

  return Math.max(0, Math.min(100,
    avgFreq * 0.4 +
    avgTrend * 5 +
    avgCycle * 8 +
    avgMomentum * 0.3 +
    parityScore +
    sumScore +
    frameScore +
    coverageScore +
    seqPenalty +
    histScore +
    25 // base
  ));
}

// ═══════════════════════════════════════════════════════
// Step 8: Main pipeline
// ═══════════════════════════════════════════════════════

export function runExtremePipeline(
  stats: NumberStats[],
  config: LotteryConfig,
  draws: DrawResult[],
  ecfg: ExtremeConfig
): ExtremeResult {
  const start = performance.now();
  const pipeline: PipelineStep[] = [];
  const classified = classifyNumbers(stats);
  const lastDraw = draws.length > 0 ? draws[0].numbers : [];

  // Step 3: Mass generation
  const raw = massGenerate(ecfg.totalCandidates, stats, config, classified, ecfg);
  pipeline.push({ name: "Geração Massiva", inputCount: ecfg.totalCandidates, outputCount: raw.length, filtered: ecfg.totalCandidates - raw.length });

  // Step 4: Math filters
  const mathResult = applyMathFilters(raw, ecfg);
  pipeline.push({ name: "Filtros Matemáticos", inputCount: raw.length, outputCount: mathResult.result.length, filtered: raw.length - mathResult.result.length, fallback: mathResult.fallback });

  // Step 5: Statistical filters
  const statResult = applyStatFilters(mathResult.result, ecfg, config);
  pipeline.push({ name: "Filtros Estatísticos", inputCount: mathResult.result.length, outputCount: statResult.result.length, filtered: mathResult.result.length - statResult.result.length, fallback: statResult.fallback });

  // Step 6: Pattern filters
  const patternResult = applyPatternFilters(statResult.result, ecfg, config, lastDraw, classified);
  pipeline.push({ name: "Filtros de Padrões", inputCount: statResult.result.length, outputCount: patternResult.result.length, filtered: statResult.result.length - patternResult.result.length, fallback: patternResult.fallback });

  // Step 7: Score all remaining
  const scored = afterPattern.map(bet => ({
    bet,
    score: scoreBet(bet, stats, config, draws, classified, ecfg),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Step 8: Take top N and build final result
  const topBets = scored.slice(0, ecfg.topN);
  pipeline.push({ name: "Ranking & Seleção", inputCount: afterPattern.length, outputCount: topBets.length, filtered: afterPattern.length - topBets.length });

  const bets: ExtremeBet[] = topBets.map((item, i) => {
    const bet = item.bet;
    const evens = bet.filter(n => n % 2 === 0).length;
    const odds = bet.length - evens;
    const sum = bet.reduce((a, b) => a + b, 0);
    const fc = config.id === "lotofacil" ? analyzeFrameCenter(bet) : { frame: 0, center: 0, ratio: "N/A" };
    const gridCols = config.id === "lotofacil" ? 5 : Math.ceil(Math.sqrt(config.numbers));
    const rows = analyzeRowDistribution(bet, gridCols, config.numbers);
    const repeated = lastDraw.length > 0 ? bet.filter(n => lastDraw.includes(n)).length : 0;
    const hotNumbers = bet.filter(n => classified.hot.includes(n)).length;
    const coldNumbers = bet.filter(n => classified.cold.includes(n)).length;

    return {
      numbers: bet,
      rank: i + 1,
      score: Math.round(item.score),
      quality: evaluateBetQuality(bet, stats, config, draws),
      parityLabel: `${evens}P/${odds}I`,
      sum,
      frameCenter: fc.ratio,
      rowDist: rows.join("-"),
      repeatFromLast: repeated,
      hotNumbers,
      coldNumbers,
    };
  });

  return {
    bets,
    pipeline,
    elapsedMs: Math.round(performance.now() - start),
  };
}
