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

    const { topGames, patternInsights, distributionSummary, lotteryName, lotteryPick, lotteryNumbers, totalGenerated, totalEvaluated } = await req.json();
    if (!topGames || topGames.length === 0) throw new Error("topGames required");

    const supabase = await getSupabaseAdmin();
    const lotteryId = lotteryName?.toLowerCase().replace(/\s+/g, "").replace(/á/g, "a") || "unknown";
    const cacheInput = { lotteryName, totalGenerated, totalEvaluated, topScore: topGames[0]?.score, v: 2 };
    const cached = await getCachedAnalysis(supabase, lotteryId, "ai-massive-simulation", cacheInput, 6);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deep analysis of number frequency across top games
    const numFreq: Record<number, number> = {};
    const numScoreAvg: Record<number, { total: number; count: number }> = {};
    topGames.forEach((g: any) => {
      (g.numbers || []).forEach((n: number) => {
        numFreq[n] = (numFreq[n] || 0) + 1;
        if (!numScoreAvg[n]) numScoreAvg[n] = { total: 0, count: 0 };
        numScoreAvg[n].total += g.score || 0;
        numScoreAvg[n].count++;
      });
    });

    const topNumbers = Object.entries(numFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([n, freq]) => {
        const avg = numScoreAvg[Number(n)] ? (numScoreAvg[Number(n)].total / numScoreAvg[Number(n)].count).toFixed(1) : "0";
        return `${n}(${freq}x,scoreM:${avg})`;
      });

    const top5 = topGames.slice(0, 5);
    const bottom5 = topGames.slice(-5);

    const getProfile = (games: any[]) => {
      const avgSum = games.reduce((s: number, g: any) => s + (g.sum || 0), 0) / games.length;
      const avgEven = games.reduce((s: number, g: any) => s + (g.evenCount || 0), 0) / games.length;
      const avgConsec = games.reduce((s: number, g: any) => s + (g.consecutivePairs || 0), 0) / games.length;
      const avgSpread = games.reduce((s: number, g: any) => s + (g.rangeSpread || 0), 0) / games.length;
      const avgScore = games.reduce((s: number, g: any) => s + (g.score || 0), 0) / games.length;
      return { avgSum: avgSum.toFixed(0), avgEven: avgEven.toFixed(1), avgConsec: avgConsec.toFixed(1), avgSpread: avgSpread.toFixed(0), avgScore: avgScore.toFixed(1) };
    };

    const top5Profile = getProfile(top5);
    const bottom5Profile = getProfile(bottom5);

    // Pair analysis across top games
    const pairFreq: Record<string, number> = {};
    topGames.slice(0, 30).forEach((g: any) => {
      const nums = (g.numbers || []).sort((a: number, b: number) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]}-${nums[j]}`;
          pairFreq[key] = (pairFreq[key] || 0) + 1;
        }
      }
    });
    const topPairs = Object.entries(pairFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pair, count]) => `(${pair}):${count}x`);

    const systemPrompt = `Você é um analista quantitativo de elite especializado em simulação massiva e otimização combinatória de loterias brasileiras.

METODOLOGIA DE ANÁLISE MASSIVA:
1. Análise de variância entre top performers vs bottom performers
2. Identificação de fatores discriminantes (o que separa os melhores dos piores)
3. Decomposição por componente: paridade, soma, consecutivos, distribuição, pares recorrentes
4. Construção de "perfil ideal" baseado em convergência estatística
5. Validação cruzada: padrões devem ser consistentes em diferentes subgrupos

PRINCÍPIOS:
- Com ${totalGenerated.toLocaleString()} jogos avaliados, padrões com >60% de recorrência são estatisticamente significativos
- Foque em diferenciais quantificáveis entre top e bottom
- Cada recomendação deve ter evidência numérica

Responda em português do Brasil com markdown formatado.
Seja rigoroso, técnico e baseado em evidências numéricas.`;

    const gamesReport = topGames.slice(0, 20).map((g: any, i: number) => {
      const nums = (g.numbers || []).join(",");
      return `#${i + 1} [${nums}] Score:${g.score} Avg:${g.avgHits} Best:${g.bestHit} Prêmios:${g.prizeCount} Par:${g.evenCount} Ímpar:${g.oddCount} Soma:${g.sum} Consec:${g.consecutivePairs} Spread:${g.rangeSpread}`;
    }).join("\n");

    const insightsReport = (patternInsights || []).map((p: any) =>
      `- ${p.label}: ${p.value} (${p.description})`
    ).join("\n");

    const userPrompt = `═══ SIMULAÇÃO MASSIVA — ${lotteryName} (${lotteryPick}/${lotteryNumbers}) ═══

ESCALA: ${totalGenerated.toLocaleString()} jogos gerados | ${totalEvaluated.toLocaleString()} comparações realizadas

═══ PERFIL COMPARATIVO: TOP 5 vs BOTTOM 5 ═══
              | TOP 5         | BOTTOM 5      | DELTA
Soma média    | ${top5Profile.avgSum}           | ${bottom5Profile.avgSum}           | ${(Number(top5Profile.avgSum) - Number(bottom5Profile.avgSum)).toFixed(0)}
Par médio     | ${top5Profile.avgEven}          | ${bottom5Profile.avgEven}          | ${(Number(top5Profile.avgEven) - Number(bottom5Profile.avgEven)).toFixed(1)}
Consec médio  | ${top5Profile.avgConsec}        | ${bottom5Profile.avgConsec}        | ${(Number(top5Profile.avgConsec) - Number(bottom5Profile.avgConsec)).toFixed(1)}
Spread médio  | ${top5Profile.avgSpread}        | ${bottom5Profile.avgSpread}        | ${(Number(top5Profile.avgSpread) - Number(bottom5Profile.avgSpread)).toFixed(0)}
Score médio   | ${top5Profile.avgScore}         | ${bottom5Profile.avgScore}         | ${(Number(top5Profile.avgScore) - Number(bottom5Profile.avgScore)).toFixed(1)}

═══ DISTRIBUIÇÃO GERAL DO UNIVERSO ELITE ═══
Soma média: ${distributionSummary.avgSum}
Razão par/total: ${distributionSummary.avgEvenRatio}
Consecutivos médios: ${distributionSummary.avgConsecutive}
Spread médio: ${distributionSummary.avgSpread}
Melhor acerto geral: ${distributionSummary.bestHitOverall}
Taxa média de premiação: ${distributionSummary.avgPrizeRate}%

═══ DEZENAS MAIS RECORRENTES NOS TOP GAMES ═══
${topNumbers.join(", ")}

═══ PARES MAIS FREQUENTES NOS TOP 30 ═══
${topPairs.join(", ")}

═══ PADRÕES DETECTADOS PELO MOTOR ═══
${insightsReport}

═══ TOP 20 JOGOS DETALHADOS ═══
${gamesReport}

═══ SOLICITAÇÃO DE ANÁLISE PROFUNDA ═══

## 1. PADRÕES DOMINANTES
O que diferencia estatisticamente os melhores jogos dos piores? Use a comparação TOP 5 vs BOTTOM 5 e quantifique cada fator.

## 2. PERFIL IDEAL DE JOGO
- Par/ímpar exato com probabilidade
- Faixa de soma (intervalo numérico 68% e 95%)
- Consecutivos ideais
- Spread mínimo e máximo
- Distribuição por faixas numéricas

## 3. DEZENAS-CHAVE
- **Must-have** (≥60% dos top games): justificativa por dezena
- **Nice-to-have** (40-60%): uso como complemento
- **Tóxicos** (raramente nos melhores): evidência para exclusão

## 4. ANÁLISE DE PARES E SINERGIA
- Pares que aparecem juntos com alta frequência nos melhores jogos
- Dezenas com sinergia positiva (melhoram performance quando juntas)
- Combinações a evitar

## 5. CINCO JOGOS OTIMIZADOS
Para cada jogo:
- ${lotteryPick} dezenas em ordem crescente
- Justificativa para cada dezena com fonte (frequência massiva, sinergia de pares, cobertura)
- Score estimado e par/ímpar/soma/spread
- Perfil: 2 conservadores, 2 equilibrados, 1 agressivo

## 6. SCORE DE CONFIANÇA E ESTRATÉGIA
- De 0 a 100, quão confiáveis são esses padrões?
- Tamanho amostral é suficiente?
- Como o jogador deve usar na prática (portfólio sugerido)
- Disclaimer: análise estatística, sem garantia de ganhos`;

    const models = ["google/gemini-2.5-pro", "google/gemini-2.5-flash"];
    let analysis = "";

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
          analysis = data.choices?.[0]?.message?.content || "";
          if (analysis) break;
        } else {
          const status = aiResponse.status;
          await aiResponse.text();
          console.error(`Model ${model} failed: ${status}`);
          if (status === 429) await new Promise(r => setTimeout(r, 1000));
          if (status === 402) {
            return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (e) {
        console.error(`Model ${model} exception:`, e);
      }
    }

    if (!analysis) {
      return new Response(JSON.stringify({ success: false, error: "Análise de IA indisponível." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseData = { success: true, analysis };
    await setCachedAnalysis(supabase, lotteryId, "ai-massive-simulation", cacheInput, responseData, 6);

    return new Response(JSON.stringify(responseData), {
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
