import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { requireUserAuth, corsHeaders } from "../_shared/auth.ts";

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_UE7roMlQFnRldw": "premium",
  "prod_UE7sbRkUnU7ISi": "professional",
  "prod_UE81WPrPw7pexN": "lifetime",
};

const LIFETIME_PRICE_ID = "price_1TFflFCzGT9FnNQpKT7INteS";
const FULL_ACCESS_EMAILS = new Set([
  "etcsuporte889@gmail.com",
]);

function isFullAccessEmail(email: string | null) {
  return email ? FULL_ACCESS_EMAILS.has(email.toLowerCase()) : false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireUserAuth(req);
  if (auth instanceof Response) return auth;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    if (isFullAccessEmail(auth.email)) {
      await supabaseClient
        .from("profiles")
        .update({ plan: "lifetime", blocked: false })
        .eq("id", auth.userId);

      await supabaseClient
        .from("user_roles")
        .upsert({ user_id: auth.userId, role: "super_admin" }, { onConflict: "user_id,role" });

      return new Response(JSON.stringify({ plan: "lifetime", subscribed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (auth.isAdmin) {
      return new Response(JSON.stringify({ plan: auth.plan, subscribed: auth.plan !== "free" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: auth.email!, limit: 1 });

    if (customers.data.length === 0) {
      await supabaseClient.from("profiles").update({ plan: "free" }).eq("id", auth.userId);
      return new Response(JSON.stringify({ plan: "free", subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    let detectedPlan = "free";
    let subscriptionEnd: string | null = null;

    if (subscriptions.data.length > 0) {
      for (const sub of subscriptions.data) {
        const productId = sub.items.data[0].price.product as string;
        const plan = PRODUCT_TO_PLAN[productId];
        if (plan === "professional" || (plan === "premium" && detectedPlan === "free")) {
          detectedPlan = plan;
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        }
      }
    }

    if (detectedPlan !== "professional") {
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 100,
      });
      for (const session of sessions.data) {
        if (session.payment_status === "paid" && session.mode === "payment") {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          for (const item of lineItems.data) {
            if (item.price?.id === LIFETIME_PRICE_ID) {
              detectedPlan = "lifetime";
              break;
            }
          }
        }
        if (detectedPlan === "lifetime") break;
      }
    }

    await supabaseClient.from("profiles").update({ plan: detectedPlan }).eq("id", auth.userId);

    return new Response(JSON.stringify({
      plan: detectedPlan,
      subscribed: detectedPlan !== "free",
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-subscription error:", error);
    return new Response(JSON.stringify({ error: "Unable to verify subscription" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
