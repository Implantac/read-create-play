// Titan Loterias - Send Push Edge Function
// Sends Web Push notifications via VAPID to a user's registered subscriptions.
// Body: { test?: boolean, user_id?: string, title?, body?, url?, category?, tag?, image? }
// Auth:
//   - When called by a signed-in user with test=true or no user_id → sends to caller
//   - When called with x-service-key = SUPABASE_SERVICE_ROLE_KEY → fan-out to user_id
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-service-key",
};

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:etcsuporte889@gmail.com";
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

type Body = {
  test?: boolean;
  user_id?: string;
  title?: string;
  body?: string;
  url?: string;
  category?: "draws" | "results" | "closings" | "system";
  tag?: string;
  image?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload: Body = await req.json().catch(() => ({}));
    const serviceKeyHeader = req.headers.get("x-service-key");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const admin = createClient(supabaseUrl, serviceRole);

    let targetUserId: string | null = null;

    if (serviceKeyHeader && serviceKeyHeader === serviceRole && payload.user_id) {
      targetUserId = payload.user_id;
    } else {
      // Authenticated caller path
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await anonClient.auth.getClaims(token);
      if (error || !data?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = data.claims.sub as string;
    }

    const category = payload.category || "system";
    const notif = payload.test
      ? {
          title: "Titan Loterias 🎯",
          body: "Notificações push ativas! Você receberá alertas de sorteios e fechamentos.",
          url: "/dashboard",
          category: "system",
          tag: "test",
        }
      : {
          title: payload.title || "Titan Loterias",
          body: payload.body || "",
          url: payload.url || "/dashboard",
          category,
          tag: payload.tag,
          image: payload.image,
        };

    const { data: subs, error: subsErr } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, categories, enabled")
      .eq("user_id", targetUserId!)
      .eq("enabled", true);

    if (subsErr) throw subsErr;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let removed = 0;
    for (const s of subs) {
      const cats = (s.categories || {}) as Record<string, boolean>;
      if (cats[notif.category] === false) continue;
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(notif),
          { TTL: 60 * 60 * 12 }
        );
        sent++;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
          removed++;
        } else {
          console.error("[send-push] failed", status, err?.body);
        }
      }
    }

    return new Response(JSON.stringify({ sent, removed, total: subs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[send-push] error", e);
    return new Response(JSON.stringify({ error: e?.message || "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
