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
  name: "list_my_saved_bets",
  title: "Minhas apostas salvas",
  description:
    "Lista as apostas salvas do usuário autenticado no Titan Loterias, opcionalmente filtrando por loteria.",
  inputSchema: {
    lottery_id: z
      .string()
      .nullable()
      .default(null)
      .describe("Filtro opcional por loteria (ex.: 'lotofacil'). null para todas."),
    limit: z.number().int().min(1).max(100).default(20).describe("Máximo de apostas a retornar."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lottery_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("saved_bets")
      .select("id, lottery_id, numbers, created_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit);
    if (lottery_id) query = query.eq("lottery_id", lottery_id);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { bets: data ?? [] },
    };
  },
});
