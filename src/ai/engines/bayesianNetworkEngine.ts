/**
 * Native AI — Bayesian Network Engine v1.0
 * Conditional dependency modeling between numbers using naive Bayes
 * and network graph analysis for enhanced prediction.
 * PURE OVERLAY — no existing logic modified.
 */

import { DrawResult } from "@/data/lotteries";
import { getLotteryRules } from "../knowledge/lotteriesKnowledge";

// ═══════════════════════════════════════════════════════
// 1. CONDITIONAL PROBABILITY NETWORK
// ═══════════════════════════════════════════════════════

export interface ConditionalNode {
  number: number;
  /** P(number appears) */
  prior: number;
  /** P(number | last draw contained X) for top influencers */
  conditionals: { given: number; probability: number; lift: number }[];
  /** Network centrality: how many other numbers this influences */
  centrality: number;
  /** Bayesian posterior given recent context */
  posterior: number;
}

/** Build a conditional probability network from draws */
export function buildConditionalNetwork(
  draws: DrawResult[],
  lotteryId: string,
  window: number = 120
): ConditionalNode[] {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  if (subset.length < 20) return [];

  const totalNumbers = rules.totalNumbers;
  const n = subset.length;

  // Marginal probabilities
  const marginal = new Float64Array(totalNumbers + 1);
  for (const d of subset) {
    for (const num of d.numbers) {
      marginal[num]++;
    }
  }
  for (let i = 1; i <= totalNumbers; i++) {
    marginal[i] /= n;
  }

  // Conditional: P(j in draw[t] | i in draw[t-1])
  const condCount = new Map<string, number>();
  const givenCount = new Float64Array(totalNumbers + 1);

  for (let t = 1; t < subset.length; t++) {
    const prev = subset[t].numbers; // older draw
    const curr = subset[t - 1].numbers; // newer draw
    const prevSet = new Set(prev);
    const currSet = new Set(curr);

    for (const i of prev) {
      givenCount[i]++;
      for (const j of curr) {
        const key = `${i}-${j}`;
        condCount.set(key, (condCount.get(key) || 0) + 1);
      }
    }
  }

  // Build nodes
  const nodes: ConditionalNode[] = [];
  const lastDraw = subset.length > 0 ? new Set(subset[0].numbers) : new Set<number>();
  const secondLastDraw = subset.length > 1 ? new Set(subset[1].numbers) : new Set<number>();

  for (let num = 1; num <= totalNumbers; num++) {
    const prior = marginal[num] || (rules.pick / totalNumbers);

    // Find top conditional influences
    const conditionals: { given: number; probability: number; lift: number }[] = [];
    for (let given = 1; given <= totalNumbers; given++) {
      if (givenCount[given] === 0) continue;
      const key = `${given}-${num}`;
      const jointCount = condCount.get(key) || 0;
      const condProb = jointCount / givenCount[given];
      const lift = prior > 0 ? condProb / prior : 0;
      if (lift > 1.1 || lift < 0.8) { // Only store significant relationships
        conditionals.push({ given, probability: condProb, lift });
      }
    }

    // Sort by absolute deviation from lift=1 (most influential)
    conditionals.sort((a, b) => Math.abs(b.lift - 1) - Math.abs(a.lift - 1));
    const topConditionals = conditionals.slice(0, 15);

    // Centrality: how many numbers this number significantly influences
    let centrality = 0;
    for (let target = 1; target <= totalNumbers; target++) {
      const key = `${num}-${target}`;
      const jointCount = condCount.get(key) || 0;
      if (givenCount[num] > 0) {
        const condProb = jointCount / givenCount[num];
        const targetPrior = marginal[target] || (rules.pick / totalNumbers);
        const lift = targetPrior > 0 ? condProb / targetPrior : 0;
        if (lift > 1.15) centrality++;
      }
    }

    // Compute Bayesian posterior given the last draw
    let posterior = prior;
    if (lastDraw.size > 0) {
      // Naive Bayes: P(num | last draw) ∝ P(num) * ∏ P(given_i | num)
      let logLikelihood = 0;
      let relevantCount = 0;
      for (const cond of topConditionals) {
        if (lastDraw.has(cond.given)) {
          logLikelihood += Math.log(Math.max(0.01, cond.lift));
          relevantCount++;
        }
      }
      if (relevantCount > 0) {
        // Dampen update to avoid extreme shifts
        const dampedLikelihood = logLikelihood / Math.sqrt(relevantCount);
        posterior = Math.min(0.95, Math.max(0.01, prior * Math.exp(dampedLikelihood)));
      }
    }

    nodes.push({
      number: num,
      prior,
      conditionals: topConditionals,
      centrality,
      posterior,
    });
  }

  return nodes;
}

