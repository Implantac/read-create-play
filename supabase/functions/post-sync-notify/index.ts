// Titan Loterias — Post-Sync Notifier (Orquestrador)
// Roda logo após sync-lottery-draws. Para cada loteria:
//   1) Chama alerts-scan (fan-out global) — dispara triggers estatísticos
//   2) Chama notify-bet-results para o último concurso — notifica apostadores premiados
//
// Autenticação: apenas service-role (x-service-key = SUPABASE_SERVICE_ROLE_KEY).
// Uso: chamado por cron ou pelo próprio sync-lottery-draws ao final.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-service-key",
};

const LOTTERY_IDS = [
  "megasena",
  "lotofacil",
  "quina",
  "lotomania",
  "duplasena",
  "timemania",
  "diadesorte",
  "supersete",
] as const;

async function callFn(
  supabaseUrl: string,
  serviceRole: string,
  name: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; result?: unknown; error?: string }> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: unknown = null;
    try { json = JSON.parse(text); } catch { json = text; }
    return { ok: res.ok, status: res.status, result: json };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const key = req.headers.get("x-service-key");
    if (!key || key !== serviceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRole);
    const body = await req.json().catch(() => ({}));
    const lotteriesInput = Array.isArray(body?.lotteries) && body.lotteries.length > 0
      ? body.lotteries
      : LOTTERY_IDS;

    // 1) Um único alerts-scan global cobre TODOS os configs habilitados
    const alertsRes = await callFn(supabaseUrl, serviceRole, "alerts-scan", {});

    // 2) notify-bet-results por loteria, usando o último concurso disponível
    const perLottery: Record<string, unknown> = {};
    for (const lot of lotteriesInput) {
      const { data: latest } = await admin
        .from("lottery_draws")
        .select("concurso")
        .eq("lottery_id", lot)
        .order("concurso", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!latest) {
        perLottery[lot] = { skipped: "no draws" };
        continue;
      }
      const r = await callFn(supabaseUrl, serviceRole, "notify-bet-results", {
        lottery_id: lot,
        concurso: latest.concurso,
      });
      perLottery[lot] = { concurso: latest.concurso, ...r };
    }

    return new Response(
      JSON.stringify({ ok: true, alerts: alertsRes.result, results: perLottery }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[post-sync-notify] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
