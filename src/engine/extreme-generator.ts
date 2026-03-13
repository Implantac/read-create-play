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
}

// ═══════════════════════════════════════════════════════
// Default configs per lottery
// ═══════════════════════════════════════════════════════

export function getDefaultExtremeConfig(config: LotteryConfig, draws: DrawResult[]): ExtremeConfig {
  const isLF = config.id === "lotofacil";
  const idealEven = Math.round(config.pick / 2);

  // Compute sum range from history
  let sumMin = 0, sumMax = 999;
  if (draws.length > 0) {
    const sums = draws.slice(0, 200).map(d => d.numbers.reduce((a, b) => a + b, 0));
    const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
    const std = Math.sqrt(sums.reduce((s, v) => s + (v - avg) ** 2, 0) / sums.length);
    sumMin = Math.round(avg - std * 1.5);
    sumMax = Math.round(avg + std * 1.5);
  }

  // Compute repeat range from history
  let repMin = 0, repMax = config.pick;
  if (draws.length > 1) {
    const reps = [];
    for (let i = 0; i < Math.min(200, draws.length - 1); i++) {
      const rep = draws[i].numbers.filter(n => draws[i + 1].numbers.includes(n)).length;
      reps.push(rep);
    }
    const avg = reps.reduce((a, b) => a + b, 0) / reps.length;
    const std = Math.sqrt(reps.reduce((s, v) => s + (v - avg) ** 2, 0) / reps.length);
    repMin = Math.max(0, Math.round(avg - std * 1.5));
    repMax = Math.min(config.pick, Math.round(avg + std * 1.5));
  }

  return {
    totalCandidates: isLF ? 50000 : 30000,
    topN: 50,
    parityRange: [Math.max(0, idealEven - 2), Math.min(config.pick, idealEven + 2)],
    sumRange: [sumMin, sumMax],
    minPerRow: isLF ? 2 : 0,
    maxPerRow: isLF ? 4 : config.pick,
    minPerCol: isLF ? 1 : 0,
    maxPerCol: isLF ? 4 : config.pick,
    maxSequenceRun: isLF ? 4 : 4,
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

function applyMathFilters(candidates: number[][], ecfg: ExtremeConfig): number[][] {
  return candidates.filter(bet => {
    // Parity
    const evens = bet.filter(n => n % 2 === 0).length;
    if (evens < ecfg.parityRange[0] || evens > ecfg.parityRange[1]) return false;

    // Sum
    const sum = bet.reduce((a, b) => a + b, 0);
    if (sum < ecfg.sumRange[0] || sum > ecfg.sumRange[1]) return false;

    return true;
  });
}

// ═══════════════════════════════════════════════════════
// Step 5: Statistical filters (rows, cols, sequences)
// ═══════════════════════════════════════════════════════

function applyStatFilters(candidates: number[][], ecfg: ExtremeConfig, config: LotteryConfig): number[][] {
  const gridCols = config.id === "lotofacil" ? 5 : Math.ceil(Math.sqrt(config.numbers));

  return candidates.filter(bet => {
    // Row distribution
    if (ecfg.minPerRow > 0 || ecfg.maxPerRow < config.pick) {
      const rows = analyzeRowDistribution(bet, gridCols);
      if (rows.some(r => r < ecfg.minPerRow) || rows.some(r => r > ecfg.maxPerRow)) return false;
    }

    // Column distribution
    if (ecfg.minPerCol > 0 || ecfg.maxPerCol < config.pick) {
      const colDist = new Array(gridCols).fill(0);
      for (const n of bet) {
        const col = (n - 1) % gridCols;
        if (col < gridCols) colDist[col]++;
      }
      if (colDist.some(c => c < ecfg.minPerCol) || colDist.some(c => c > ecfg.maxPerCol)) return false;
    }

    // Max sequence run
    const sorted = [...bet].sort((a, b) => a - b);
    let maxRun = 1, curRun = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) { curRun++; maxRun = Math.max(maxRun, curRun); }
      else curRun = 1;
    }
    if (maxRun > ecfg.maxSequenceRun) return false;

    return true;
  });
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
): number[][] {
  return candidates.filter(bet => {
    // Frame/Center (Lotofácil)
    if (config.id === "lotofacil") {
      const fc = analyzeFrameCenter(bet);
      if (fc.frame < ecfg.frameRange[0] || fc.frame > ecfg.frameRange[1]) return false;
    }

    // Repeat from last draw
    if (lastDraw.length > 0) {
      const repeated = bet.filter(n => lastDraw.includes(n)).length;
      if (repeated < ecfg.repeatRange[0] || repeated > ecfg.repeatRange[1]) return false;
    }

    // Frequency mix: ensure reasonable hot/cold distribution
    const hotCount = bet.filter(n => classified.hot.includes(n)).length;
    const coldCount = bet.filter(n => classified.cold.includes(n)).length;
    // Allow ±2 from ideal
    if (Math.abs(hotCount - ecfg.hotCount) > 3) return false;
    if (Math.abs(coldCount - ecfg.coldCount) > 3) return false;

    return true;
  });
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
  const afterMath = applyMathFilters(raw, ecfg);
  pipeline.push({ name: "Filtros Matemáticos", inputCount: raw.length, outputCount: afterMath.length, filtered: raw.length - afterMath.length });

  // Step 5: Statistical filters
  const afterStat = applyStatFilters(afterMath, ecfg, config);
  pipeline.push({ name: "Filtros Estatísticos", inputCount: afterMath.length, outputCount: afterStat.length, filtered: afterMath.length - afterStat.length });

  // Step 6: Pattern filters
  const afterPattern = applyPatternFilters(afterStat, ecfg, config, lastDraw, classified);
  pipeline.push({ name: "Filtros de Padrões", inputCount: afterStat.length, outputCount: afterPattern.length, filtered: afterStat.length - afterPattern.length });

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
    const rows = analyzeRowDistribution(bet, gridCols);
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