// ═══════════════════════════════════════════════════════
// 2. NETWORK SCORING — Score a game by Bayesian network
// ═══════════════════════════════════════════════════════

export interface BayesianNetworkScore {
  /** 0-100, overall Bayesian network alignment */
  networkScore: number;
  /** Average posterior probability of selected numbers */
  avgPosterior: number;
  /** How many high-centrality numbers are included */
  centralityCount: number;
  /** Internal consistency: do selected numbers "support" each other? */
  internalConsistency: number;
  /** Risk metric: concentrated vs diversified conditional dependencies */
  dependencyDiversity: number;
}

/** Score a game using the Bayesian conditional network */
export function scoreByBayesianNetwork(
  numbers: number[],
  network: ConditionalNode[]
): BayesianNetworkScore {
  if (network.length === 0) {
    return { networkScore: 50, avgPosterior: 0, centralityCount: 0, internalConsistency: 0.5, dependencyDiversity: 0.5 };
  }

  const nodeMap = new Map(network.map(n => [n.number, n]));
  const numSet = new Set(numbers);

  // 1. Average posterior
  let totalPosterior = 0;
  let centralityCount = 0;
  const posteriors: number[] = [];

  for (const num of numbers) {
    const node = nodeMap.get(num);
    if (node) {
      totalPosterior += node.posterior;
      posteriors.push(node.posterior);
      if (node.centrality >= 5) centralityCount++;
    }
  }

  const avgPosterior = posteriors.length > 0 ? totalPosterior / posteriors.length : 0;

  // 2. Internal consistency: do the selected numbers positively influence each other?
  let consistencyScore = 0;
  let consistencyPairs = 0;

  for (let i = 0; i < numbers.length; i++) {
    const nodeI = nodeMap.get(numbers[i]);
    if (!nodeI) continue;
    for (const cond of nodeI.conditionals) {
      if (numSet.has(cond.given) && cond.lift > 1) {
        consistencyScore += cond.lift - 1;
        consistencyPairs++;
      }
    }
  }

  const internalConsistency = consistencyPairs > 0
    ? Math.min(1, consistencyScore / consistencyPairs)
    : 0.5;

  // 3. Dependency diversity: count unique conditional influencers
  const uniqueInfluencers = new Set<number>();
  for (const num of numbers) {
    const node = nodeMap.get(num);
    if (node) {
      for (const cond of node.conditionals.slice(0, 5)) {
        if (cond.lift > 1) uniqueInfluencers.add(cond.given);
      }
    }
  }
  const dependencyDiversity = Math.min(1, uniqueInfluencers.size / (numbers.length * 2));

  // 4. Composite network score
  const avgPrior = network.reduce((s, n) => s + n.prior, 0) / network.length;
  const posteriorLift = avgPrior > 0 ? avgPosterior / avgPrior : 1;

  const networkScore = Math.max(0, Math.min(100, Math.round(
    50 +
    (posteriorLift - 1) * 30 +           // posterior lift
    internalConsistency * 15 +            // internal support
    (centralityCount / numbers.length) * 10 +  // centrality
    dependencyDiversity * 10 -            // diversity
    (posteriors.length < numbers.length ? 5 : 0) // penalty for unknown numbers
  )));

  return {
    networkScore,
    avgPosterior,
    centralityCount,
    internalConsistency,
    dependencyDiversity,
  };
}

// ═══════════════════════════════════════════════════════
// 3. CONDITIONAL TREND ANALYSIS
// ═══════════════════════════════════════════════════════

export interface ConditionalTrend {
  number: number;
  /** Is this number's appearance becoming MORE or LESS dependent on specific predecessors? */
  trendDirection: "strengthening" | "weakening" | "stable";
  /** Confidence in trend detection */
  confidence: number;
  /** Top emerging conditional relationship */
  emergingLink: { given: number; recentLift: number; historicalLift: number } | null;
}

