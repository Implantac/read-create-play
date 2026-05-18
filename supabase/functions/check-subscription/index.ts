import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_UE7roMlQFnRldw": "premium",
  "prod_UE7sbRkUnU7ISi": "professional",
  "prod_UE81WPrPw7pexN": "lifetime",
};

const LIFETIME_PRICE_ID = "price_1TFflFCzGT9FnNQpKT7INteS";
const FULL_ACCESS_EMAIL = "etcsuporte889@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    if (user.email.trim().toLowerCase() === FULL_ACCESS_EMAIL) {
      await supabaseClient
        .from("profiles")
        .update({ plan: "lifetime", blocked: false })
        .eq("id", user.id);

      await supabaseClient
        .from("user_roles")
        .upsert({ user_id: user.id, role: "super_admin" }, { onConflict: "user_id,role" });

      return new Response(JSON.stringify({ plan: "lifetime", subscribed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      // Update profile to free
      await supabaseClient.from("profiles").update({ plan: "free" }).eq("id", user.id);
      return new Response(JSON.stringify({ plan: "free", subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
    });

    let detectedPlan = "free";
    let subscriptionEnd: string | null = null;

    if (subscriptions.data.length > 0) {
      // Find the highest tier subscription
      for (const sub of subscriptions.data) {
        const productId = sub.items.data[0].price.product as string;
        const plan = PRODUCT_TO_PLAN[productId];
        if (plan === "professional" || (plan === "premium" && detectedPlan === "free")) {
          detectedPlan = plan;
          subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        }
      }
    }

    // Check for lifetime purchase (one-time payment)
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

    // Update profile plan
    await supabaseClient.from("profiles").update({ plan: detectedPlan }).eq("id", user.id);

    return new Response(JSON.stringify({
      plan: detectedPlan,
      subscribed: detectedPlan !== "free",
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
