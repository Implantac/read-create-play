import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCachedAnalysis, setCachedAnalysis } from "../_shared/ai-cache.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Lottery-specific validation profiles
const LOTTERY_PROFILES: Record<string, {
  numbers: number; pick: number; name: string;
  sumRange: [number, number]; // acceptable sum range
  parityRange: [number, number]; // min/max even numbers
  maxConsecutive: number; // max consecutive numbers allowed
  minRanges: number; // minimum distinct ranges covered
  rangeSize: number; // how to divide the number space into ranges
  specialRules?: string; // extra prompt instructions
}> = {
  megasena: {
    numbers: 60, pick: 6, name: "Mega Sena",
    sumRange: [120, 260], parityRange: [2, 4], maxConsecutive: 2, minRanges: 3, rangeSize: 10,
    specialRules: "Evite concentrar mais de 3 números na mesma dezena. Ideal: 3 pares e 3 ímpares."
  },
  lotofacil: {
    numbers: 25, pick: 15, name: "Lotofácil",
    sumRange: [170, 230], parityRange: [6, 9], maxConsecutive: 5, minRanges: 5, rangeSize: 5,
    specialRules: "Distribua 3 números por cada faixa de 5 (1-5, 6-10, 11-15, 16-20, 21-25). Ideal: 7-8 pares e 7-8 ímpares. Pelo menos 4 sequências de consecutivos."
  },
  quina: {
    numbers: 80, pick: 5, name: "Quina",
    sumRange: [100, 280], parityRange: [2, 3], maxConsecutive: 2, minRanges: 3, rangeSize: 16,
    specialRules: "Distribua entre faixas de 20 (1-20, 21-40, 41-60, 61-80). Evite mais de 2 na mesma faixa."
  },
  lotomania: {
    numbers: 100, pick: 50, name: "Lotomania",
    sumRange: [2300, 2800], parityRange: [23, 27], maxConsecutive: 8, minRanges: 10, rangeSize: 10,
    specialRules: "Distribua ~5 números por dezena (0-9, 10-19, ..., 90-99). Equilíbrio par/ímpar: 24-26 pares. Inclua terminações de 0-9 em quantidade equilibrada."
  },
  duplasena: {
    numbers: 50, pick: 6, name: "Dupla Sena",
    sumRange: [100, 210], parityRange: [2, 4], maxConsecutive: 2, minRanges: 3, rangeSize: 10,
    specialRules: "Distribua entre as faixas 1-10, 11-20, 21-30, 31-40, 41-50. Máximo 2 por faixa."
  },
  timemania: {
    numbers: 80, pick: 10, name: "Timemania",
    sumRange: [250, 520], parityRange: [4, 6], maxConsecutive: 3, minRanges: 4, rangeSize: 16,
    specialRules: "Distribua entre 5 faixas de 16. Equilíbrio 5 pares / 5 ímpares é ideal."
  },
  diadesorte: {
    numbers: 31, pick: 7, name: "Dia de Sorte",
    sumRange: [80, 150], parityRange: [3, 4], maxConsecutive: 2, minRanges: 3, rangeSize: 8,
    specialRules: "Cubra pelo menos 3 das 4 faixas (1-8, 9-16, 17-24, 25-31). Soma ideal entre 100-130."
  },
  supersete: {
    numbers: 10, pick: 7, name: "Super Sete",
    sumRange: [20, 50], parityRange: [3, 4], maxConsecutive: 3, minRanges: 2, rangeSize: 5,
    specialRules: "ATENÇÃO: Super Sete é especial - cada coluna tem valores de 0-9. Gere 7 dígitos de 0-9 (podem repetir entre colunas). Distribuição equilibrada entre baixos (0-4) e altos (5-9)."
  },
};

