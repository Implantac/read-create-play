import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  userId: string;
  email: string | null;
  plan: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function unauthorized(message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function forbidden(message = "Forbidden") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const FULL_ACCESS_EMAILS = new Set(["etcsuporte889@gmail.com"]);

function isFullAccessEmail(email: string | null) {
  return email ? FULL_ACCESS_EMAILS.has(email.toLowerCase()) : false;
}

/**
 * Verifies the JWT from the request and optionally checks plan/admin gating.
 * Returns a Response on failure (caller should return it directly) or AuthResult on success.
 */
export async function requireUserAuth(
  req: Request,
  opts: { requireAdmin?: boolean; allowedPlans?: string[] } = {}
): Promise<AuthResult | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized("Missing authorization");

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return unauthorized("Invalid token");

  const userId = userData.user.id;
  const email = userData.user.email ?? null;
  const isFullAccessUser = isFullAccessEmail(email);

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("plan, blocked").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  if (profile?.blocked && !isFullAccessUser) return forbidden("Account suspended");

  const roleList = (roles ?? []).map((r: any) => r.role as string);
  const isSuperAdmin = isFullAccessUser || roleList.includes("super_admin");
  const isAdmin = isFullAccessUser || roleList.includes("admin") || isSuperAdmin;
  const plan = isFullAccessUser ? "lifetime" : profile?.plan ?? "free";

  if (opts.requireAdmin && !isAdmin) return forbidden("Admin only");

  if (opts.allowedPlans && !isAdmin && !opts.allowedPlans.includes(plan)) {
    return forbidden("Plan upgrade required");
  }

  return { userId, email, plan, isAdmin, isSuperAdmin };
}