/** Detect evolving conditional dependencies */
export function detectConditionalTrends(
  draws: DrawResult[],
  lotteryId: string
): ConditionalTrend[] {
  const rules = getLotteryRules(lotteryId);
  if (draws.length < 60) return [];

  // Build networks for recent vs older windows
  const recentNetwork = buildConditionalNetwork(draws, lotteryId, 40);
  const olderNetwork = buildConditionalNetwork(draws.slice(40), lotteryId, 80);

  if (recentNetwork.length === 0 || olderNetwork.length === 0) return [];

  const olderMap = new Map(olderNetwork.map(n => [n.number, n]));
  const trends: ConditionalTrend[] = [];

  for (const recent of recentNetwork) {
    const older = olderMap.get(recent.number);
    if (!older) continue;

    // Compare top conditional relationships
    let strengthChange = 0;
    let comparisonCount = 0;
    let bestEmerging: { given: number; recentLift: number; historicalLift: number } | null = null;
    let bestEmergingDelta = 0;

    for (const rc of recent.conditionals.slice(0, 8)) {
      const oc = older.conditionals.find(c => c.given === rc.given);
      if (oc) {
        const delta = rc.lift - oc.lift;
        strengthChange += delta;
        comparisonCount++;

        if (Math.abs(delta) > bestEmergingDelta) {
          bestEmergingDelta = Math.abs(delta);
          bestEmerging = { given: rc.given, recentLift: rc.lift, historicalLift: oc.lift };
        }
      }
    }

    if (comparisonCount === 0) continue;

    const avgChange = strengthChange / comparisonCount;
    const trendDirection: "strengthening" | "weakening" | "stable" =
      avgChange > 0.15 ? "strengthening" : avgChange < -0.15 ? "weakening" : "stable";

    trends.push({
      number: recent.number,
      trendDirection,
      confidence: Math.min(1, comparisonCount / 5),
      emergingLink: bestEmergingDelta > 0.1 ? bestEmerging : null,
    });
  }

  return trends;
}

// ═══════════════════════════════════════════════════════
// 4. MUTUAL INFORMATION SCORING
// ═══════════════════════════════════════════════════════

/** Compute mutual information between a number and draw outcomes */
export function computeMutualInformation(
  draws: DrawResult[],
  lotteryId: string,
  window: number = 100
): Map<number, number> {
  const rules = getLotteryRules(lotteryId);
  const subset = draws.slice(0, Math.min(window, draws.length));
  if (subset.length < 20) return new Map();

  const n = subset.length;
  const miScores = new Map<number, number>();

  for (let num = 1; num <= rules.totalNumbers; num++) {
    // Compute MI between "num in draw[t-1]" and "num in draw[t]"
    let n11 = 0, n10 = 0, n01 = 0, n00 = 0;

    for (let t = 1; t < subset.length; t++) {
      const inPrev = subset[t].numbers.includes(num) ? 1 : 0;
      const inCurr = subset[t - 1].numbers.includes(num) ? 1 : 0;
      if (inPrev && inCurr) n11++;
      else if (inPrev && !inCurr) n10++;
      else if (!inPrev && inCurr) n01++;
      else n00++;
    }

    const total = n11 + n10 + n01 + n00;
    if (total === 0) continue;

    // MI = Σ P(x,y) * log2(P(x,y) / (P(x)*P(y)))
    let mi = 0;
    const counts = [[n11, 1, 1], [n10, 1, 0], [n01, 0, 1], [n00, 0, 0]];
    const pX1 = (n11 + n10) / total;
    const pX0 = (n01 + n00) / total;
    const pY1 = (n11 + n01) / total;
    const pY0 = (n10 + n00) / total;

    for (const [count, x, y] of counts) {
      if (count === 0) continue;
      const pXY = count / total;
      const pX = x === 1 ? pX1 : pX0;
      const pY = y === 1 ? pY1 : pY0;
      if (pX > 0 && pY > 0) {
        mi += pXY * Math.log2(pXY / (pX * pY));
      }
    }

    miScores.set(num, Math.max(0, mi));
  }

  return miScores;
}

/** Score a game by mutual information — prefer numbers with high self-MI (predictable) */
export function scoreByMutualInformation(
  numbers: number[],
  miScores: Map<number, number>
): number {
  if (miScores.size === 0) return 50;

  const allMI = [...miScores.values()];
  const avgMI = allMI.reduce((a, b) => a + b, 0) / allMI.length;
  const maxMI = Math.max(...allMI, 0.001);

  let totalMI = 0;
  for (const n of numbers) {
    totalMI += miScores.get(n) || 0;
  }
  const gameMI = totalMI / numbers.length;

  // Score: how much above average MI the game has
  const normalized = avgMI > 0 ? gameMI / avgMI : 1;
  return Math.max(0, Math.min(100, Math.round(50 + (normalized - 1) * 40)));
}
