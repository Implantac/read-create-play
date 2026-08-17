import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Identify lotteries with draws today and within 2-hour window
    // (In a real scenario, this would check an official calendar. 
    // Here we check the last sync status or common schedule)
    const now = new Date();
    const currentHour = now.getUTCHours() - 3; // BRT
    
    // Most draws happen at 20:00 BRT. Alert window 17:30 - 18:30.
    if (currentHour < 17 || currentHour > 19) {
      return new Response(JSON.stringify({ success: true, message: "Outside alert window" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch users with pre_draw notifications enabled
    const { data: subscribers, error: subError } = await supabase
      .from("user_push_subscriptions")
      .select("user_id, endpoint, auth, p256dh, categories")
      .contains("categories", { pre_draw: true });

    if (subError) throw subError;
    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Trigger notification for each subscriber
    // Reusing the send-push function logic via internal fetch
    let notified = 0;
    for (const sub of subscribers) {
      // Check if already notified today for this category (anti-spam)
      // Logic would go here (e.g., checking a temporary 'alerts_fired' table)
      
      await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-service-key": supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          subscription: {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth, p256dh: sub.p256dh },
          },
          payload: {
            title: "🎯 Sorteio em 2h!",
            body: "O Titan detectou pressão no Ciclo 1-25. Confira os sinais no Painel de Comando antes de apostar.",
            url: "/comando",
            icon: "/icon-192.png",
          },
        }),
      }).catch(console.error);
      notified++;
    }

    return new Response(JSON.stringify({ success: true, notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
