/**
 * Auto Matrix Picker
 * -----------------------------------------------------------------------------
 * Escolhe a matriz de desdobramento mais eficiente para um determinado
 * orçamento, tamanho da base disponível e loteria. Retorna a matriz vencedora
 * mais um ranking das top alternativas.
 *
 * Heurística: filtra matrizes compatíveis (mesma loteria, baseSize <= base do
 * usuário, custo total dentro do orçamento), então ordena por
 *   score = garantia * 100  +  eficiência%  -  custo/orçamento * 30
 * priorizando garantia matemática elevada, boa eficiência e custo aderente.
 */
import {
  WHEELING_MATRICES,
  type WheelingMatrixId,
} from "@/ai/engines/wheelingMatrices";
import { getLotteryConfig } from "@/data/lotteries";

export interface AutoMatrixOption {
  id: WheelingMatrixId;
  name: string;
  description: string;
  baseSize: number;
  guarantee: number;
  gameCount: number;
  efficiency: string;
  probability: string;
  cost: number;
  score: number;
}

export interface AutoMatrixResult {
  best: AutoMatrixOption | null;
  alternatives: AutoMatrixOption[];
  reason?: string;
}

/**
 * Retorna o preço unitário do bilhete oficial da loteria (valores 2024/2026).
 */
function unitPrice(lotteryId: string): number {
  const cfg = getLotteryConfig(lotteryId);
  return cfg?.basePrice ?? 5;
}

export function pickBestMatrix(params: {
  lotteryId: string;
  availableBaseSize: number;
  budget: number;
}): AutoMatrixResult {
  const { lotteryId, availableBaseSize, budget } = params;
  const price = unitPrice(lotteryId);

  const parseEff = (s: string) => {
    const m = /(\d+)/.exec(s ?? "");
    return m ? parseInt(m[1], 10) : 70;
  };

  const options: AutoMatrixOption[] = (
    Object.entries(WHEELING_MATRICES) as [WheelingMatrixId, typeof WHEELING_MATRICES[WheelingMatrixId]][]
  )
    .filter(([, m]) => m.lottery === lotteryId)
    .filter(([, m]) => m.baseSize <= availableBaseSize)
    .map(([id, m]) => {
      const cost = m.games.length * price;
      const eff = parseEff(m.efficiency);
      const budgetFit = budget > 0 ? Math.min(1, cost / budget) : 1;
      const score =
        m.guarantee * 100 + eff - budgetFit * 30 + (cost <= budget ? 15 : -25);
      return {
        id,
        name: m.name,
        description: m.description,
        baseSize: m.baseSize,
        guarantee: m.guarantee,
        gameCount: m.games.length,
        efficiency: m.efficiency,
        probability: m.probability,
        cost,
        score: Math.round(score * 10) / 10,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (options.length === 0) {
    return {
      best: null,
      alternatives: [],
      reason: `Nenhuma matriz disponível para ${lotteryId} com base ≥${availableBaseSize}.`,
    };
  }

  const within = options.filter((o) => o.cost <= budget);
  const best = within[0] ?? options[0];
  return {
    best,
    alternatives: options.filter((o) => o.id !== best.id).slice(0, 4),
    reason:
      within.length === 0
        ? `Nenhuma matriz cabe no orçamento R$ ${budget.toFixed(2)}. Sugerimos a mais próxima.`
        : undefined,
  };
}
