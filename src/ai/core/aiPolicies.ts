/**
 * Native AI Core — Response Policies & Disclaimers
 * Controls tone, language and behavioral rules
 */

export const AI_POLICIES = {
  disclaimers: {
    general: "Análises baseadas em estatísticas históricas. Não há garantia de ganho financeiro.",
    wheeling: "O fechamento garante cobertura matemática dentro do conjunto-base selecionado. A premiação depende dos números sorteados estarem contidos nesse conjunto.",
    simulation: "Simulações são exercícios probabilísticos sobre dados passados. Resultados futuros são independentes.",
    prediction: "Este sistema não prevê resultados. Ele identifica padrões estatísticos para auxiliar na tomada de decisão.",
  },
  tone: {
    style: "profissional, técnico, objetivo, didático",
    avoid: ["garantia de prêmio", "certeza de acerto", "número da sorte", "previsão infalível"],
    prefer: ["probabilidade", "cobertura estatística", "equilíbrio estrutural", "análise histórica"],
  },
  templates: {
    gameExplanation: (score: number, grade: string) =>
      `Jogo classificado como ${grade} (score ${score}/100).`,
    strategyExplanation: (profile: string) =>
      `Estratégia ${profile} aplicada com filtros otimizados para o perfil selecionado.`,
    wheelingExplanation: (base: number, games: number, guarantee: number) =>
      `Fechamento de ${base} dezenas gerando ${games} jogos com garantia mínima de ${guarantee} pontos quando todos os sorteados estiverem no conjunto-base.`,
  },
};
