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
    const cacheInput = { lotteryName, confidenceScore: report.confidenceScore, rankingsCount: report.rankings?.length, version: "v5-robust-games" };
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

## 8. 🎯 10 JOGOS OTIMIZADOS PARA O PRÊMIO PRINCIPAL
Gere EXATAMENTE 10 apostas de ${pick} dezenas cada, otimizadas para maximizar a chance de acerto do prêmio principal.

Para CADA jogo, forneça no formato:
**Jogo X — [Estratégia] (Confiança: XX/100)**
Dezenas: XX, XX, XX, ... (ordenadas)
Justificativa: [breve explicação técnica de 1-2 linhas]

Distribuição das 10 apostas:
- Jogos 1-3: CONSERVADORES (baseados em frequência alta + dezenas Tier S/A + paridade ideal)
- Jogos 4-6: EQUILIBRADOS (multi-critério: frequência + Markov + coocorrência + entropia)
- Jogos 7-8: AGRESSIVOS (Markov + gaps overdue + trios recorrentes + momentum positivo)
- Jogo 9: CONTRÁRIO (dezenas em aceleração recente + change-points favoráveis)
- Jogo 10: MÁXIMA COBERTURA (maximizar cobertura de pares/trios fortes + distribuição espacial ótima)

REGRAS OBRIGATÓRIAS para todos os jogos:
- Respeitar faixa de soma histórica (média ± 1.5σ)
- Respeitar equilíbrio de paridade do perfil estatístico
- Máximo de consecutivos conforme padrão histórico
- Cada jogo deve ter pelo menos 2-3 dezenas DIFERENTES dos outros jogos
- Incluir pelo menos 1 dezena de cada zona/faixa nos jogos equilibrados

## 9. ALERTAS, ANOMALIAS E RED FLAGS
- Anomalias de entropia detectadas
- Dezenas com comportamento estatisticamente anormal (resíduos χ² altos)
- Riscos e precauções

Responda em português. Seja extremamente técnico, use dados concretos e justificativas numéricas em cada recomendação.`;

    // Try multiple models with failover
    const models = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let aiAnalysis = "";
    let aiSuccess = false;

    for (const model of models) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Você é um cientista de dados de elite com PhD em estatística aplicada, teoria da informação e modelagem probabilística. Sua análise combina entropia de Shannon, testes chi-quadrado, cadeias de Markov, análise de coocorrência e detecção de change-points para fundamentar recomendações rigorosas e acionáveis." },
              { role: "user", content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 8000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiAnalysis = data.choices?.[0]?.message?.content || "";
          if (aiAnalysis) { aiSuccess = true; break; }
        } else {
          const errText = await response.text();
          console.error(`Model ${model} failed (${response.status}):`, errText);
          if (response.status === 429) {
            // Rate limited, wait briefly and try next model
            await new Promise(r => setTimeout(r, 1000));
          }
          // For 402/5xx, try next model
        }
      } catch (e) {
        console.error(`Model ${model} exception:`, e);
      }
    }

    // Fallback: generate statistical analysis without AI
    if (!aiSuccess) {
      console.log("All AI models failed, generating statistical fallback");
      const topNums = topRankings.slice(0, 10).map((r: any) => `Nº${String(r.number).padStart(2, '0')} (Score: ${r.compositeScore})`).join(", ");
      const overdueNums = gaps.filter((g: any) => g.isOverdue).slice(0, 5).map((g: any) => `Nº${String(g.number).padStart(2, '0')} (atraso: ${g.currentGap})`).join(", ");
      const topPairs = cooccurrences.slice(0, 5).map((c: any) => `${c.pair?.join("-")} (lift: ${c.lift?.toFixed?.(2) || "N/A"})`).join(", ");
      
      // Generate 10 fallback games using statistical data
      const allRanked = topRankings.map((r: any) => r.number);
      const overdueList = gaps.filter((g: any) => g.isOverdue).map((g: any) => g.number);
      const fallbackGames: string[] = [];
      
      for (let g = 0; g < 10; g++) {
        const pool = [...allRanked];
        // Add some overdue numbers for variety in aggressive games
        if (g >= 6) {
          overdueList.forEach((n: number) => { if (!pool.includes(n)) pool.push(n); });
        }
        // Shuffle with bias toward top-ranked
        const game: number[] = [];
        const available = [...pool];
        while (game.length < pick && available.length > 0) {
          // Weight toward beginning (higher ranked) for conservative, more random for aggressive
          const bias = g < 3 ? 0.7 : g < 6 ? 0.5 : 0.3;
          const idx = Math.random() < bias 
            ? Math.floor(Math.random() * Math.min(available.length, Math.ceil(pick * 1.5)))
            : Math.floor(Math.random() * available.length);
          const num = available[Math.min(idx, available.length - 1)];
          if (!game.includes(num) && num >= 1 && num <= totalNumbers) {
            game.push(num);
          }
          available.splice(Math.min(idx, available.length - 1), 1);
        }
        // Fill remaining if needed
        while (game.length < pick) {
          const n = Math.floor(Math.random() * totalNumbers) + 1;
          if (!game.includes(n)) game.push(n);
        }
        game.sort((a: number, b: number) => a - b);
        const strategy = g < 3 ? "Conservador" : g < 6 ? "Equilibrado" : g < 8 ? "Agressivo" : g === 8 ? "Contrário" : "Cobertura Máxima";
        const confidence = g < 3 ? 75 - g * 3 : g < 6 ? 65 - (g - 3) * 3 : 55 - (g - 6) * 5;
        fallbackGames.push(`**Jogo ${g + 1} — ${strategy} (Confiança: ${confidence}/100)**\nDezenas: ${game.map((n: number) => String(n).padStart(2, '0')).join(', ')}`);
      }

      aiAnalysis = `## Análise Estatística (modo offline)\n\n` +
        `> ⚠️ IA temporariamente indisponível. Análise gerada com base nos dados estatísticos computados localmente.\n\n` +
        `## 1. Ranking de Dezenas\n**Top 10:** ${topNums}\n\n` +
        `**Tier S (score ≥80):** ${tierS.length > 0 ? tierS.join(", ") : "Nenhuma"}\n` +
        `**Tier A (60-79):** ${tierA.length > 0 ? tierA.join(", ") : "Nenhuma"}\n\n` +
        `## 2. Dezenas Atrasadas\n${overdueNums || "Nenhuma dezena significativamente atrasada"}\n\n` +
        `## 3. Coocorrências Fortes\n${topPairs || "Dados insuficientes"}\n\n` +
        `## 4. Entropia\nNormalizada: ${entropy.normalizedEntropy?.toFixed?.(4) || "N/A"} | ` +
        `Classificação: ${entropy.classification || "N/A"}\n\n` +
        `## 5. Teste Chi-Quadrado\nχ²: ${chiSquare.chiSquare?.toFixed?.(2) || "N/A"} | ` +
        `p-valor: ${chiSquare.pValue?.toFixed?.(4) || "N/A"} | ` +
        `${chiSquare.isUniform ? "Distribuição uniforme" : "Viés detectado"}\n\n` +
        `## 6. Confiança\nScore geral: ${report.confidenceScore || "N/A"}/100\n\n` +
        `## 8. 🎯 10 JOGOS OTIMIZADOS PARA O PRÊMIO PRINCIPAL\n\n` +
        fallbackGames.join('\n\n') + '\n\n' +
        `*Para análise completa com IA, tente novamente mais tarde.*`;
    }

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
