import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface RecommendationBody {
  input: {
    lottery: { id: string; name: string; totalNumbers: number; pick: number; ticketPrice: number };
    baseSize: number;
    budget?: number;
    riskProfile?: "conservative" | "balanced" | "aggressive";
  };
  heuristic: {
    strategy: string;
    minHits: number;
    maxGames: number;
    expectedCoverage: number;
    expectedROI: number;
    rationale: string[];
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");
    const body = await req.json() as RecommendationBody;

    const prompt = `Você é um analista quantitativo especialista em fechamentos de loterias brasileiras.
Modalidade: ${body.input.lottery.name} (universo ${body.input.lottery.totalNumbers}, escolhe ${body.input.lottery.pick}).
Base do usuário: ${body.input.baseSize} dezenas.
Perfil de risco: ${body.input.riskProfile ?? "balanced"}.
Orçamento: ${body.input.budget ? `R$ ${body.input.budget}` : "não informado"}.

Recomendação heurística atual:
- Estratégia: ${body.heuristic.strategy}
- Garantia mínima: ${body.heuristic.minHits}
- Jogos alvo: ${body.heuristic.maxGames}
- Cobertura esperada: ${body.heuristic.expectedCoverage}%

Gere 4 a 6 justificativas curtas em português (linguagem natural, sem markdown, uma frase por linha) explicando por que esses parâmetros fazem sentido — cite trade-offs de custo/cobertura/risco.
Retorne APENAS um JSON: { "rationale": string[] }`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você responde estritamente com JSON válido." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return new Response(JSON.stringify({ error: "gateway", status: resp.status, detail: text.slice(0, 400) }), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let rationale: string[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.rationale)) rationale = parsed.rationale.filter((x: unknown) => typeof x === "string").slice(0, 8);
    } catch {
      rationale = [];
    }

    return new Response(JSON.stringify({
      rationale,
      strategy: body.heuristic.strategy,
      minHits: body.heuristic.minHits,
      maxGames: body.heuristic.maxGames,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
