import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

async function hashPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function getCachedAnalysis(
  supabase: any,
  lotteryId: string,
  functionName: string,
  inputData: any,
  ttlHours = 6
): Promise<any | null> {
  const cacheKey = await hashPayload(JSON.stringify(inputData));

  const { data } = await supabase
    .from("ai_analysis_cache")
    .select("result, expires_at")
    .eq("lottery_id", lotteryId)
    .eq("function_name", functionName)
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (data) {
    console.log(`Cache HIT for ${functionName}/${lotteryId}`);
    return data.result;
  }
  console.log(`Cache MISS for ${functionName}/${lotteryId}`);
  return null;
}

export async function setCachedAnalysis(
  supabase: any,
  lotteryId: string,
  functionName: string,
  inputData: any,
  result: any,
  ttlHours = 6
): Promise<void> {
  const cacheKey = await hashPayload(JSON.stringify(inputData));
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  await supabase
    .from("ai_analysis_cache")
    .upsert({
      lottery_id: lotteryId,
      function_name: functionName,
      cache_key: cacheKey,
      result,
      expires_at: expiresAt,
    }, { onConflict: "lottery_id,function_name,cache_key" });
}
