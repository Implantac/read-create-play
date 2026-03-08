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

    const { patternReport, lotteryName, lotteryPick, lotteryNumbers, drawCount } = await req.json();
    if (!patternReport) throw new Error("patternReport required");

    const { summary, parityPatterns, sumPatterns, consecutivePatterns, spatialDistribution, hotStreaks, frequencyTrends } = patternReport;

    const top10Trending = (frequencyTrends || []).slice(0, 10);
    const bottom10 = [...(frequencyTrends || [])].sort((a: any, b: any) => a.momentum - b.momentum).slice(0, 10);

    const systemPrompt = `Você é um analista estatístico especialista em loterias brasileiras.
Analise os padrões detectados nos concursos históricos e gere insights acionáveis.
Responda em português do Brasil com markdown formatado (##, ###, **negrito**, listas).
Seja específico com números, porcentagens e recomendações concretas.`;

    const userPrompt = `Loteria: ${lotteryName} (${lotteryPick} números de 1 a ${lotteryNumbers})
Concursos analisados: ${drawCount}

📊 PADRÕES DE PARIDADE (Par/Ímpar):
${parityPatterns.slice(0, 8).map((p: any) => `${p.evens}P/${p.odds}I: ${p.count}x (${p.percentage}%)`).join("\n")}
Mais comum: ${summary.mostCommonParity}

📊 PADRÕES DE SOMA:
Média: ${summary.avgSum} | Desvio: ${summary.sumStdDev}
${sumPatterns.map((s: any) => `Faixa ${s.rangeLabel}: ${s.count}x (${s.percentage}%)`).join("\n")}

📊 CONSECUTIVOS:
Média de consecutivos por sorteio: ${summary.avgConsecutives}
${consecutivePatterns.map((c: any) => `${c.consecutiveCount} consecutivos: ${c.occurrences}x (${c.percentage}%)`).join("\n")}

📊 DISTRIBUIÇÃO ESPACIAL:
Equilíbrio: ${spatialDistribution.balance}/100
${spatialDistribution.sectors.map((s: any) => `Setor ${s.label}: média ${s.avgCount} (σ ${s.stdDev})`).join("\n")}

📊 TOP 10 DEZENAS EM TENDÊNCIA DE ALTA:
${top10Trending.map((f: any) => `Nº ${f.number}: últimos10=${f.last10Freq} últimos30=${f.last30Freq} momentum=${f.momentum}`).join("\n")}

📊 TOP 10 DEZENAS EM QUEDA:
${bottom10.map((f: any) => `Nº ${f.number}: últimos10=${f.last10Freq} últimos30=${f.last30Freq} momentum=${f.momentum}`).join("\n")}

📊 DEZENAS MAIS CONSISTENTES (menor variação): ${summary.mostConsistent.join(", ")}
📊 DEZENAS ATRASADAS (overdue): ${summary.overdueNumbers.join(", ")}

📊 MAIORES SEQUÊNCIAS QUENTES:
${hotStreaks.slice(0, 8).map((h: any) => `Nº ${h.number}: ${h.streakLength} sorteios consecutivos`).join("\n")}

Gere uma análise completa com:
1. **Resumo dos padrões dominantes** — quais padrões são mais relevantes
2. **Dezenas recomendadas** — baseado nos padrões, quais dezenas priorizar
3. **Dezenas a evitar** — quais estão em declínio
4. **Padrão ideal de jogo** — par/ímpar, soma, consecutivos, distribuição recomendada
5. **Insights surpresa** — padrões não óbvios detectados nos dados
6. **Estratégia sugerida** — como montar jogos usando esses padrões`;

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
    console.error("Pattern analysis error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
