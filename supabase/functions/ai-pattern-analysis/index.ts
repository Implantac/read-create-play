import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, getCachedAnalysis, setCachedAnalysis } from "../_shared/ai-cache.ts";

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

    const supabase = await getSupabaseAdmin();
    const lotteryId = lotteryName?.toLowerCase().replace(/\s+/g, "").replace(/á/g, "a") || "unknown";
    const cacheInput = { lotteryName, drawCount, avgSum: patternReport.summary?.avgSum };
    const cached = await getCachedAnalysis(supabase, lotteryId, "ai-pattern-analysis", cacheInput, 6);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { summary, parityPatterns, sumPatterns, consecutivePatterns, spatialDistribution, hotStreaks, frequencyTrends } = patternReport;

    const top15Trending = (frequencyTrends || []).slice(0, 15);
    const bottom15 = [...(frequencyTrends || [])].sort((a: any, b: any) => a.momentum - b.momentum).slice(0, 15);

    // Compute acceleration (change in momentum)
    const accelerating = top15Trending.filter((f: any) => f.last10Freq > f.last30Freq / 3);
    const decelerating = bottom15.filter((f: any) => f.last10Freq < f.last30Freq / 6);

    const systemPrompt = `Você é um analista quantitativo de elite especializado em detecção de padrões em séries temporais de loterias brasileiras.
Sua análise combina técnicas de:
- Análise de frequência espectral
- Detecção de regime (estável vs transição)
- Modelagem de ciclos via autocorrelação
- Análise de distribuição espacial e clustering
- Identificação de anomalias estatísticas

Responda em português do Brasil com markdown formatado (##, ###, **negrito**, listas).
Seja EXTREMAMENTE específico: cite números, porcentagens, comparações e intervalos de confiança.
Cada recomendação deve ter um "porquê" numérico.`;

    const userPrompt = `═══ ANÁLISE DE PADRÕES — ${lotteryName} (${lotteryPick}/${lotteryNumbers}) ═══
Concursos analisados: ${drawCount}

━━━ 1. PADRÕES DE PARIDADE (Par/Ímpar) ━━━
${parityPatterns.slice(0, 10).map((p: any) => `${p.evens}P/${p.odds}I: ${p.count}x (${p.percentage}%) ${p.percentage > 20 ? "★ DOMINANTE" : ""}`).join("\n")}
Configuração mais comum: ${summary.mostCommonParity}
Desvio da distribuição uniforme: ${summary.parityDeviation || "N/A"}

━━━ 2. PADRÕES DE SOMA ━━━
Média: ${summary.avgSum} | Mediana: ${summary.medianSum || "N/A"} | Desvio: ${summary.sumStdDev}
Faixa 1σ: [${Math.round(summary.avgSum - summary.sumStdDev)}, ${Math.round(summary.avgSum + parseFloat(summary.sumStdDev))}]
${sumPatterns.map((s: any) => `Faixa ${s.rangeLabel}: ${s.count}x (${s.percentage}%) ${s.percentage > 25 ? "★ CONCENTRADA" : ""}`).join("\n")}

━━━ 3. CONSECUTIVOS ━━━
Média de pares consecutivos: ${summary.avgConsecutives}
${consecutivePatterns.map((c: any) => `${c.consecutiveCount} consecutivos: ${c.occurrences}x (${c.percentage}%)`).join("\n")}

━━━ 4. DISTRIBUIÇÃO ESPACIAL ━━━
Equilíbrio geral: ${spatialDistribution.balance}/100
${spatialDistribution.sectors.map((s: any) => `Setor ${s.label}: média=${s.avgCount} σ=${s.stdDev} ${s.avgCount > (lotteryPick / spatialDistribution.sectors.length) * 1.3 ? "⬆️ SOBRECARREGADO" : s.avgCount < (lotteryPick / spatialDistribution.sectors.length) * 0.7 ? "⬇️ SUBEXPLORADO" : "→ NORMAL"}`).join("\n")}

━━━ 5. TOP 15 EM ALTA (momentum positivo) ━━━
${top15Trending.map((f: any) => `Nº${String(f.number).padStart(2, '0')}: f10=${f.last10Freq} f30=${f.last30Freq} momentum=${f.momentum > 0 ? "+" : ""}${f.momentum} ${accelerating.includes(f) ? "🚀 ACELERANDO" : ""}`).join("\n")}

━━━ 6. TOP 15 EM QUEDA (momentum negativo) ━━━
${bottom15.map((f: any) => `Nº${String(f.number).padStart(2, '0')}: f10=${f.last10Freq} f30=${f.last30Freq} momentum=${f.momentum} ${decelerating.includes(f) ? "📉 DESACELERANDO" : ""}`).join("\n")}

━━━ 7. DEZENAS MAIS CONSISTENTES ━━━
${summary.mostConsistent.join(", ")}

━━━ 8. OVERDUE (atrasadas além do ciclo médio) ━━━
${summary.overdueNumbers.join(", ")}

━━━ 9. MAIORES HOT STREAKS ━━━
${hotStreaks.slice(0, 10).map((h: any) => `Nº${h.number}: ${h.streakLength} sorteios consecutivos presentes`).join("\n")}

═══ SOLICITAÇÃO DE ANÁLISE ═══

Forneça uma análise completa e acionável em 6 seções:

## 1. MAPA DE REGIMES
- Classificar o estado atual: regime estável, transição ou caótico
- Fundamentar com evidências numéricas dos padrões acima

## 2. ANÁLISE MULTIDIMENSIONAL DE DEZENAS
Para as 10 melhores e 5 piores dezenas:
- Citar o número, momentum, frequência recente, e classificação
- Dizer se é candidata para inclusão ou exclusão e por quê

## 3. PADRÃO IDEAL DE JOGO
- Par/ímpar exato recomendado
- Faixa de soma ideal (intervalo numérico)
- Máximo de consecutivos
- Distribuição por setores

## 4. DETECÇÃO DE ANOMALIAS
- Padrões não-óbvios ou contra-intuitivos nos dados
- Setores com comportamento anômalo
- Dezenas com ciclos irregulares

## 5. ESTRATÉGIA TÁTICA (próximos 5-10 concursos)
- Dezenas para priorizar e evitar com score de urgência
- Configurações de jogo recomendadas
- 2 jogos sugeridos com ${lotteryPick} dezenas e justificativa

## 6. CONFIANÇA E RESSALVAS
- Score de confiança geral (0-100)
- Limitações da análise
- Cenários que invalidariam as recomendações`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 8000,
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

    const responseData = { success: true, analysis };
    await setCachedAnalysis(supabase, lotteryId, "ai-pattern-analysis", cacheInput, responseData, 6);

    return new Response(JSON.stringify(responseData), {
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
