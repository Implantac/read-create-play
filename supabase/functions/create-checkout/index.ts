import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_PRICES: Record<string, { price_id: string; mode: "subscription" | "payment" }> = {
  premium: { price_id: "price_1TFfc9CzGT9FnNQptfREBkbH", mode: "subscription" },
  premium_annual: { price_id: "price_1TFl8yCzGT9FnNQpAJCMX3vY", mode: "subscription" },
  professional: { price_id: "price_1TFfckCzGT9FnNQp2uEvf3iM", mode: "subscription" },
  professional_annual: { price_id: "price_1TFlIkCzGT9FnNQpi4eSk938", mode: "subscription" },
  lifetime: { price_id: "price_1TFflFCzGT9FnNQpKT7INteS", mode: "payment" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { planId } = await req.json();
    const planConfig = PLAN_PRICES[planId];
    if (!planConfig) throw new Error(`Invalid plan: ${planId}`);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: planConfig.price_id, quantity: 1 }],
      mode: planConfig.mode,
      success_url: `${req.headers.get("origin")}/payment-success?plan=${planId}`,
      cancel_url: `${req.headers.get("origin")}/planos`,
      metadata: { user_id: user.id, plan_id: planId },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
