import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_recent_draws",
  title: "Listar sorteios recentes",
  description:
    "Retorna os sorteios oficiais mais recentes de uma loteria (Mega-Sena, Lotofácil, Quina, Lotomania, etc.) com concurso, data e dezenas sorteadas.",
  inputSchema: {
    lottery_id: z
      .string()
      .min(1)
      .describe("Identificador da loteria, ex.: 'lotofacil', 'megasena', 'quina', 'lotomania'."),
    limit: z.number().int().min(1).max(50).default(10).describe("Quantos sorteios retornar (1–50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lottery_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("lottery_draws")
      .select("concurso, draw_date, numbers")
      .eq("lottery_id", lottery_id)
      .order("concurso", { ascending: false })
      .limit(limit);

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { lottery_id, draws: data ?? [] },
    };
  },
});