// Validate and repair a bet according to lottery-specific rules
function validateAndRepairBet(bet: number[], profile: typeof LOTTERY_PROFILES[string], allFreq: Record<number, number>): number[] | null {
  if (!Array.isArray(bet)) return null;

  // Filter valid numbers and remove duplicates
  let nums = [...new Set(bet.filter(n => n >= (profile.name === "Super Sete" ? 0 : 1) && n <= profile.numbers))];

  // Fix length
  if (nums.length > profile.pick) {
    nums = nums.slice(0, profile.pick);
  }

  // Add missing numbers from top frequency pool
  if (nums.length < profile.pick) {
    const pool = Array.from({ length: profile.numbers }, (_, i) => i + (profile.name === "Super Sete" ? 0 : 1))
      .filter(n => !nums.includes(n))
      .sort((a, b) => (allFreq[b] || 0) - (allFreq[a] || 0));
    
    while (nums.length < profile.pick && pool.length > 0) {
      nums.push(pool.shift()!);
    }
  }

  if (nums.length !== profile.pick) return null;

  nums.sort((a, b) => a - b);

  // Validate sum
  const sum = nums.reduce((a, b) => a + b, 0);
  if (sum < profile.sumRange[0] || sum > profile.sumRange[1]) {
    // Try to repair: swap extremes
    for (let attempt = 0; attempt < 5; attempt++) {
      if (sum < profile.sumRange[0]) {
        // Replace lowest non-critical number with a higher one
        const idx = 0;
        const candidates = Array.from({ length: profile.numbers }, (_, i) => i + 1)
          .filter(n => !nums.includes(n) && n > nums[nums.length - 1] * 0.8)
          .sort((a, b) => (allFreq[b] || 0) - (allFreq[a] || 0));
        if (candidates.length > 0) {
          nums[idx] = candidates[0];
          nums.sort((a, b) => a - b);
        }
      } else {
        const idx = nums.length - 1;
        const candidates = Array.from({ length: profile.numbers }, (_, i) => i + 1)
          .filter(n => !nums.includes(n) && n < nums[0] * 1.5)
          .sort((a, b) => (allFreq[b] || 0) - (allFreq[a] || 0));
        if (candidates.length > 0) {
          nums[idx] = candidates[0];
          nums.sort((a, b) => a - b);
        }
      }
      const newSum = nums.reduce((a, b) => a + b, 0);
      if (newSum >= profile.sumRange[0] && newSum <= profile.sumRange[1]) break;
    }
  }

  // Ensure uniqueness after repairs
  if (new Set(nums).size !== profile.pick) return null;

  return nums;
}

