import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { report, lotteryName, pick, totalNumbers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const topRankings = report.rankings?.slice(0, 20) || [];
    const shifts = report.shifts?.slice(0, 10) || [];
    const patterns = report.patterns || [];
    const strategies = report.strategies || [];

    const prompt = `Você é um analista especialista em loterias brasileiras. Analise o relatório da IA autônoma para a loteria "${lotteryName}" (${pick} dezenas de ${totalNumbers}) e forneça insights estratégicos.

RANKING TOP 20 DEZENAS (por score composto):
${topRankings.map((r: any) => `Nº${r.number}: Score=${r.compositeScore} Freq=${r.frequencyScore} Recência=${r.recencyScore} Tendência=${r.trendScore} Ciclo=${r.cycleScore} [${r.classification}] [${r.trend}]`).join("\n")}

MUDANÇAS ESTATÍSTICAS DETECTADAS:
${shifts.map((s: any) => s.description).join("\n") || "Nenhuma mudança significativa"}

PADRÕES DETECTADOS:
${patterns.map((p: any) => `${p.type}: ${p.description} (confiança: ${p.confidence}%)`).join("\n")}

DESEMPENHO DAS ESTRATÉGIAS:
${strategies.map((s: any) => `${s.name}: Taxa=${s.winRate.toFixed(1)}% Média=${s.avgHits.toFixed(1)} acertos Melhor=${s.bestResult}`).join("\n")}

PERFIL DE PARIDADE: Pares=${report.parityProfile?.even} Ímpares=${report.parityProfile?.odd}
SOMA MÉDIA: ${report.sumProfile?.avg} (desvio: ${report.sumProfile?.stdDev})
CONSECUTIVOS: Média=${report.consecutiveProfile?.avgConsecutive} pares

Forneça:
1. ANÁLISE GERAL (2-3 frases sobre o estado atual da loteria)
2. TOP 10 DEZENAS RECOMENDADAS e por quê
3. DEZENAS PARA EVITAR e por quê
4. MELHOR ESTRATÉGIA atual e ajustes sugeridos
5. PADRÃO MAIS RELEVANTE detectado
6. SUGESTÃO DE JOGO OTIMIZADO com ${pick} dezenas
7. NÍVEL DE CONFIANÇA geral da análise (0-100)

Responda em português, de forma direta e analítica.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista de dados especializado em loterias brasileiras. Analise dados estatísticos e forneça insights acionáveis." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiAnalysis = data.choices?.[0]?.message?.content || "Análise não disponível.";

    return new Response(JSON.stringify({ analysis: aiAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
