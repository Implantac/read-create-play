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

    const topRankings = report.rankings?.slice(0, 25) || [];
    const shifts = report.shifts?.slice(0, 15) || [];
    const patterns = report.patterns || [];
    const strategies = report.strategies || [];

    // Classify numbers by tier
    const tierS = topRankings.filter((r: any) => r.compositeScore >= 80).map((r: any) => r.number);
    const tierA = topRankings.filter((r: any) => r.compositeScore >= 60 && r.compositeScore < 80).map((r: any) => r.number);
    const tierB = topRankings.filter((r: any) => r.compositeScore >= 40 && r.compositeScore < 60).map((r: any) => r.number);

    const prompt = `Você é um cientista de dados especializado em modelagem probabilística de loterias brasileiras. 
Realize uma análise profunda do relatório do sistema de aprendizado autônomo para a loteria "${lotteryName}" (${pick} dezenas de ${totalNumbers}).

═══ RANKING TOP 25 DEZENAS (score composto multidimensional) ═══
${topRankings.map((r: any) => `Nº${String(r.number).padStart(2, '0')}: Score=${r.compositeScore} | Freq=${r.frequencyScore} Recência=${r.recencyScore} Tendência=${r.trendScore} Ciclo=${r.cycleScore} | [${r.classification}] [${r.trend}]`).join("\n")}

CLASSIFICAÇÃO POR TIER:
- Tier S (≥80): [${tierS.join(", ") || "nenhum"}]
- Tier A (60-79): [${tierA.join(", ") || "nenhum"}]
- Tier B (40-59): [${tierB.join(", ") || "nenhum"}]

═══ CHANGE-POINT DETECTION (mudanças estatísticas) ═══
${shifts.map((s: any) => `⚠️ ${s.description} | Magnitude: ${s.magnitude || "N/A"} | Desde concurso: ${s.since || "N/A"}`).join("\n") || "Nenhuma mudança significativa detectada"}

═══ PADRÕES DETECTADOS PELO MOTOR DE ML ═══
${patterns.map((p: any) => `📊 ${p.type}: ${p.description} (confiança: ${p.confidence}%) ${p.actionable ? "→ ACIONÁVEL" : ""}`).join("\n")}

═══ BACKTESTING DE ESTRATÉGIAS ═══
${strategies.map((s: any) => `📈 ${s.name}: WinRate=${s.winRate.toFixed(1)}% | MédiaAcertos=${s.avgHits.toFixed(1)} | MelhorResultado=${s.bestResult} | Consistência=${s.consistency?.toFixed(1) || "N/A"}%`).join("\n")}

═══ PERFIL ESTATÍSTICO ═══
Paridade: ${report.parityProfile?.even}P/${report.parityProfile?.odd}I (ideal para ${lotteryName})
Soma Média: ${report.sumProfile?.avg} (σ ${report.sumProfile?.stdDev})
Consecutivos: Média=${report.consecutiveProfile?.avgConsecutive} pares por sorteio

INSTRUÇÃO: Forneça uma análise PROFUNDA e ACIONÁVEL com as seguintes seções:

## 1. DIAGNÓSTICO GERAL
- Estado atual da loteria em 3-4 frases densas
- Identificar se estamos em regime estável, transição ou anomalia
- Comparar o perfil estatístico atual com o esperado

## 2. MAPA DE DEZENAS ESTRATÉGICO
- **DEZENAS PRIME (compra obrigatória):** Top 5-7 com justificativa individual
- **DEZENAS DE SUPORTE:** 5-8 para complementar
- **DEZENAS TÓXICAS:** 3-5 para evitar e por quê exatamente
- Para cada dezena, cite o score e o critério dominante

## 3. ANÁLISE DE TENDÊNCIA
- Qual direção o sistema está indo?
- Mudanças estatísticas detectadas e seu impacto prático
- Previsão de curto prazo (próximos 5-10 concursos)

## 4. ESTRATÉGIA OTIMIZADA
- Qual estratégia do backtesting é a melhor agora e por quê
- Ajustes concretos sugeridos (trocar dezena X por Y, etc.)
- Configuração ideal de paridade, soma e distribuição

## 5. JOGO SUGERIDO
- ${pick} dezenas com justificativa para cada uma
- Score de confiança de 0-100

## 6. ALERTAS
- Qualquer padrão incomum ou red flag detectada

Seja extremamente técnico, use números concretos. Responda em português.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Você é um cientista de dados de elite com PhD em estatística aplicada, especializado em análise de séries temporais e modelagem probabilística de loterias brasileiras. Sua análise é rigorosa, técnica e sempre baseada em evidências numéricas." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
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
