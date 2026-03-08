import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCachedAnalysis, setCachedAnalysis } from "../_shared/ai-cache.ts";

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

    const { lottery_id, count = 3 } = await req.json();
    if (!lottery_id) throw new Error("lottery_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: draws, error: drawsError } = await supabase
      .from("lottery_draws")
      .select("concurso, numbers, draw_date")
      .eq("lottery_id", lottery_id)
      .order("concurso", { ascending: false })
      .limit(200);

    if (drawsError) throw drawsError;
    if (!draws || draws.length < 10) {
      throw new Error("Dados insuficientes. Sincronize os sorteios primeiro.");
    }

    const configs: Record<string, { numbers: number; pick: number; name: string }> = {
      megasena: { numbers: 60, pick: 6, name: "Mega Sena" },
      lotofacil: { numbers: 25, pick: 15, name: "Lotofácil" },
      quina: { numbers: 80, pick: 5, name: "Quina" },
      lotomania: { numbers: 100, pick: 50, name: "Lotomania" },
      duplasena: { numbers: 50, pick: 6, name: "Dupla Sena" },
      timemania: { numbers: 80, pick: 10, name: "Timemania" },
      diadesorte: { numbers: 31, pick: 7, name: "Dia de Sorte" },
      supersete: { numbers: 10, pick: 7, name: "Super Sete" },
    };

    const cfg = configs[lottery_id];
    if (!cfg) throw new Error("Loteria não suportada");

    // Check cache (key = lottery_id + last concurso + count)
    const cacheInput = { lottery_id, count, lastConcurso: draws[0]?.concurso };
    const cached = await getCachedAnalysis(supabase, lottery_id, "ai-lottery-predict", cacheInput, 4);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === COMPUTE DEEP STATISTICS ===
    const allNums = Array.from({ length: cfg.numbers }, (_, i) => i + 1);
    const freq: Record<number, number> = {};
    const freq30: Record<number, number> = {};
    const freq10: Record<number, number> = {};
    const lastSeen: Record<number, number> = {};
    const gapHistory: Record<number, number[]> = {};

    for (const n of allNums) {
      freq[n] = 0; freq30[n] = 0; freq10[n] = 0; lastSeen[n] = 999;
      gapHistory[n] = [];
    }

    // Track gaps between appearances
    const lastAppearance: Record<number, number> = {};
    
    draws.forEach((d: any, i: number) => {
      const nums = d.numbers || [];
      nums.forEach((n: number) => {
        freq[n]++;
        if (i < 30) freq30[n]++;
        if (i < 10) freq10[n]++;
        if (lastSeen[n] === 999) lastSeen[n] = i;
        
        // Gap tracking (reversed order since draws are desc)
        if (lastAppearance[n] !== undefined) {
          gapHistory[n].push(i - lastAppearance[n]);
        }
        lastAppearance[n] = i;
      });
    });

    // Compute average gap and predicted return
    const avgGap: Record<number, number> = {};
    const predictedReturn: Record<number, number> = {};
    for (const n of allNums) {
      const gaps = gapHistory[n];
      avgGap[n] = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 999;
      predictedReturn[n] = Math.max(0, Math.round(avgGap[n] - lastSeen[n]));
    }

    // Momentum: freq10 vs expected
    const expectedFreq10 = (cfg.pick / cfg.numbers) * 10;
    const momentum: Record<number, string> = {};
    for (const n of allNums) {
      const ratio = freq10[n] / Math.max(expectedFreq10, 0.1);
      momentum[n] = ratio > 1.3 ? "🔥FORTE" : ratio > 0.9 ? "→ESTÁVEL" : ratio > 0.5 ? "↘DECLÍNIO" : "❄️FRIO";
    }

    // Transition matrix: which numbers follow which in consecutive draws
    const transitions: Record<number, Record<number, number>> = {};
    for (let i = 0; i < Math.min(draws.length - 1, 50); i++) {
      const curr = new Set(draws[i].numbers || []);
      const next = new Set(draws[i + 1].numbers || []);
      for (const n of curr) {
        if (!transitions[n]) transitions[n] = {};
        for (const m of next) {
          transitions[n][m] = (transitions[n][m] || 0) + 1;
        }
      }
    }

    // Find strongest transition pairs from last draw
    const lastDrawNums = draws[0]?.numbers || [];
    const transitionScores: Record<number, number> = {};
    for (const n of lastDrawNums) {
      if (transitions[n]) {
        for (const [m, count] of Object.entries(transitions[n])) {
          transitionScores[Number(m)] = (transitionScores[Number(m)] || 0) + (count as number);
        }
      }
    }
    const topTransitions = Object.entries(transitionScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([n, s]) => `${n}(score:${s})`);

    // Sum and parity trends
    const last20Stats = draws.slice(0, 20).map((d: any) => {
      const nums = d.numbers || [];
      const sum = nums.reduce((a: number, b: number) => a + b, 0);
      const evens = nums.filter((n: number) => n % 2 === 0).length;
      const consec = nums.sort((a: number, b: number) => a - b)
        .filter((n: number, i: number, arr: number[]) => i > 0 && n === arr[i-1] + 1).length;
      return { concurso: d.concurso, sum, evens, odds: nums.length - evens, consec };
    });

    const avgSum = Math.round(last20Stats.reduce((a, s) => a + s.sum, 0) / last20Stats.length);
    const sumStdDev = Math.round(Math.sqrt(last20Stats.reduce((a, s) => a + Math.pow(s.sum - avgSum, 2), 0) / last20Stats.length));

    // Cooccurrence matrix (top pairs)
    const cooccurrence: Record<string, number> = {};
    draws.slice(0, 100).forEach((d: any) => {
      const nums = (d.numbers || []).sort((a: number, b: number) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]}-${nums[j]}`;
          cooccurrence[key] = (cooccurrence[key] || 0) + 1;
        }
      }
    });
    const topPairs = Object.entries(cooccurrence)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([pair, count]) => `(${pair}):${count}x`);

    // Build enriched prompt data
    const hotNums = [...allNums].sort((a, b) => freq30[b] - freq30[a]).slice(0, 20);
    const overdueNums = [...allNums].filter(n => lastSeen[n] > 10 && predictedReturn[n] <= 2)
      .sort((a, b) => predictedReturn[a] - predictedReturn[b]).slice(0, 15);
    const risingNums = [...allNums].filter(n => freq10[n] > freq30[n] / 3)
      .sort((a, b) => (freq10[b] / Math.max(freq30[b], 1)) - (freq10[a] / Math.max(freq30[a], 1)))
      .slice(0, 15);

    const last10 = draws.slice(0, 10).map((d: any) => d.numbers.join(","));

    const systemPrompt = `Você é um matemático estatístico de elite especializado em análise probabilística de loterias brasileiras.
Sua metodologia combina:
- Análise de Markov (transições entre sorteios)
- Ciclos de retorno (gap analysis)
- Momentum de frequência
- Coocorrência de pares
- Regressão à média

REGRAS ABSOLUTAS:
- Cada aposta deve ter EXATAMENTE ${cfg.pick} números
- Números de 1 a ${cfg.numbers} (inclusive)
- Sem números repetidos em uma mesma aposta
- Os números devem estar em ordem crescente
- Gere exatamente ${Math.min(count, 10)} apostas diferentes
- NUNCA repita uma combinação que já saiu nos sorteios recentes

METODOLOGIA DE GERAÇÃO:
1. NÚCLEO (40%): Números com forte momentum + alta frequência recente
2. TRANSIÇÕES (25%): Números com alta probabilidade de transição do último sorteio (Markov)
3. OVERDUE (20%): Números cujo retorno previsto está próximo (dentro de 2 ciclos)
4. COBERTURA (15%): Números neutros para garantir distribuição por faixas

VALIDAÇÃO DE CADA APOSTA:
- Equilíbrio par/ímpar dentro de ±1 da média dos últimos 20
- Soma dentro de ±1σ da média (${avgSum} ± ${sumStdDev})
- Mínimo de 3 faixas cobertas
- Máximo de 2 consecutivos
- Pelo menos 1 par do top coocorrências incluído

Responda APENAS com JSON válido no formato:
{"bets": [[n1,n2,...], [n1,n2,...], ...], "analysis": "explicação detalhada da lógica probabilística usada, mencionando quais números vieram de qual critério"}`;

    const userPrompt = `Loteria: ${cfg.name} (${cfg.pick} números de 1 a ${cfg.numbers})
Concursos analisados: ${draws.length}

═══ ÚLTIMOS 10 RESULTADOS ═══
${last10.map((r: string, i: number) => `C${draws[i].concurso}: [${r}]`).join("\n")}

═══ ESTATÍSTICAS DOS ÚLTIMOS 20 SORTEIOS ═══
Soma média: ${avgSum} (σ ${sumStdDev})
Paridade média: ${last20Stats.map(s => `${s.evens}P/${s.odds}I`).join(", ")}
Consecutivos médios: ${(last20Stats.reduce((a, s) => a + s.consec, 0) / 20).toFixed(1)}

═══ TOP 20 NÚMEROS QUENTES (freq últimos 30) ═══
${hotNums.map(n => `${n}(f30:${freq30[n]} f10:${freq10[n]} gap:${lastSeen[n]} ${momentum[n]})`).join(", ")}

═══ TOP 15 NÚMEROS RISING (acelerando) ═══
${risingNums.map(n => `${n}(f10:${freq10[n]} f30:${freq30[n]} ratio:${(freq10[n] / Math.max(freq30[n]/3, 0.1)).toFixed(1)})`).join(", ")}

═══ TOP 15 OVERDUE (retorno previsto em ≤2 ciclos) ═══
${overdueNums.map(n => `${n}(gap:${lastSeen[n]} avgGap:${avgGap[n].toFixed(1)} retornoPrevisto:${predictedReturn[n]} freq:${freq[n]})`).join(", ")}

═══ TRANSIÇÕES DE MARKOV (a partir do último sorteio C${draws[0]?.concurso}) ═══
Dezenas com maior probabilidade de seguir: ${topTransitions.join(", ")}

═══ TOP 15 PARES COOCORRENTES ═══
${topPairs.join(", ")}

═══ FREQUÊNCIA GERAL TOP 30 ═══
${[...allNums].sort((a, b) => freq[b] - freq[a]).slice(0, 30).map(n => `${n}:${freq[n]}`).join(", ")}

Gere ${Math.min(count, 10)} apostas otimizadas usando a metodologia descrita.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.6,
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
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro na análise de IA");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed: { bets: number[][]; analysis: string };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Erro ao processar resposta da IA");
    }

    const validBets = (parsed.bets || [])
      .filter((bet: number[]) => {
        if (!Array.isArray(bet)) return false;
        if (bet.length !== cfg.pick) return false;
        if (new Set(bet).size !== cfg.pick) return false;
        return bet.every(n => n >= 1 && n <= cfg.numbers);
      })
      .map((bet: number[]) => [...bet].sort((a, b) => a - b));

    if (validBets.length === 0) {
      throw new Error("IA não gerou apostas válidas. Tente novamente.");
    }

    const responseData = {
      success: true,
      bets: validBets,
      analysis: parsed.analysis || "Análise baseada em padrões estatísticos avançados.",
      lottery: cfg.name,
      count: validBets.length,
    };

    // Store in cache
    await setCachedAnalysis(supabase, lottery_id, "ai-lottery-predict", cacheInput, responseData, 4);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Prediction error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
