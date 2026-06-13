/**
 * Native AI — Strategy Knowledge Base
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
}

export const STRATEGIES: Record<string, StrategyDefinition> = {
  conservative: {
    id: "conservative",
    name: "Conservador",
    description: "Prioriza números com alta frequência histórica e padrões estáveis. Ideal para quem busca consistência.",
    riskLevel: "low",
    filters: { hotBias: 0.6, coldBias: 0.1, diversityWeight: 0.8, sequencePenalty: 2.0 },
  },
  balanced: {
    id: "balanced",
    name: "Equilibrado",
    description: "Mix balanceado entre números quentes, médios e frios. Estratégia versátil.",
    riskLevel: "medium",
    filters: { hotBias: 0.4, coldBias: 0.2, diversityWeight: 0.5, sequencePenalty: 1.0 },
  },
  aggressive: {
    id: "aggressive",
    name: "Agressivo",
    description: "Favorece números atrasados e padrões incomuns. Maior risco, maior potencial de cobertura diferenciada.",
    riskLevel: "high",
    filters: { hotBias: 0.2, coldBias: 0.4, diversityWeight: 0.3, sequencePenalty: 0.5 },
  },
  statistical: {
    id: "statistical",
    name: "Estatístico",
    description: "Baseado puramente em análise estatística, sem viés de tendência.",
    riskLevel: "medium",
    filters: { hotBias: 0.5, coldBias: 0.15, diversityWeight: 0.6, sequencePenalty: 1.5 },
  },
  exploratory: {
    id: "exploratory",
    name: "Exploratório",
    description: "Explora combinações menos comuns, ideal para diversificação.",
    riskLevel: "high",
    filters: { hotBias: 0.15, coldBias: 0.5, diversityWeight: 0.9, sequencePenalty: 0.3 },
  },
  max_coverage: {
    id: "max_coverage",
    name: "Cobertura Máxima",
    description: "Maximiza a dispersão numérica para cobrir mais faixas.",
    riskLevel: "medium",
    filters: { hotBias: 0.3, coldBias: 0.3, diversityWeight: 1.0, sequencePenalty: 1.0 },
  },
  anti_popular: {
    id: "anti_popular",
    name: "Anti-Popular",
    description: "Evita combinações que muitos jogadores usam, reduzindo rateio em caso de acerto.",
    riskLevel: "high",
    filters: { hotBias: 0.1, coldBias: 0.6, diversityWeight: 0.7, sequencePenalty: 0.8 },
  },
  pro_bettor: {
    id: "pro_bettor",
    name: "Apostador Profissional",
    description: "Combina Monte Carlo, primos, Fibonacci e padrões de coocorrência. Estratégia usada por apostadores experientes que privilegiam jogos estáveis e estatisticamente robustos.",
    riskLevel: "medium",
    filters: { hotBias: 0.45, coldBias: 0.2, diversityWeight: 0.75, sequencePenalty: 1.5 },
  },
  monte_carlo: {
    id: "monte_carlo",
    name: "Monte Carlo",
    description: "Refinado por milhares de simulações; seleciona jogos com maior estabilidade estatística e menor variância.",
    riskLevel: "medium",
    filters: { hotBias: 0.4, coldBias: 0.25, diversityWeight: 0.85, sequencePenalty: 1.2 },
  },
  prime_focus: {
    id: "prime_focus",
    name: "Foco em Primos",
    description: "Otimiza a proporção de números primos/Fibonacci dentro da faixa histórica, padrão sub-explorado pelo apostador comum.",
    riskLevel: "medium",
    filters: { hotBias: 0.35, coldBias: 0.3, diversityWeight: 0.8, sequencePenalty: 1.0 },
  },
};

export function getStrategy(id: string): StrategyDefinition {
  return STRATEGIES[id] || STRATEGIES.balanced;
}
