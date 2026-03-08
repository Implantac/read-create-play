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

    const topRankings = report.rankings?.slice(0, 30) || [];
    const shifts = report.shifts?.slice(0, 20) || [];
    const patterns = report.patterns || [];
    const strategies = report.strategies || [];
    const markov = report.markovTransitions?.slice(0, 25) || [];
    const cooccurrences = report.topCooccurrences?.slice(0, 20) || [];
    const gaps = report.gapAnalysis?.slice(0, 20) || [];
    const momentum = report.momentumTimeline?.slice(0, 15) || [];

    const tierS = topRankings.filter((r: any) => r.compositeScore >= 80).map((r: any) => r.number);
    const tierA = topRankings.filter((r: any) => r.compositeScore >= 60 && r.compositeScore < 80).map((r: any) => r.number);
    const tierB = topRankings.filter((r: any) => r.compositeScore >= 40 && r.compositeScore < 60).map((r: any) => r.number);

    const prompt = `Você é um cientista de dados de elite com PhD em estatística aplicada, especializado em séries temporais e modelagem probabilística de loterias brasileiras.

Realize uma análise PROFUNDA e ESTRATÉGICA do relatório do sistema de aprendizado autônomo para "${lotteryName}" (${pick} de ${totalNumbers}).

═══════════════════════════════════════════
RANKING TOP 30 (Score Composto Multi-dimensional)
═══════════════════════════════════════════
${topRankings.map((r: any) => `Nº${String(r.number).padStart(2, '0')}: Score=${r.compositeScore} | Freq=${r.frequencyScore} Rec=${r.recencyScore} Tend=${r.trendScore} Ciclo=${r.cycleScore} Markov=${r.markovScore || 0} Cooc=${r.cooccurrenceScore || 0} | [${r.classification}] [${r.trend}] Mom=${r.momentum?.toFixed?.(1) || 0}`).join("\n")}

CLASSIFICAÇÃO POR TIER:
- Tier S (≥80): [${tierS.join(", ") || "nenhum"}]
- Tier A (60-79): [${tierA.join(", ") || "nenhum"}]
- Tier B (40-59): [${tierB.join(", ") || "nenhum"}]

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

Forneça uma análise COMPLETA com as seções abaixo. Seja TÉCNICO, use NÚMEROS CONCRETOS e JUSTIFICATIVAS.

## 1. DIAGNÓSTICO DO REGIME ATUAL
- Estado do sistema: estável, transição ou anomalia?
- Análise do momentum global (mais dezenas acelerando ou desacelerando?)
- Qualidade dos dados e confiança geral

## 2. MAPA ESTRATÉGICO DE DEZENAS
- **DEZENAS PRIME (núcleo obrigatório):** 5-7 com justificativa baseada em score, Markov e momentum
- **DEZENAS DE SUPORTE:** 5-8 complementares com base em coocorrência e ciclos
- **DEZENAS OVERDUE (retorno iminente):** 3-5 com base na análise de gap
- **DEZENAS TÓXICAS:** 3-5 para evitar com justificativa específica

## 3. ANÁLISE DE MARKOV E TRANSIÇÕES
- Padrões de transição mais fortes detectados
- Clusters de números que se seguem com frequência
- Impacto prático para a próxima aposta

## 4. ANÁLISE DE COOCORRÊNCIA
- Pares mais fortes (alto Lift) e o que significam
- Trios ou combinações implícitas
- Como usar na construção de apostas

## 5. TENDÊNCIAS E PREVISÃO
- Direção do sistema nos próximos 5-10 concursos
- Mudanças estatísticas detectadas e impacto prático
- Dezenas em fase de aceleração vs desaceleração

## 6. ESTRATÉGIA ÓTIMA
- Melhor estratégia do backtesting e por quê
- Ajustes concretos sugeridos (substituições específicas)
- Configuração ideal de paridade, soma e distribuição

## 7. JOGOS SUGERIDOS
- 3 apostas de ${pick} dezenas cada, com justificativa
- Score de confiança de 0-100 para cada
- Uma aposta conservadora, uma equilibrada, uma agressiva

## 8. ALERTAS E RED FLAGS
- Anomalias detectadas
- Riscos e precauções

Responda em português. Seja extremamente técnico e acionável.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Você é um cientista de dados de elite com PhD em estatística aplicada e experiência em modelagem probabilística de séries temporais. Sua análise é rigorosa, técnica, baseada em evidências numéricas e sempre acionável. Você combina análise frequentista, bayesiana e cadeias de Markov para fundamentar suas recomendações." },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
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

    return new Response(JSON.stringify({ analysis: aiAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
