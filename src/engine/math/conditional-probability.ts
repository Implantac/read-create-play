import { DrawResult, LotteryConfig } from "@/data/lotteries";

// ═══════════════════════════════════════════════════════
// Motor de Probabilidade Condicional Dinâmica
// P(número | condições do sorteio anterior)
// ═══════════════════════════════════════════════════════

export interface DrawConditions {
  evenCount: [number, number]; // min, max pares
  sumRange: [number, number]; // min, max soma
  consecutivePairs: [number, number]; // min, max sequências consecutivas
}

export interface ConditionalProbability {
  number: number;
  probability: number; // 0-1
  occurrences: number; // vezes que apareceu dado as condições
  totalMatching: number; // total de sorteios que atendem as condições
  lift: number; // prob condicional / prob marginal
  signal: "forte" | "moderado" | "neutro" | "fraco";
}

function countEven(nums: number[]): number {
  return nums.filter(n => n % 2 === 0).length;
}

function countConsecutivePairs(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) count++;
  }
  return count;
}

function drawSum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function matchesConditions(draw: DrawResult, conditions: DrawConditions): boolean {
  const even = countEven(draw.numbers);
  if (even < conditions.evenCount[0] || even > conditions.evenCount[1]) return false;

  const sum = drawSum(draw.numbers);
  if (sum < conditions.sumRange[0] || sum > conditions.sumRange[1]) return false;

  const consec = countConsecutivePairs(draw.numbers);
  if (consec < conditions.consecutivePairs[0] || consec > conditions.consecutivePairs[1]) return false;

  return true;
}

/**
 * Calcula P(número X aparece no sorteio N+1 | sorteio N atende às condições)
 */
export function computeConditionalProbabilities(
  draws: DrawResult[],
  config: LotteryConfig,
  conditions: DrawConditions
): ConditionalProbability[] {
  // draws sorted desc by concurso — we need pairs (draw[i], draw[i-1])
  // draw[i] is newer, draw[i+1] is the previous one
  // We check if draw[i+1] matches conditions, then count numbers in draw[i]

  const sortedDraws = [...draws].sort((a, b) => b.concurso - a.concurso);

  // Marginal frequency of each number
  const marginalFreq = new Map<number, number>();
  for (let n = 1; n <= config.numbers; n++) marginalFreq.set(n, 0);
  sortedDraws.forEach(d => d.numbers.forEach(n => marginalFreq.set(n, (marginalFreq.get(n) || 0) + 1)));

  // Conditional: when previous draw matches conditions, what appeared next?
  const condFreq = new Map<number, number>();
  for (let n = 1; n <= config.numbers; n++) condFreq.set(n, 0);

  let matchingCount = 0;

  for (let i = 0; i < sortedDraws.length - 1; i++) {
    const previousDraw = sortedDraws[i + 1]; // older draw
    const nextDraw = sortedDraws[i]; // newer draw (what came after)

    if (matchesConditions(previousDraw, conditions)) {
      matchingCount++;
      nextDraw.numbers.forEach(n => condFreq.set(n, (condFreq.get(n) || 0) + 1));
    }
  }

  if (matchingCount === 0) {
    return Array.from({ length: config.numbers }, (_, i) => ({
      number: i + 1,
      probability: 0,
      occurrences: 0,
      totalMatching: 0,
      lift: 1,
      signal: "neutro" as const,
    }));
  }

  const totalDraws = sortedDraws.length;

  return Array.from({ length: config.numbers }, (_, i) => {
    const n = i + 1;
    const condCount = condFreq.get(n) || 0;
    const margCount = marginalFreq.get(n) || 0;

    const condProb = condCount / matchingCount;
    const margProb = margCount / totalDraws;
    const lift = margProb > 0 ? condProb / margProb : 1;

    let signal: ConditionalProbability["signal"] = "neutro";
    if (lift > 1.3) signal = "forte";
    else if (lift > 1.1) signal = "moderado";
    else if (lift < 0.7) signal = "fraco";

    return {
      number: n,
      probability: condProb,
      occurrences: condCount,
      totalMatching: matchingCount,
      lift,
      signal,
    };
  }).sort((a, b) => b.probability - a.probability);
}

/**
 * Auto-detecta as condições do último sorteio
 */
export function detectLastDrawConditions(draws: DrawResult[]): DrawConditions {
  if (draws.length === 0) {
    return { evenCount: [0, 100], sumRange: [0, 99999], consecutivePairs: [0, 100] };
  }

  const sorted = [...draws].sort((a, b) => b.concurso - a.concurso);
  const last = sorted[0];

  const even = countEven(last.numbers);
  const sum = drawSum(last.numbers);
  const consec = countConsecutivePairs(last.numbers);

  // Create ranges with small tolerance
  return {
    evenCount: [Math.max(0, even - 1), even + 1],
    sumRange: [Math.max(0, sum - 20), sum + 20],
    consecutivePairs: [Math.max(0, consec), consec + 1],
  };
}

/**
 * Gera sugestões de condições comuns para análise
 */
export function getCommonConditionPresets(config: LotteryConfig): { label: string; conditions: DrawConditions }[] {
  const maxSum = config.numbers * config.pick;
  const midSum = Math.round(maxSum * 0.5);
  const halfPick = Math.round(config.pick / 2);

  return [
    {
      label: "Maioria Par",
      conditions: { evenCount: [halfPick, config.pick], sumRange: [0, maxSum], consecutivePairs: [0, config.pick] },
    },
    {
      label: "Maioria Ímpar",
      conditions: { evenCount: [0, halfPick - 1], sumRange: [0, maxSum], consecutivePairs: [0, config.pick] },
    },
    {
      label: "Soma Alta",
      conditions: { evenCount: [0, config.pick], sumRange: [midSum, maxSum], consecutivePairs: [0, config.pick] },
    },
    {
      label: "Soma Baixa",
      conditions: { evenCount: [0, config.pick], sumRange: [0, midSum], consecutivePairs: [0, config.pick] },
    },
    {
      label: "Com Sequências",
      conditions: { evenCount: [0, config.pick], sumRange: [0, maxSum], consecutivePairs: [2, config.pick] },
    },
    {
      label: "Sem Sequências",
      conditions: { evenCount: [0, config.pick], sumRange: [0, maxSum], consecutivePairs: [0, 0] },
    },
  ];
}
