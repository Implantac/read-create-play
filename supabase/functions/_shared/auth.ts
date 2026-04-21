import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Validate the Authorization header on an incoming request and return the user ID.
 * Returns null when the request is unauthenticated or the token is invalid.
 */
export async function requireUser(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;

  // Check if user is blocked
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("blocked")
    .eq("id", data.user.id)
    .single();

  if (profileError || profile?.blocked) {
    console.log(`User ${data.user.id} is blocked or profile not found.`);
    return null;
  }

  return { userId: data.user.id };
}

export function unauthorizedResponse(corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
