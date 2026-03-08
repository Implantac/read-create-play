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

    const { topGames, patternInsights, distributionSummary, lotteryName, lotteryPick, lotteryNumbers, totalGenerated, totalEvaluated } = await req.json();
    if (!topGames || topGames.length === 0) throw new Error("topGames required");

    const systemPrompt = `Você é um analista estatístico de elite especializado em loterias brasileiras.
Analise os resultados de uma simulação massiva de apostas e forneça insights acionáveis.
Seja extremamente direto e técnico. Responda em português do Brasil com markdown.

REGRAS:
- Cite números específicos e porcentagens
- Identifique padrões recorrentes nos melhores jogos
- Sugira 3 combinações otimizadas baseadas nos padrões encontrados
- Compare os padrões encontrados com as distribuições ideais para esta loteria
- Dê um score de confiança (0-100) para suas recomendações`;

    const gamesReport = topGames.slice(0, 15).map((g: any, i: number) => 
      `#${i + 1} [${g.numbers.join(",")}] Score:${g.score} Avg:${g.avgHits} Best:${g.bestHit} Prêmios:${g.prizeCount} Par/Ímpar:${g.evenCount}/${g.oddCount} Soma:${g.sum} Consec:${g.consecutivePairs} Spread:${g.rangeSpread}`
    ).join("\n");

    const insightsReport = patternInsights.map((p: any) =>
      `- ${p.label}: ${p.value} (${p.description})`
    ).join("\n");

    const userPrompt = `SIMULAÇÃO MASSIVA — ${lotteryName} (${lotteryPick}/${lotteryNumbers})

ESCALA: ${totalGenerated.toLocaleString()} jogos gerados, ${totalEvaluated.toLocaleString()} comparações realizadas

DISTRIBUIÇÃO GERAL DOS TOP GAMES:
- Soma média: ${distributionSummary.avgSum}
- Razão par/total: ${distributionSummary.avgEvenRatio}
- Consecutivos médios: ${distributionSummary.avgConsecutive}
- Spread médio: ${distributionSummary.avgSpread}
- Melhor acerto geral: ${distributionSummary.bestHitOverall}
- Taxa média de premiação: ${distributionSummary.avgPrizeRate}%

PADRÕES DETECTADOS:
${insightsReport}

TOP 15 JOGOS:
${gamesReport}

Analise profundamente e forneça:
1. **Padrões dominantes** — O que os melhores jogos têm em comum?
2. **Distribuição ideal** — Par/ímpar, soma, faixas, consecutivos ideais para esta loteria
3. **Dezenas-chave** — Quais números aparecem consistentemente nos melhores?
4. **3 jogos otimizados** — Combinações sugeridas baseadas nos padrões (com números concretos)
5. **Score de confiança** — De 0 a 100, quão confiáveis são esses padrões?
6. **Estratégia recomendada** — Como o jogador deve usar esses resultados?`;

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
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      await aiResponse.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI response error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || "Análise não disponível.";

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("AI massive simulation error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
