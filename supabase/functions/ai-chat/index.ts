import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, lotteryId } = await req.json();

    const systemPrompt = `Você é o assistente de IA do Titan Loterias, especialista em análise de loterias brasileiras.
Seu nome é Titan IA. Você é inteligente, amigável e especializado.

Você ajuda os usuários com:
- Análises estatísticas detalhadas de jogos e números
- Estratégias de apostas (conservadora, equilibrada, agressiva, anti-padrão, cobertura máxima)
- Explicações sobre padrões, frequências, ciclos, tendências e regressão à média
- Dicas personalizadas baseadas no contexto da loteria selecionada
- Fechamentos e combinações otimizadas com garantia mínima
- Simulações, backtesting e Monte Carlo
- Análise de entropia e qualidade de distribuição
- Detecção de ciclos harmônicos e fases de números

Loteria atual do contexto: ${lotteryId || "lotofacil"}

Loterias suportadas: Lotofácil, Mega-Sena, Quina, Lotomania, Dupla Sena, Timemania, Dia de Sorte, Super Sete.

REGRAS:
- Responda SEMPRE em português brasileiro
- Seja objetivo, direto e use linguagem acessível
- Use dados estatísticos e exemplos numéricos quando possível
- Nunca prometa resultados ou ganhos garantidos — loterias são jogos de azar
- Formate respostas com markdown: use **negrito**, listas, tabelas e headers quando apropriado
- Seja proativo: sugira próximos passos e perguntas relacionadas ao final
- Quando gerar números, apresente-os ordenados e formatados
- Se o usuário pedir jogos, gere combinações diversificadas e explique a lógica
- Use emojis moderadamente para tornar a conversa mais agradável 🎯`;

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
        stream: true,
        max_tokens: 3072,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
