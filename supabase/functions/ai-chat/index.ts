import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, lotteryId } = await req.json();

    const systemPrompt = `Você é o assistente de IA do Titan Loterias, especialista em análise de loterias brasileiras.
Você ajuda os usuários com:
- Análises estatísticas de jogos e números
- Estratégias de apostas (conservadora, equilibrada, agressiva)
- Explicações sobre padrões, frequências, ciclos e tendências
- Dicas personalizadas baseadas no contexto da loteria selecionada
- Fechamentos e combinações otimizadas
- Simulações e backtesting

Loteria atual do contexto: ${lotteryId || "lotofacil"}

REGRAS:
- Responda sempre em português brasileiro
- Seja objetivo e direto
- Use dados estatísticos quando possível
- Nunca prometa resultados ou ganhos garantidos
- Lembre que loterias são jogos de azar
- Formate respostas com markdown quando apropriado (listas, negrito, etc)
- Seja amigável e acessível`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Gateway error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
