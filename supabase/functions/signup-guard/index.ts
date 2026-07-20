// Signup guard: limita 1 conta gratuita por IP para evitar abuso.
// Retorna { allowed: boolean, reason?: string }.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FREE_ACCOUNTS_PER_IP = 1;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for") || "";
  const first = xf.split(",")[0]?.trim();
  return (
    first ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { email, mode = "check", userId } = await req.json().catch(() => ({}));

    if (!email || typeof email !== "string" || email.length > 255) {
      return new Response(JSON.stringify({ allowed: false, reason: "invalid_email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = getClientIp(req);
    const salt = Deno.env.get("SUPABASE_URL") ?? "titan-salt";
    const ipHash = await sha256(`${salt}::${ip}`);
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Se IP é desconhecido, não conseguimos aplicar a regra — libera para não travar usuários legítimos.
    if (ip === "unknown") {
      return new Response(JSON.stringify({ allowed: true, degraded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "register") {
      await supabase.from("signup_ip_registry").insert({
        ip_hash: ipHash,
        email: email.toLowerCase(),
        user_id: userId ?? null,
        user_agent: userAgent,
      });
      return new Response(JSON.stringify({ allowed: true, registered: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Modo "check": conta contas gratuitas já registradas para este IP.
    const { count, error } = await supabase
      .from("signup_ip_registry")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash);

    if (error) {
      console.error("signup-guard count error", error);
      // Em caso de falha do storage, libera para não bloquear cadastro legítimo.
      return new Response(JSON.stringify({ allowed: true, degraded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((count ?? 0) >= FREE_ACCOUNTS_PER_IP) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "ip_limit_reached",
          message:
            "Detectamos que já existe uma conta gratuita criada a partir desta conexão. Para acesso adicional, use o plano vitalício ou entre em contato com o suporte.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pré-registra imediatamente para evitar corrida (dois signups simultâneos do mesmo IP).
    await supabase.from("signup_ip_registry").insert({
      ip_hash: ipHash,
      email: email.toLowerCase(),
      user_agent: userAgent,
    });

    return new Response(JSON.stringify({ allowed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("signup-guard error", e);
    return new Response(JSON.stringify({ allowed: true, degraded: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
