import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Fetch recent draws from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: draws, error: drawsError } = await supabase
      .from("lottery_draws")
      .select("concurso, numbers, draw_date")
      .eq("lottery_id", lottery_id)
      .order("concurso", { ascending: false })
      .limit(100);

    if (drawsError) throw drawsError;
    if (!draws || draws.length < 10) {
      throw new Error("Dados insuficientes. Sincronize os sorteios primeiro.");
    }

    // Lottery configs
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

    // Compute frequency stats for AI context
    const freq: Record<number, number> = {};
    const recentFreq: Record<number, number> = {};
    const lastSeen: Record<number, number> = {};
    
    for (let n = 1; n <= cfg.numbers; n++) {
      freq[n] = 0;
      recentFreq[n] = 0;
      lastSeen[n] = 999;
    }

    draws.forEach((d: any, i: number) => {
      (d.numbers || []).forEach((n: number) => {
        freq[n] = (freq[n] || 0) + 1;
        if (i < 30) recentFreq[n] = (recentFreq[n] || 0) + 1;
        if (i < lastSeen[n]) lastSeen[n] = i;
      });
    });

    // Build top hot/cold/overdue numbers
    const allNums = Array.from({ length: cfg.numbers }, (_, i) => i + 1);
    const hotNums = [...allNums].sort((a, b) => (recentFreq[b] || 0) - (recentFreq[a] || 0)).slice(0, 20);
    const coldNums = [...allNums].sort((a, b) => (lastSeen[b] || 0) - (lastSeen[a] || 0)).slice(0, 20);
    const overdueNums = [...allNums]
      .filter(n => lastSeen[n] > 10)
      .sort((a, b) => (lastSeen[b] || 0) - (lastSeen[a] || 0))
      .slice(0, 15);

    // Recent draws for pattern
    const last10 = draws.slice(0, 10).map((d: any) => d.numbers.join(","));
    const last5Sums = draws.slice(0, 5).map((d: any) => 
      (d.numbers || []).reduce((s: number, n: number) => s + n, 0)
    );
    const last5Parities = draws.slice(0, 5).map((d: any) => {
      const evens = (d.numbers || []).filter((n: number) => n % 2 === 0).length;
      return `${evens}P/${(d.numbers || []).length - evens}I`;
    });

    const systemPrompt = `Você é um analista estatístico especialista em loterias brasileiras. 
Sua tarefa é analisar padrões reais de sorteios passados e gerar combinações com as melhores probabilidades estatísticas.

REGRAS ABSOLUTAS:
- Cada aposta deve ter EXATAMENTE ${cfg.pick} números
- Números de 1 a ${cfg.numbers} (inclusive)
- Sem números repetidos em uma mesma aposta
- Os números devem estar em ordem crescente
- Gere exatamente ${Math.min(count, 10)} apostas diferentes
- NUNCA repita uma combinação que já saiu nos sorteios recentes

CRITÉRIOS DE QUALIDADE para cada aposta:
1. EQUILÍBRIO PAR/ÍMPAR: Proporção próxima de 50/50
2. DISTRIBUIÇÃO POR FAIXAS: Cobrir bem faixas baixas, médias e altas
3. SOMA EQUILIBRADA: A soma total dos números deve estar na faixa típica dos sorteios
4. EVITAR PADRÕES ÓBVIOS: Sem sequências consecutivas longas
5. MISTURAR QUENTES E FRIOS: ~60% números quentes + ~30% overdue + ~10% neutros
6. CONSIDERAR CICLOS: Números que estão "devidos" com base no padrão de aparições

Responda APENAS com JSON válido no formato:
{"bets": [[n1,n2,...], [n1,n2,...], ...], "analysis": "explicação breve da lógica usada"}`;

    const userPrompt = `Loteria: ${cfg.name} (${cfg.pick} números de 1 a ${cfg.numbers})

DADOS DOS ÚLTIMOS 100 SORTEIOS:

Últimos 10 resultados:
${last10.map((r: string, i: number) => `Concurso ${draws[i].concurso}: [${r}]`).join("\n")}

Somas dos últimos 5: [${last5Sums.join(", ")}]
Paridade últimos 5: [${last5Parities.join(", ")}]

TOP 20 números QUENTES (mais frequentes recentemente):
${hotNums.map(n => `${n}(freq30:${recentFreq[n]})`).join(", ")}

TOP 20 números FRIOS (maior atraso):
${coldNums.map(n => `${n}(atraso:${lastSeen[n]})`).join(", ")}

TOP 15 OVERDUE (atrasados > 10 sorteios):
${overdueNums.map(n => `${n}(atraso:${lastSeen[n]},freq:${freq[n]})`).join(", ")}

Frequência geral (top 25): ${[...allNums].sort((a, b) => (freq[b] || 0) - (freq[a] || 0)).slice(0, 25).map(n => `${n}:${freq[n]}`).join(", ")}

Gere ${Math.min(count, 10)} apostas otimizadas com base nesses dados reais.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("Erro na análise de IA");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let parsed: { bets: number[][]; analysis: string };
    try {
      // Try to extract JSON from response (may have markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Erro ao processar resposta da IA");
    }

    // Validate bets
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

    return new Response(JSON.stringify({
      success: true,
      bets: validBets,
      analysis: parsed.analysis || "Análise baseada em padrões estatísticos dos últimos 100 sorteios.",
      lottery: cfg.name,
      count: validBets.length,
    }), {
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
