import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { simulationData, lotteryName, lotteryPick, lotteryNumbers } = await req.json();
    if (!simulationData) throw new Error("simulationData required");

    const lotteryStrategies: Record<string, string> = {
      "Lotofácil": "Na Lotofácil (15/25), foque em cobertura de faixas (1-5, 6-10, 11-15, 16-20, 21-25), equilíbrio par/ímpar próximo de 7/8 ou 8/7, e soma total entre 170-210.",
      "Mega Sena": "Na Mega Sena (6/60), priorize distribuição em 3+ dezenas, evite clusters >2 consecutivos, equilíbrio par/ímpar 3/3 e soma entre 120-220.",
      "Quina": "Na Quina (5/80), distribua em faixas amplas, evite concentração, equilíbrio par/ímpar 2/3 ou 3/2, soma entre 100-250.",
      "Lotomania": "Na Lotomania (50/100), cobertura mínima de 85% das dezenas por faixa, equilíbrio par/ímpar próximo de 25/25, soma entre 2400-2600.",
      "Dupla Sena": "Na Dupla Sena (6/50), estratégia similar à Mega mas universo menor. Distribuição em faixas de 10, equilíbrio par/ímpar 3/3.",
      "Dia de Sorte": "No Dia de Sorte (7/31), cobertura de todas as faixas (1-10, 11-20, 21-31), equilíbrio par/ímpar 3/4 ou 4/3.",
      "Super Sete": "No Super Sete (7 colunas de 0-9), analise frequência por coluna independentemente.",
      "Timemania": "Na Timemania (10/80), distribuição ampla em 8+ faixas, equilíbrio par/ímpar 5/5, soma entre 350-450.",
    };

    const strategyContext = lotteryStrategies[lotteryName] || "";

    const systemPrompt = `Você é um analista estatístico especialista em loterias brasileiras.
Analise os resultados de simulação de apostas e forneça insights acionáveis.
Seja direto, use dados e linguagem clara. Responda em português do Brasil.
Formate sua resposta com seções usando markdown (##, ###, **negrito**, etc).

ESTRATÉGIA ESPECÍFICA PARA ESTA LOTERIA:
${strategyContext}

IMPORTANTE: Além de analisar, você DEVE sugerir melhorias concretas nos jogos.
Identifique dezenas pouco eficientes e sugira substituições específicas baseadas nas regras desta loteria.`;

    const userPrompt = `Loteria: ${lotteryName} (${lotteryPick} números de 1 a ${lotteryNumbers})

RESULTADOS DA SIMULAÇÃO:
Total de concursos analisados: ${simulationData.totalDraws}
Total de jogos testados: ${simulationData.bets.length}

${simulationData.bets.map((b: any, i: number) => {
  const rank = simulationData.ranking.indexOf(i) + 1;
  const distStr = Object.entries(b.hitDistribution)
    .sort((a: any, b: any) => Number(b[0]) - Number(a[0]))
    .map(([hits, count]: any) => `${hits} acertos → ${count}x`)
    .join(", ");
  return `JOGO ${b.bet.id} (Ranking: #${rank}):
  Números: [${b.bet.numbers.join(", ")}]
  Melhor acerto: ${b.bestHit}
  Média de acertos: ${b.avgHits}
  Frequência de premiação: ${b.prizeCount}/${simulationData.totalDraws}
  Estabilidade (desvio): ${b.stability}
  Distribuição: ${distStr}`;
}).join("\n\n")}

Analise os resultados e forneça:
1. **Ranking comentado** dos jogos do melhor ao pior, com explicação do porquê
2. **Padrões identificados** nas combinações mais eficientes (distribuição par/ímpar, faixas, consecutivos)
3. **Dezenas ineficientes** — para cada jogo, identifique 2-4 números que provavelmente prejudicam o desempenho e sugira substituições concretas
4. **Sugestões de novos jogos** — crie 1-2 combinações otimizadas baseadas nos padrões dos jogos de melhor desempenho
5. **Insights estratégicos** sobre distribuição de dezenas, equilíbrio e cobertura
6. **Conclusão** com veredicto final e recomendação de ação

Seja específico com números e porcentagens. Inclua exemplos de jogos sugeridos com números concretos.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Erro na análise de IA");
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || "Análise não disponível.";

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("AI simulation analysis error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
