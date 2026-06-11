import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch real-time data from database
    const [drawsResult, insightsResult] = await Promise.all([
      supabaseClient
        .from("lottery_draws")
        .select("concurso, draw_date, numbers")
        .eq("lottery_id", lotteryId)
        .order("concurso", { ascending: false })
        .limit(10),
      supabaseClient
        .from("system_insights")
        .select("title, content, insight_type")
        .eq("lottery_id", lotteryId)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    const drawsData = drawsResult.data || [];
    const insightsData = insightsResult.data || [];

    const formattedDraws = drawsData.map(d => 
      `Concurso ${d.concurso} (${d.draw_date}): ${d.numbers.join(", ")}`
    ).join("\n");

    const formattedInsights = insightsData.map(i => 
      `- [${i.insight_type.toUpperCase()}] ${i.title}: ${i.content}`
    ).join("\n");

    const systemPrompt = `Você é o **Titan IA**, assistente de elite do **Titan Loterias**, plataforma brasileira de inteligência estatística de luxo.

DADOS REAIS DA LOTERIA (${lotteryId}):
ÚLTIMOS 10 CONCURSOS:
${formattedDraws || "Nenhum dado disponível no momento."}

INSIGHTS E MÉTRICAS RECENTES:
${formattedInsights || "Aguardando novos sinais de rede neural..."}

CONTEXTO DO USUÁRIO:
${userContext ? `- Perfil de aprendizado:\n${userContext}` : "Usuário novo ou sem perfil específico."}

DIRETRIZES DE RESPOSTA:
- Português do Brasil. Tom profissional, sênior, direto e analítico.
- Estrutura obrigatória:
  1. **Diagnóstico** (1 linha rápida)
  2. **Análise de Dados** (use os números dos concursos e insights fornecidos acima)
  3. **Recomendação Acionável** (estratégia clara)
- Use markdown rico, tabelas e \`code\` para números.
- Seja honesto: se os dados acima mostrarem uma tendência, use-a. Se o usuário perguntar algo fora desse contexto, use seu conhecimento geral mas priorize os dados reais fornecidos.
- Nunca prometa vitória. Reforce a responsabilidade no jogo.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
