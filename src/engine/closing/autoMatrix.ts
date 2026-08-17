import { LOTTERY_BET_COST } from "@/engine/betting-budget";
import { getMatricesForLottery, WHEELING_MATRICES } from "@/ai/engines/wheelingMatrices";

interface PickMatrixParams {
  lotteryId: string;
  availableBaseSize: number;
  budget: number;
  targetGuarantee?: number;
}

export interface MatrixSuggestion {
  id: string;
  name: string;
  description: string;
  baseSize: number;
  gameCount: number;
  guarantee: number;
  cost: number;
}

/**
 * Picks the best wheeling matrix based on base size and budget.
 */
export function pickBestMatrix({
  lotteryId,
  availableBaseSize,
  budget,
  targetGuarantee = 14
}: PickMatrixParams): { best: MatrixSuggestion | null; alternatives: MatrixSuggestion[]; reason: string } {
  const costPerGame = LOTTERY_BET_COST[lotteryId] || 3.0;
  const available = getMatricesForLottery(lotteryId);

  // Filter matrices that fit within budget and use no more than available base size
  const affordable = available
    .map(m => ({
      ...m,
      cost: m.gameCount * costPerGame
    }))
    .filter(m => m.cost <= budget && m.baseSize <= availableBaseSize)
    .sort((a, b) => {
      // Priority 1: Higher guarantee
      if (b.guarantee !== a.guarantee) return b.guarantee - a.guarantee;
      // Priority 2: Larger base size (better coverage)
      if (b.baseSize !== a.baseSize) return b.baseSize - a.baseSize;
      // Priority 3: Cheaper cost
      return a.cost - b.cost;
    });

  if (affordable.length === 0) {
    return {
      best: null,
      alternatives: [],
      reason: budget < costPerGame ? "Orçamento insuficiente para 1 jogo." : "Nenhuma matriz encontrada para este orçamento e tamanho de base."
    };
  }

  const best = affordable[0];
  const alternatives = affordable.slice(1, 5);

  return {
    best: {
      id: best.id,
      name: best.name,
      description: best.description,
      baseSize: best.baseSize,
      gameCount: best.gameCount,
      guarantee: best.guarantee,
      cost: best.cost
    },
    alternatives: alternatives.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      baseSize: a.baseSize,
      gameCount: a.gameCount,
      guarantee: a.guarantee,
      cost: a.cost
    })),
    reason: "Matriz otimizada para o seu orçamento atual."
  };
}
