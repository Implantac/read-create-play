// Titan Loterias — Notify Bet Results
// Compara saved_bets de cada usuário contra o sorteio mais recente (ou concurso especificado)
// e dispara push notification personalizado com acertos + faixa de prêmio.
//
// Modos:
//   1) Autenticado (usuário logado): {lottery_id, concurso?} → analisa apenas as apostas do próprio user
//   2) Service key (x-service-key): {lottery_id, concurso?} → fan-out para TODOS os usuários com apostas
//
// Idempotência: usa tag `results-{lottery}-{concurso}-{user}` — send-push agrupa por tag no SW.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-service-key",
};

// Faixas premiadas por loteria (min hits para ser considerado prêmio relevante)
const PRIZE_THRESHOLDS: Record<string, { min: number; name: string; emojiTiers: Record<number, string> }> = {
  megasena:   { min: 4,  name: "Mega-Sena",  emojiTiers: { 4: "🎯", 5: "🏆", 6: "💰👑" } },
  lotofacil:  { min: 11, name: "Lotofácil",  emojiTiers: { 11: "🎯", 12: "🥉", 13: "🥈", 14: "🥇", 15: "💰👑" } },
  quina:      { min: 2,  name: "Quina",      emojiTiers: { 2: "🎯", 3: "🥉", 4: "🥇", 5: "💰👑" } },
  lotomania:  { min: 15, name: "Lotomania",  emojiTiers: { 15: "🎯", 16: "🥉", 17: "🥈", 18: "🥇", 19: "🏆", 20: "💰👑" } },
  duplasena:  { min: 3,  name: "Dupla Sena", emojiTiers: { 3: "🎯", 4: "🥉", 5: "🥇", 6: "💰👑" } },
  timemania:  { min: 3,  name: "Timemania",  emojiTiers: { 3: "🎯", 4: "🥉", 5: "🥈", 6: "🥇", 7: "💰👑" } },
  diadesorte: { min: 4,  name: "Dia de Sorte", emojiTiers: { 4: "🎯", 5: "🥉", 6: "🥇", 7: "💰👑" } },
  supersete:  { min: 3,  name: "Super Sete", emojiTiers: { 3: "🎯", 4: "🥉", 5: "🥈", 6: "🥇", 7: "💰👑" } },
};

async function firePush(
  supabaseUrl: string,
  serviceRole: string,
  userId: string,
  title: string,
  body: string,
  url: string,
  tag: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-key": serviceRole,
        Authorization: `Bearer ${serviceRole}`,
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        url,
        category: "results",
        tag,
      }),
    });
    return res.ok;
  } catch (_e) {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);

    const body = await req.json().catch(() => ({}));
    const lotteryId = body?.lottery_id as string | undefined;
    let concurso = body?.concurso as number | undefined;

    if (!lotteryId || !PRIZE_THRESHOLDS[lotteryId]) {
      return new Response(JSON.stringify({ error: "invalid lottery_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determina escopo (self vs service)
    const serviceKeyHeader = req.headers.get("x-service-key");
    const isService = serviceKeyHeader && serviceKeyHeader === serviceRole;
    let scopedUserId: string | null = null;

    if (!isService) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const anonClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await anonClient.auth.getClaims(token);
      if (error || !data?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      scopedUserId = data.claims.sub as string;
    }

    // Busca o sorteio-alvo
    let drawQuery = admin
      .from("lottery_draws")
      .select("concurso, numbers, draw_date")
      .eq("lottery_id", lotteryId);
    if (concurso) drawQuery = drawQuery.eq("concurso", concurso);
    else drawQuery = drawQuery.order("concurso", { ascending: false }).limit(1);

    const { data: drawRows, error: drawErr } = await drawQuery;
    if (drawErr) throw drawErr;
    const draw = drawRows?.[0];
    if (!draw) {
      return new Response(JSON.stringify({ error: "draw not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    concurso = draw.concurso;
    const drawSet = new Set<number>(draw.numbers as number[]);

    // Busca apostas
    let betsQuery = admin
      .from("saved_bets")
      .select("id, user_id, numbers, label, created_at")
      .eq("lottery_id", lotteryId);
    if (scopedUserId) betsQuery = betsQuery.eq("user_id", scopedUserId);

    // Só apostas registradas ANTES do sorteio (evita pós-verificação sem sentido)
    if (draw.draw_date) {
      betsQuery = betsQuery.lte("created_at", `${draw.draw_date}T23:59:59`);
    }

    const { data: bets, error: betsErr } = await betsQuery;
    if (betsErr) throw betsErr;

    if (!bets || bets.length === 0) {
      return new Response(JSON.stringify({ ok: true, concurso, checked: 0, pushed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const info = PRIZE_THRESHOLDS[lotteryId];

    // Agrupa por usuário
    const byUser = new Map<string, { hits: number; best: number; totalWinners: number; games: number; bestLabel?: string }>();
    for (const bet of bets) {
      const nums = (bet.numbers || []) as number[];
      const hits = nums.filter((n) => drawSet.has(n)).length;
      const entry = byUser.get(bet.user_id) || { hits: 0, best: 0, totalWinners: 0, games: 0 };
      entry.games += 1;
      if (hits > entry.best) {
        entry.best = hits;
        entry.bestLabel = bet.label || undefined;
      }
      if (hits >= info.min) entry.totalWinners += 1;
      byUser.set(bet.user_id, entry);
    }

    let pushed = 0;
    for (const [userId, entry] of byUser) {
      if (entry.best < info.min) continue; // sem prêmio → não notifica
      const emoji = info.emojiTiers[entry.best] || "🎯";
      const title = `${info.name} #${concurso}: ${entry.best} acertos! ${emoji}`;
      const winnersStr = entry.totalWinners > 1
        ? ` Você tem ${entry.totalWinners} apostas premiadas.`
        : "";
      const labelStr = entry.bestLabel ? ` (${entry.bestLabel})` : "";
      const bodyText = `Seu melhor jogo${labelStr} acertou ${entry.best} números.${winnersStr} Confira o detalhamento e o prêmio estimado.`;
      const tag = `results-${lotteryId}-${concurso}-${userId}`;
      const ok = await firePush(
        supabaseUrl,
        serviceRole,
        userId,
        title,
        bodyText,
        `/jogos-salvos?lottery=${lotteryId}`,
        tag,
      );
      if (ok) pushed++;
    }

    return new Response(
      JSON.stringify({ ok: true, concurso, checked: bets.length, users: byUser.size, pushed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[notify-bet-results] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
