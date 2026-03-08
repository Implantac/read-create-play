import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getSupabaseAdmin, getCachedAnalysis, setCachedAnalysis } from "../_shared/ai-cache.ts";

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

    const supabase = await getSupabaseAdmin();
    const lotteryId = lotteryName?.toLowerCase().replace(/\s+/g, "").replace(/á/g, "a") || "unknown";
    const cacheInput = { lotteryName, confidenceScore: report.confidenceScore, rankingsCount: report.rankings?.length };
    const cached = await getCachedAnalysis(supabase, lotteryId, "ai-autonomous-learning", cacheInput, 6);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const topRankings = report.rankings?.slice(0, 30) || [];
    const shifts = report.shifts?.slice(0, 25) || [];
    const patterns = report.patterns || [];
    const strategies = report.strategies || [];
    const markov = report.markovTransitions?.slice(0, 30) || [];
    const cooccurrences = report.topCooccurrences?.slice(0, 25) || [];
    const gaps = report.gapAnalysis?.slice(0, 20) || [];
    const momentum = report.momentumTimeline?.slice(0, 15) || [];
    const entropy = report.entropyAnalysis || {};
    const chiSquare = report.chiSquareResult || {};
    const triplets = report.topTriplets?.slice(0, 10) || [];

    const tierS = topRankings.filter((r: any) => r.compositeScore >= 80).map((r: any) => r.number);
    const tierA = topRankings.filter((r: any) => r.compositeScore >= 60 && r.compositeScore < 80).map((r: any) => r.number);
    const tierB = topRankings.filter((r: any) => r.compositeScore >= 40 && r.compositeScore < 60).map((r: any) => r.number);

    const prompt = `Você é um cientista de dados de elite com PhD em estatística aplicada, especializado em séries temporais, teoria da informação e modelagem probabilística de loterias brasileiras.

Realize uma análise PROFUNDA e ESTRATÉGICA do relatório do sistema de aprendizado autônomo para "${lotteryName}" (${pick} de ${totalNumbers}).

═══════════════════════════════════════════
RANKING TOP 30 (Score Composto Multi-dimensional com Entropia)
═══════════════════════════════════════════
${topRankings.map((r: any) => `Nº${String(r.number).padStart(2, '0')}: Score=${r.compositeScore} | Freq=${r.frequencyScore} Rec=${r.recencyScore} Tend=${r.trendScore} Ciclo=${r.cycleScore} Markov=${r.markovScore || 0} Cooc=${r.cooccurrenceScore || 0} Entropia=${r.entropyScore || 0} | [${r.classification}] [${r.trend}] Mom=${r.momentum?.toFixed?.(1) || 0}`).join("\n")}

CLASSIFICAÇÃO POR TIER:
- Tier S (≥80): [${tierS.join(", ") || "nenhum"}]
- Tier A (60-79): [${tierA.join(", ") || "nenhum"}]
- Tier B (40-59): [${tierB.join(", ") || "nenhum"}]

═══════════════════════════════════════════
ANÁLISE DE ENTROPIA (Teoria da Informação)
═══════════════════════════════════════════
Entropia Global: ${entropy.globalEntropy || "N/A"} bits (Max: ${entropy.maxEntropy || "N/A"} bits)
Entropia Normalizada: ${entropy.normalizedEntropy || "N/A"} (1.0 = perfeitamente uniforme)
Entropia por Zona: ${entropy.entropyByZone?.map((z: any) => `${z.zone}: ${z.entropy} (norm=${z.normalized})`).join(" | ") || "N/A"}
Dezenas Anômalas (alta variabilidade): ${entropy.numberEntropy?.filter((e: any) => e.isAnomaly).slice(0, 10).map((e: any) => `Nº${String(e.number).padStart(2, '0')}(cv=${e.entropy})`).join(", ") || "Nenhuma"}

═══════════════════════════════════════════
TESTE χ² (Chi-Quadrado de Aderência)
═══════════════════════════════════════════
χ² = ${chiSquare.chiSquare || "N/A"} | GL = ${chiSquare.degreesOfFreedom || "N/A"} | p-valor = ${chiSquare.pValue || "N/A"}
Resultado: ${chiSquare.significanceLevel || "N/A"} | Distribuição uniforme: ${chiSquare.isUniform ? "SIM" : "NÃO"}
Top Desvios (resíduos padronizados):
${chiSquare.topDeviations?.slice(0, 10).map((d: any) => `Nº${String(d.number).padStart(2, '0')}: obs=${d.observed} esp=${d.expected} res=${d.residual > 0 ? "+" : ""}${d.residual}`).join("\n") || "N/A"}

═══════════════════════════════════════════
TRIOS RECORRENTES (Triplets com Lift)
═══════════════════════════════════════════
${triplets.map((t: any) => `(${t.numbers.map((n: number) => String(n).padStart(2, '0')).join(",")}) ${t.count}x lift=${t.lift} últ.visto=${t.lastSeen}conc.`).join("\n") || "Nenhum trio significativo"}

═══════════════════════════════════════════
TRANSIÇÕES DE MARKOV (do último sorteio)
═══════════════════════════════════════════
${markov.map((t: any) => `${String(t.from).padStart(2, '0')} → ${String(t.to).padStart(2, '0')}: prob=${(t.probability * 100).toFixed(1)}% (${t.count}x)`).join("\n") || "Sem dados"}

═══════════════════════════════════════════
TOP PARES COOCORRENTES (Lift)
═══════════════════════════════════════════
${cooccurrences.map((c: any) => `(${String(c.a).padStart(2, '0')},${String(c.b).padStart(2, '0')}): ${c.count}x lift=${c.lift}`).join("\n") || "Sem dados"}

═══════════════════════════════════════════
ANÁLISE DE GAP (dezenas com retorno iminente)
═══════════════════════════════════════════
${gaps.map((g: any) => `Nº${String(g.number).padStart(2, '0')}: gapAtual=${g.currentGap} gapMédio=${g.avgGap} retornoPrevisto=${g.predictedReturn}`).join("\n") || "Sem dados"}

═══════════════════════════════════════════
MOMENTUM (aceleração/desaceleração)
═══════════════════════════════════════════
${momentum.map((m: any) => `Nº${String(m.number).padStart(2, '0')}: aceleração=${m.acceleration} | ${m.windows?.map((w: any) => `${w.period}:${w.rate}%`).join(" ") || ""}`).join("\n") || "Sem dados"}

═══════════════════════════════════════════
CHANGE-POINT DETECTION
═══════════════════════════════════════════
${shifts.map((s: any) => `⚠️ ${s.description} | Mag=${s.magnitude}% | Desde=${s.since || "N/A"} conc.`).join("\n") || "Nenhuma mudança"}

═══════════════════════════════════════════
PADRÕES DETECTADOS
═══════════════════════════════════════════
${patterns.map((p: any) => `${p.icon} ${p.type}: ${p.description} (conf=${p.confidence}%) ${p.actionable ? "→ " + (p.suggestion || "ACIONÁVEL") : ""}`).join("\n")}

═══════════════════════════════════════════
BACKTESTING DE ESTRATÉGIAS
═══════════════════════════════════════════
${strategies.map((s: any) => `📈 ${s.name}: WinRate=${s.winRate.toFixed(1)}% | MédAcertos=${s.avgHits.toFixed(1)} | Melhor=${s.bestResult} | Consist=${s.consistency || "N/A"}% | ${s.trend}`).join("\n")}

═══════════════════════════════════════════
PERFIL ESTATÍSTICO
═══════════════════════════════════════════
Paridade: ${report.parityProfile?.even}P/${report.parityProfile?.odd}I (ideal: ${report.parityProfile?.idealEven}P/${report.parityProfile?.idealOdd}I)
Soma: média=${report.sumProfile?.avg} σ=${report.sumProfile?.stdDev} faixa=[${report.sumProfile?.min},${report.sumProfile?.max}] tendência=${report.sumProfile?.trend || "N/A"}
Consecutivos: média=${report.consecutiveProfile?.avgConsecutive} (${report.consecutiveProfile?.pctWithConsecutive}% têm)
Confiança do Sistema: ${report.confidenceScore || "N/A"}/100

═══════════════════════════════════════════
JOGO SUGERIDO PELO MOTOR LOCAL
═══════════════════════════════════════════
${report.suggestedNumbers?.map((n: number) => String(n).padStart(2, '0')).join(", ") || "N/A"}
Evitar: ${report.avoidNumbers?.map((n: number) => String(n).padStart(2, '0')).join(", ") || "N/A"}

═══════════════════════════════════════════
INSTRUÇÃO DE ANÁLISE
═══════════════════════════════════════════

Forneça uma análise COMPLETA com as seções abaixo. Seja TÉCNICO, use NÚMEROS CONCRETOS e JUSTIFICATIVAS baseadas nos dados acima.

## 1. DIAGNÓSTICO DO REGIME ATUAL
- Estado do sistema: estável, transição ou anomalia? Baseie-se na entropia e chi-quadrado
- Interpretação do teste χ²: a distribuição é uniforme ou há viés explorável?
- Análise do momentum global e qualidade dos dados

## 2. ANÁLISE DE ENTROPIA E TEORIA DA INFORMAÇÃO
- Interpretação da entropia normalizada e o que significa para apostas
- Zonas com maior/menor entropia e impacto prático
- Dezenas anômalas: por que são instáveis e se devem ser incluídas ou evitadas

## 3. MAPA ESTRATÉGICO DE DEZENAS
- **DEZENAS PRIME (núcleo obrigatório):** 5-7 com justificativa baseada em score, Markov, entropia e chi-quadrado
- **DEZENAS DE SUPORTE:** 5-8 complementares com base em coocorrência, trios e ciclos
- **DEZENAS OVERDUE (retorno iminente):** 3-5 com base na análise de gap
- **DEZENAS TÓXICAS:** 3-5 para evitar com justificativa estatística

## 4. ANÁLISE DE MARKOV E TRANSIÇÕES
- Padrões de transição mais fortes e clusters
- Impacto dos trios recorrentes (triplets) na seleção
- Combinações implícitas para a próxima aposta

## 5. ANÁLISE DE COOCORRÊNCIA E TRIOS
- Pares mais fortes e trios significativos
- Como montar apostas usando as associações detectadas
- Lift como indicador de dependência estatística

## 6. TENDÊNCIAS E PREVISÃO
- Direção do sistema nos próximos 5-10 concursos
- Mudanças estatísticas (change-points) e impacto
- Dezenas em aceleração vs desaceleração

## 7. ESTRATÉGIA ÓTIMA
- Melhor estratégia do backtesting e por quê
- Ajustes baseados em entropia e chi-quadrado
- Configuração ideal de paridade, soma e distribuição

## 8. JOGOS SUGERIDOS
- 3 apostas de ${pick} dezenas cada, com justificativa técnica detalhada
- Score de confiança 0-100 para cada
- Uma conservadora (baseada em frequência), uma equilibrada (multi-critério), uma agressiva (Markov + gaps + trios)

## 9. ALERTAS, ANOMALIAS E RED FLAGS
- Anomalias de entropia detectadas
- Dezenas com comportamento estatisticamente anormal (resíduos χ² altos)
- Riscos e precauções

Responda em português. Seja extremamente técnico, use dados concretos e justificativas numéricas em cada recomendação.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Você é um cientista de dados de elite com PhD em estatística aplicada, teoria da informação e modelagem probabilística. Sua análise combina entropia de Shannon, testes chi-quadrado, cadeias de Markov, análise de coocorrência e detecção de change-points para fundamentar recomendações rigorosas e acionáveis." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiAnalysis = data.choices?.[0]?.message?.content || "Análise não disponível.";

    const responseData = { analysis: aiAnalysis };
    await setCachedAnalysis(supabase, lotteryId, "ai-autonomous-learning", cacheInput, responseData, 6);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