// Score a bet for quality reporting
function scoreBet(bet: number[], profile: typeof LOTTERY_PROFILES[string], avgSum: number, sumStdDev: number): {
  score: number; details: string[];
} {
  const details: string[] = [];
  let score = 100;

  const sum = bet.reduce((a, b) => a + b, 0);
  const sumDev = Math.abs(sum - avgSum) / Math.max(sumStdDev, 1);
  if (sumDev > 2) { score -= 20; details.push(`Soma ${sum} distante da média`); }
  else if (sumDev <= 1) { score += 5; details.push(`Soma ${sum} ideal`); }

  const evens = bet.filter(n => n % 2 === 0).length;
  if (evens >= profile.parityRange[0] && evens <= profile.parityRange[1]) {
    score += 5; details.push(`Paridade ${evens}P/${bet.length - evens}I equilibrada`);
  } else {
    score -= 10; details.push(`Paridade ${evens}P/${bet.length - evens}I desequilibrada`);
  }

  // Count consecutive
  let consec = 0;
  const sorted = [...bet].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) consec++;
  }
  if (consec <= profile.maxConsecutive) {
    score += 3;
  } else {
    score -= 10; details.push(`${consec} consecutivos (máx ${profile.maxConsecutive})`);
  }

  // Range coverage
  const ranges = new Set(sorted.map(n => Math.floor((n - 1) / profile.rangeSize)));
  if (ranges.size >= profile.minRanges) {
    score += 5; details.push(`${ranges.size} faixas cobertas`);
  } else {
    score -= 15; details.push(`Apenas ${ranges.size} faixas (mín ${profile.minRanges})`);
  }

  return { score: Math.max(0, Math.min(100, score)), details };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { lottery_id, count = 3 } = await req.json();
    if (!lottery_id) throw new Error("lottery_id required");

    const profile = LOTTERY_PROFILES[lottery_id];
    if (!profile) throw new Error("Loteria não suportada");

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

    // Check cache
    const cacheInput = { lottery_id, count, lastConcurso: draws[0]?.concurso };
    const cached = await getCachedAnalysis(supabase, lottery_id, "ai-lottery-predict", cacheInput, 4);
    if (cached) {
      return new Response(JSON.stringify({ ...cached, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === COMPUTE DEEP STATISTICS ===
    const minNum = profile.name === "Super Sete" ? 0 : 1;
    const allNums = Array.from({ length: profile.numbers - minNum + 1 }, (_, i) => i + minNum);
    const freq: Record<number, number> = {};
    const freq30: Record<number, number> = {};
    const freq10: Record<number, number> = {};
    const lastSeen: Record<number, number> = {};
    const gapHistory: Record<number, number[]> = {};

    for (const n of allNums) {
      freq[n] = 0; freq30[n] = 0; freq10[n] = 0; lastSeen[n] = 999;
      gapHistory[n] = [];
    }

    const lastAppearance: Record<number, number> = {};

    draws.forEach((d: any, i: number) => {
      const nums = d.numbers || [];
      nums.forEach((n: number) => {
        freq[n] = (freq[n] || 0) + 1;
        if (i < 30) freq30[n] = (freq30[n] || 0) + 1;
        if (i < 10) freq10[n] = (freq10[n] || 0) + 1;
        if (lastSeen[n] === 999) lastSeen[n] = i;

        if (lastAppearance[n] !== undefined) {
          if (!gapHistory[n]) gapHistory[n] = [];
          gapHistory[n].push(i - lastAppearance[n]);
        }
        lastAppearance[n] = i;
      });
    });

    const avgGap: Record<number, number> = {};
    const predictedReturn: Record<number, number> = {};
    for (const n of allNums) {
      const gaps = gapHistory[n] || [];
      avgGap[n] = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 999;
      predictedReturn[n] = Math.max(0, Math.round(avgGap[n] - lastSeen[n]));
    }

    const expectedFreq10 = (profile.pick / profile.numbers) * 10;
    const momentum: Record<number, string> = {};
    for (const n of allNums) {
      const ratio = freq10[n] / Math.max(expectedFreq10, 0.1);
      momentum[n] = ratio > 1.3 ? "🔥FORTE" : ratio > 0.9 ? "→ESTÁVEL" : ratio > 0.5 ? "↘DECLÍNIO" : "❄️FRIO";
    }

    // Transition matrix
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

    const lastDrawNums = draws[0]?.numbers || [];
    const transitionScores: Record<number, number> = {};
    for (const n of lastDrawNums) {
      if (transitions[n]) {
        for (const [m, cnt] of Object.entries(transitions[n])) {
          transitionScores[Number(m)] = (transitionScores[Number(m)] || 0) + (cnt as number);
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
      const sorted = [...nums].sort((a: number, b: number) => a - b);
      const consec = sorted.filter((n: number, i: number) => i > 0 && n === sorted[i - 1] + 1).length;
      return { concurso: d.concurso, sum, evens, odds: nums.length - evens, consec };
    });

    const avgSum = Math.round(last20Stats.reduce((a, s) => a + s.sum, 0) / last20Stats.length);
    const sumStdDev = Math.round(Math.sqrt(last20Stats.reduce((a, s) => a + Math.pow(s.sum - avgSum, 2), 0) / last20Stats.length));
    const avgEvens = Math.round(last20Stats.reduce((a, s) => a + s.evens, 0) / last20Stats.length);

    // Cooccurrence
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

    // Ranked lists
    const hotNums = [...allNums].sort((a, b) => (freq30[b] || 0) - (freq30[a] || 0)).slice(0, 20);
    const overdueNums = [...allNums].filter(n => lastSeen[n] > 10 && predictedReturn[n] <= 2)
      .sort((a, b) => predictedReturn[a] - predictedReturn[b]).slice(0, 15);
    const risingNums = [...allNums].filter(n => freq10[n] > (freq30[n] || 1) / 3)
      .sort((a, b) => (freq10[b] / Math.max(freq30[b], 1)) - (freq10[a] / Math.max(freq30[a], 1)))
      .slice(0, 15);

    const last10 = draws.slice(0, 10).map((d: any) => d.numbers.join(","));

    // Build lottery-specific system prompt
    const systemPrompt = `Você é um matemático estatístico de elite especializado em loterias brasileiras.
Você está analisando a loteria "${profile.name}" (${profile.pick} números de ${minNum} a ${profile.numbers}).

REGRAS ABSOLUTAS INVIOLÁVEIS:
- Cada aposta DEVE ter EXATAMENTE ${profile.pick} números
- Números de ${minNum} a ${profile.numbers} (inclusive)
- Sem números repetidos em uma mesma aposta
- Números em ORDEM CRESCENTE
- Gere exatamente ${Math.min(count, 10)} apostas DIFERENTES entre si
- NUNCA repita uma combinação idêntica a um sorteio passado

CRITÉRIOS DE QUALIDADE OBRIGATÓRIOS PARA ${profile.name.toUpperCase()}:
- Soma da aposta: entre ${profile.sumRange[0]} e ${profile.sumRange[1]} (média histórica: ${avgSum} ± ${sumStdDev})
- Pares: entre ${profile.parityRange[0]} e ${profile.parityRange[1]} números pares (média: ${avgEvens})
- Máximo de ${profile.maxConsecutive} números consecutivos
- Mínimo de ${profile.minRanges} faixas cobertas (faixas de ${profile.rangeSize})
${profile.specialRules ? `- REGRA ESPECIAL: ${profile.specialRules}` : ""}

METODOLOGIA DE COMPOSIÇÃO:
1. NÚCLEO (40%): Números com momentum 🔥FORTE + alta frequência recente
2. TRANSIÇÕES (25%): Números com alta probabilidade de transição via Markov
3. OVERDUE (20%): Números cujo retorno previsto é iminente (gap ≥ avgGap)
4. COBERTURA (15%): Números para equilibrar faixas, paridade e soma

APÓS COMPOR, VALIDE CADA APOSTA:
✓ Soma está entre ${profile.sumRange[0]}-${profile.sumRange[1]}?
✓ Pares entre ${profile.parityRange[0]}-${profile.parityRange[1]}?
✓ Consecutivos ≤ ${profile.maxConsecutive}?
✓ Faixas cobertas ≥ ${profile.minRanges}?
Se algum critério falhar, AJUSTE a aposta antes de incluí-la.

Responda APENAS com JSON válido:
{"bets": [[n1,n2,...], ...], "analysis": "explicação técnica detalhada"}`;

    const userPrompt = `═══ ÚLTIMOS 10 RESULTADOS ═══
${last10.map((r: string, i: number) => `C${draws[i].concurso}: [${r}]`).join("\n")}

═══ ESTATÍSTICAS (últimos 20) ═══
Soma média: ${avgSum} (σ${sumStdDev}) | Pares médio: ${avgEvens} | Consecutivos: ${(last20Stats.reduce((a, s) => a + s.consec, 0) / 20).toFixed(1)}

═══ TOP 20 QUENTES (freq30) ═══
${hotNums.map(n => `${n}(f30:${freq30[n]} f10:${freq10[n]} gap:${lastSeen[n]} ${momentum[n]})`).join(", ")}

═══ TOP 15 RISING ═══
${risingNums.map(n => `${n}(f10:${freq10[n]} f30:${freq30[n]})`).join(", ")}

═══ TOP 15 OVERDUE ═══
${overdueNums.map(n => `${n}(gap:${lastSeen[n]} avg:${avgGap[n].toFixed(1)} ret:${predictedReturn[n]})`).join(", ")}

═══ MARKOV (transições do C${draws[0]?.concurso}) ═══
${topTransitions.join(", ")}

═══ TOP 15 PARES COOCORRENTES ═══
${topPairs.join(", ")}

═══ FREQ GERAL TOP 30 ═══
${[...allNums].sort((a, b) => (freq[b] || 0) - (freq[a] || 0)).slice(0, 30).map(n => `${n}:${freq[n]}`).join(", ")}

Gere ${Math.min(count, 10)} apostas para ${profile.name} seguindo TODOS os critérios de qualidade.`;

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

    // Validate, repair, and score each bet
    const validBets: number[][] = [];
    const betScores: { score: number; details: string[] }[] = [];
    const seenCombos = new Set<string>();

    for (const rawBet of (parsed.bets || [])) {
      const repaired = validateAndRepairBet(rawBet, profile, freq);
      if (!repaired) continue;

      const key = repaired.join(",");
      if (seenCombos.has(key)) continue;
      seenCombos.add(key);

      const scoreResult = scoreBet(repaired, profile, avgSum, sumStdDev);
      // Only include bets with score >= 50
      if (scoreResult.score >= 50) {
        validBets.push(repaired);
        betScores.push(scoreResult);
      }
    }

    if (validBets.length === 0) {
      throw new Error("IA não gerou apostas válidas. Tente novamente.");
    }

    const avgScore = Math.round(betScores.reduce((a, b) => a + b.score, 0) / betScores.length);

    const responseData = {
      success: true,
      bets: validBets,
      analysis: parsed.analysis || "Análise baseada em padrões estatísticos avançados.",
      lottery: profile.name,
      count: validBets.length,
      quality: {
        avgScore,
        scores: betScores.map(s => s.score),
        grade: avgScore >= 90 ? "S" : avgScore >= 80 ? "A" : avgScore >= 70 ? "B" : avgScore >= 60 ? "C" : "D",
      },
    };

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
