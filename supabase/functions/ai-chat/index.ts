import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUserAuth, corsHeaders } from "../_shared/auth.ts";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = await requireUserAuth(req, {
      allowedPlans: ["premium", "professional", "lifetime"],
    });
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const lotteryId: string = typeof body?.lotteryId === "string" ? body.lotteryId : "geral";
    const userContext: string = typeof body?.userContext === "string" ? body.userContext : "";

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é o **Titan IA**, assistente especialista em loterias brasileiras (Mega-Sena, Lotofácil, Quina, Lotomania, Dupla Sena, Timemania, Dia de Sorte, Super Sete).

CONTEXTO ATUAL:
- Loteria selecionada pelo usuário: ${lotteryId}
${userContext ? `- Perfil de aprendizado do usuário:\n${userContext}` : ""}

DIRETRIZES:
- Responda em português do Brasil, de forma clara, objetiva e didática.
- Use markdown (títulos H2/H3, listas, tabelas e \`código\` quando útil).
- Quando gerar jogos, mostre as dezenas em **negrito**, com 2 dígitos (ex: **02, 07, 13**), uma sugestão por linha.
- Baseie estratégias em estatística (frequência, atraso, ciclos, par/ímpar, soma, distribuição por faixas, primos, fechamentos).
- Nunca prometa vitória. Reforce: "loterias são jogos de azar — jogue com responsabilidade".
- Seja conciso: respostas longas só quando o usuário pedir análise profunda.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: String(m.content ?? "") })),
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const text = await aiResponse.text().catch(() => "");
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao conectar com o gateway de IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
