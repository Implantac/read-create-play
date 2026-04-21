import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, getCachedAnalysis, setCachedAnalysis } from "../_shared/ai-cache.ts";
import { requireUser, unauthorizedResponse } from "../_shared/auth.ts";

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
    const auth = await requireUser(req);
    if (!auth) return unauthorizedResponse(corsHeaders);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { patternReport, lotteryName, lotteryPick, lotteryNumbers, drawCount } = await req.json();
    if (!patternReport) throw new Error("patternReport required");

    const supabase = await getSupabaseAdmin();
    const lotteryId = lotteryName?.toLowerCase().replace(/\s+/g, "").replace(/á/g, "a") || "unknown";
    const cacheInput = { lotteryName, drawCount, avgSum: patternReport.summary?.avgSum, v: 2 };
    const cached = await getCachedAnalysis(supabase, lotteryId, "ai-pattern-analysis", cacheInput, 6);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { summary, parityPatterns, sumPatterns, consecutivePatterns, spatialDistribution, hotStreaks, frequencyTrends } = patternReport;

    const top15Trending = (frequencyTrends || []).slice(0, 15);
    const bottom15 = [...(frequencyTrends || [])].sort((a: any, b: any) => a.momentum - b.momentum).slice(0, 15);

    const accelerating = top15Trending.filter((f: any) => f.last10Freq > f.last30Freq / 3);
    const decelerating = bottom15.filter((f: any) => f.last10Freq < f.last30Freq / 6);

    const systemPrompt = `Você é um analista quantitativo de elite com PhD em estatística aplicada, teoria da informação e modelagem probabilística de séries temporais.

Sua análise combina:
- Análise de frequência espectral e decomposição de séries temporais
- Detecção de regime (estável, transição, caótico) via variância e autocorrelação
- Modelagem de ciclos via autocorrelação parcial e periodograma
- Análise de distribuição espacial, clustering e dispersão
- Identificação de anomalias estatísticas via z-scores e resíduos padronizados
- Teoria da informação (entropia de Shannon) para medir previsibilidade
- Testes de hipótese (Chi-Quadrado) para detectar vieses exploráveis
- Análise de momentum multi-janela (aceleração/desaceleração de tendências)

PRINCÍPIOS DE ANÁLISE:
1. Cada conclusão deve ser sustentada por pelo menos 2 evidências numéricas independentes
2. Distinguir entre correlação e causalidade — loterias são eventos independentes
3. Priorizar padrões com significância estatística (p < 0.05) sobre observações anedóticas
4. Reconhecer limitações do tamanho amostral e viés de lookback
5. Recomendações devem ser acionáveis e específicas (números, faixas, configurações)

Responda em português do Brasil com markdown formatado (##, ###, **negrito**, listas, tabelas).
Seja EXTREMAMENTE específico: cite números, porcentagens, comparações e intervalos de confiança.
Cada recomendação deve ter um "porquê" numérico fundamentado.`;

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
- Fundamentar com evidências numéricas: variância de soma, dispersão de paridade, consistência de distribuição
- Identificar se estamos em fase de convergência ou divergência

## 2. ANÁLISE MULTIDIMENSIONAL DE DEZENAS
Para as 10 melhores e 5 piores dezenas:
- Citar o número, momentum, frequência recente, consistência e classificação
- Indicar se é candidata para inclusão ou exclusão com justificativa multi-fatorial
- Identificar "clusters" de dezenas que se movem juntas

## 3. PADRÃO IDEAL DE JOGO
- Par/ímpar exato recomendado com probabilidade histórica
- Faixa de soma ideal (intervalo numérico com 68% e 95% de confiança)
- Máximo de consecutivos com frequência esperada
- Distribuição por setores com desvios aceitáveis

## 4. DETECÇÃO DE ANOMALIAS
- Padrões não-óbvios ou contra-intuitivos nos dados
- Setores com comportamento anômalo (z-score > 2)
- Dezenas com ciclos irregulares ou instabilidade
- Correlações inesperadas entre métricas

## 5. ESTRATÉGIA TÁTICA (próximos 5-10 concursos)
- Dezenas para priorizar com score de urgência (1-10) e justificativa
- Dezenas para evitar com evidência
- Configurações de jogo recomendadas (2 variantes: conservadora e agressiva)
- 2 jogos sugeridos com ${lotteryPick} dezenas, cada um com justificativa técnica

## 6. CONFIANÇA E RESSALVAS
- Score de confiança geral (0-100) com decomposição por fator
- Limitações da análise (tamanho amostral, viés de lookback, independência de eventos)
- Cenários que invalidariam as recomendações
- Disclaimer: análises estatísticas NÃO garantem resultados`;

    // Try primary model, then fallback
    const models = ["google/gemini-2.5-pro", "google/gemini-2.5-flash"];
    let aiAnalysis = "";
    let aiSuccess = false;

    for (const model of models) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 10000,
            reasoning: {
              effort: "medium",
            },
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          aiAnalysis = data.choices?.[0]?.message?.content || "";
          if (aiAnalysis) { aiSuccess = true; break; }
        } else {
          const errText = await aiResponse.text();
          console.error(`Model ${model} failed (${aiResponse.status}):`, errText);
          if (aiResponse.status === 429) {
            await new Promise(r => setTimeout(r, 1000));
          }
          if (aiResponse.status === 402) {
            return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (e) {
        console.error(`Model ${model} exception:`, e);
      }
    }

    if (!aiSuccess) {
      return new Response(JSON.stringify({ success: false, error: "Todos os modelos de IA falharam. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseData = { success: true, analysis: aiAnalysis };
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
