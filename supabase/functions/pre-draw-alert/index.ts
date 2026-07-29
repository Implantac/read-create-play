// Titan Loterias — Pre-Draw Alert (T-2h contextual push)
// Notifica usuários com apostas salvas e opt-in da categoria "draws" faltando
// ~2 horas para o próximo sorteio oficial.
//
// Autenticação: service-role apenas (x-service-key = SUPABASE_SERVICE_ROLE_KEY).
// Uso: chamado por pg_cron a cada 15 minutos.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-service-key",
};

// Horários oficiais dos sorteios (America/Sao_Paulo, aproximado)
// Loterias sorteadas às 20:00 BRT em dias específicos da semana.
// weekday: 0=Sun ... 6=Sat  (Date.getUTCDay para BRT-aware handling)
const SCHEDULE: { lottery: string; name: string; days: number[] }[] = [
  { lottery: "megasena",  name: "Mega-Sena",   days: [2, 4, 6] },   // ter/qui/sab
  { lottery: "lotofacil", name: "Lotofácil",   days: [1, 2, 3, 4, 5, 6] },
  { lottery: "quina",     name: "Quina",       days: [1, 2, 3, 4, 5, 6] },
  { lottery: "lotomania", name: "Lotomania",   days: [1, 3, 5] },
  { lottery: "duplasena", name: "Dupla Sena",  days: [1, 3, 5] },
  { lottery: "timemania", name: "Timemania",   days: [2, 4, 6] },
  { lottery: "diadesorte",name: "Dia de Sorte",days: [2, 4, 6] },
];

function nowInBRT(): { weekday: number; hour: number; minute: number } {
  const now = new Date();
  // BRT = UTC-3 (sem horário de verão desde 2019)
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return {
    weekday: brt.getUTCDay(),
    hour: brt.getUTCHours(),
    minute: brt.getUTCMinutes(),
  };
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
    const { weekday, hour, minute } = nowInBRT();

    // Janela ativa: 17:45 - 18:15 BRT (≈ 2h antes do sorteio das 20:00).
    // A janela de 30min permite o cron rodar a cada 15min sem duplicar alertas.
    const inWindow = hour === 17 && minute >= 45 || hour === 18 && minute <= 15;
    if (!inWindow) {
      return new Response(JSON.stringify({ ok: true, skipped: "outside_window", hour, minute }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const active = SCHEDULE.filter((s) => s.days.includes(weekday));
    if (active.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "no_lotteries_today" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notified = 0;
    const perLottery: Record<string, number> = {};

    for (const s of active) {
      // Encontra usuários com apostas salvas nesta loteria (últimos 60 dias)
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const { data: bets } = await admin
        .from("saved_bets")
        .select("user_id")
        .eq("lottery_id", s.lottery)
        .gte("created_at", cutoff);

      const uniqueUsers = Array.from(new Set((bets ?? []).map((b: any) => b.user_id)));
      if (uniqueUsers.length === 0) continue;

      // Filtra apenas quem tem push com opt-in de "draws"
      const { data: subs } = await admin
        .from("push_subscriptions")
        .select("user_id, categories, enabled")
        .in("user_id", uniqueUsers)
        .eq("enabled", true);

      const eligible = (subs ?? [])
        .filter((r: any) => r.categories?.draws !== false)
        .map((r: any) => r.user_id);

      for (const uid of Array.from(new Set(eligible))) {
        await admin.rpc("send_notification", {
          _user_id: uid,
          _title: `⏰ ${s.name} em ~2h`,
          _message: `O sorteio da ${s.name} acontece por volta das 20h. Confira suas apostas salvas e o Painel de Comando.`,
          _type: "predraw",
          _action_url: "/comando",
          _priority: "high",
          _category: "draws",
        });
        notified++;
        perLottery[s.lottery] = (perLottery[s.lottery] ?? 0) + 1;
      }
    }

    return new Response(JSON.stringify({ ok: true, notified, perLottery }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[pre-draw-alert] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
