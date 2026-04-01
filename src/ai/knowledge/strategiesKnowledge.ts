/**
 * Native AI — Strategy Knowledge Base
 * 11 perfis estratégicos avançados para geração de apostas otimizadas
 */

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  filters: {
    hotBias: number;
    coldBias: number;
    diversityWeight: number;
    sequencePenalty: number;
  };
  /** Which analytical engines this strategy emphasizes */
  engineWeights?: {
    frequency?: number;
    gap?: number;
    trend?: number;
    coOccurrence?: number;
    zone?: number;
    cycle?: number;
    special?: number;   // primes/fibonacci
    antiPopular?: number;
  };
}

export const STRATEGIES: Record<string, StrategyDefinition> = {
  conservative: {
    id: "conservative",
    name: "Conservador",
    description: "Prioriza números com alta frequência histórica e padrões estáveis. Ideal para consistência.",
    riskLevel: "low",
    filters: { hotBias: 0.6, coldBias: 0.1, diversityWeight: 0.8, sequencePenalty: 2.0 },
    engineWeights: { frequency: 0.5, gap: 0.1, trend: 0.15, coOccurrence: 0.15, zone: 0.05, cycle: 0.05 },
  },
  balanced: {
    id: "balanced",
    name: "Equilibrado",
    description: "Mix balanceado entre números quentes, médios e frios. Estratégia versátil para qualquer loteria.",
    riskLevel: "medium",
    filters: { hotBias: 0.4, coldBias: 0.2, diversityWeight: 0.5, sequencePenalty: 1.0 },
    engineWeights: { frequency: 0.25, gap: 0.15, trend: 0.2, coOccurrence: 0.15, zone: 0.1, cycle: 0.1, special: 0.05 },
  },
  aggressive: {
    id: "aggressive",
    name: "Agressivo",
    description: "Favorece números atrasados e padrões incomuns. Maior risco, maior potencial de cobertura diferenciada.",
    riskLevel: "high",
    filters: { hotBias: 0.2, coldBias: 0.4, diversityWeight: 0.3, sequencePenalty: 0.5 },
    engineWeights: { frequency: 0.1, gap: 0.35, trend: 0.1, coOccurrence: 0.1, zone: 0.1, cycle: 0.15, special: 0.1 },
  },
  statistical: {
    id: "statistical",
    name: "Estatístico Puro",
    description: "Baseado puramente em análise estatística multidimensional, sem viés de tendência.",
    riskLevel: "medium",
    filters: { hotBias: 0.5, coldBias: 0.15, diversityWeight: 0.6, sequencePenalty: 1.5 },
    engineWeights: { frequency: 0.3, gap: 0.2, trend: 0.15, coOccurrence: 0.2, zone: 0.1, cycle: 0.05 },
  },
  exploratory: {
    id: "exploratory",
    name: "Exploratório",
    description: "Explora combinações menos comuns com alta diversidade, ideal para diversificação de carteira.",
    riskLevel: "high",
    filters: { hotBias: 0.15, coldBias: 0.5, diversityWeight: 0.9, sequencePenalty: 0.3 },
    engineWeights: { frequency: 0.05, gap: 0.15, trend: 0.05, coOccurrence: 0.1, zone: 0.15, cycle: 0.2, special: 0.15, antiPopular: 0.15 },
  },
  max_coverage: {
    id: "max_coverage",
    name: "Cobertura Máxima",
    description: "Maximiza a dispersão numérica para cobrir mais faixas e zonas do volante.",
    riskLevel: "medium",
    filters: { hotBias: 0.3, coldBias: 0.3, diversityWeight: 1.0, sequencePenalty: 1.0 },
    engineWeights: { frequency: 0.15, gap: 0.15, trend: 0.1, coOccurrence: 0.1, zone: 0.35, cycle: 0.05, special: 0.1 },
  },
  anti_popular: {
    id: "anti_popular",
    name: "Anti-Popular",
    description: "Evita combinações populares, reduzindo rateio em caso de acerto. Ideal para prêmios maiores.",
    riskLevel: "high",
    filters: { hotBias: 0.1, coldBias: 0.6, diversityWeight: 0.7, sequencePenalty: 0.8 },
    engineWeights: { frequency: 0.05, gap: 0.2, trend: 0.05, coOccurrence: 0.05, zone: 0.1, cycle: 0.15, antiPopular: 0.4 },
  },

  // ═══════════════════════════════════════════
  // NOVAS ESTRATÉGIAS AVANÇADAS
  // ═══════════════════════════════════════════

  markov: {
    id: "markov",
    name: "Cadeia de Markov",
    description: "Usa probabilidades de transição entre sorteios: quais números tendem a aparecer APÓS os do último concurso.",
    riskLevel: "medium",
    filters: { hotBias: 0.35, coldBias: 0.15, diversityWeight: 0.5, sequencePenalty: 1.0 },
    engineWeights: { frequency: 0.1, gap: 0.1, trend: 0.15, coOccurrence: 0.4, zone: 0.1, cycle: 0.15 },
  },
  momentum: {
    id: "momentum",
    name: "Momentum & Tendência",
    description: "Identifica números em aceleração (aparecem cada vez mais nos últimos concursos) e surfar a onda.",
    riskLevel: "medium",
    filters: { hotBias: 0.5, coldBias: 0.1, diversityWeight: 0.4, sequencePenalty: 1.0 },
    engineWeights: { frequency: 0.15, gap: 0.05, trend: 0.45, coOccurrence: 0.15, zone: 0.1, cycle: 0.1 },
  },
  harmonic: {
    id: "harmonic",
    name: "Harmônico Matemático",
    description: "Combina propriedades matemáticas (primos, Fibonacci, quadrados perfeitos) com equilíbrio estrutural.",
    riskLevel: "low",
    filters: { hotBias: 0.35, coldBias: 0.2, diversityWeight: 0.7, sequencePenalty: 1.5 },
    engineWeights: { frequency: 0.15, gap: 0.1, trend: 0.1, coOccurrence: 0.1, zone: 0.15, cycle: 0.05, special: 0.35 },
  },
  regression: {
    id: "regression",
    name: "Regressão à Média",
    description: "Explora números estatisticamente \"devidos\" — muito abaixo da frequência esperada, com alta chance de retorno.",
    riskLevel: "medium",
    filters: { hotBias: 0.15, coldBias: 0.35, diversityWeight: 0.6, sequencePenalty: 1.0 },
    engineWeights: { frequency: 0.1, gap: 0.4, trend: 0.1, coOccurrence: 0.1, zone: 0.1, cycle: 0.2 },
  },
};

export function getStrategy(id: string): StrategyDefinition {
  return STRATEGIES[id] || STRATEGIES.balanced;
}

/** Get all available strategy IDs */
export function getAllStrategyIds(): string[] {
  return Object.keys(STRATEGIES);
}
