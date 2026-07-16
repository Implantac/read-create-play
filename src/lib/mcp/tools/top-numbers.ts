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
  name: "top_numbers",
  title: "Dezenas mais frequentes",
  description:
    "Retorna as dezenas mais frequentes de uma loteria com base em todo o histórico oficial já sincronizado.",
  inputSchema: {
    lottery_id: z.string().min(1).describe("Identificador da loteria, ex.: 'lotofacil', 'megasena'."),
    limit: z.number().int().min(1).max(50).default(10).describe("Quantas dezenas retornar."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lottery_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx).rpc("get_top_numbers", {
      p_lottery_id: lottery_id,
      p_limit: limit,
    });
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { lottery_id, top: data ?? [] },
    };
  },
});
