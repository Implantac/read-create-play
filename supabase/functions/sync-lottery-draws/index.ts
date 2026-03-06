import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_BASE = "https://loteriascaixa-api.herokuapp.com/api";

const LOTTERIES = [
  { id: "megasena", apiName: "megasena" },
  { id: "lotofacil", apiName: "lotofacil" },
  { id: "quina", apiName: "quina" },
  { id: "lotomania", apiName: "lotomania" },
  { id: "duplasena", apiName: "duplasena" },
  { id: "timemania", apiName: "timemania" },
  { id: "diadesorte", apiName: "diadesorte" },
  { id: "supersete", apiName: "supersete" },
];

interface CaixaResult {
  concurso: number;
  data?: string;
  dezenas?: string[];
  listaDezenas?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const targetLottery = body.lottery_id || null; // null = all
    const fromConcurso = body.from_concurso || 1;
    const toConcurso = body.to_concurso || null;

    const lotteriesFilter = targetLottery
      ? LOTTERIES.filter((l) => l.id === targetLottery)
      : LOTTERIES;

    const results: { lottery: string; inserted: number; errors: number; latest: number }[] = [];

    for (const lottery of lotteriesFilter) {
      let inserted = 0;
      let errors = 0;
      let latestConcurso = 0;

      try {
        // Get latest concurso from API
        const latestRes = await fetch(`${API_BASE}/${lottery.apiName}/latest`);
        if (!latestRes.ok) {
          console.error(`Failed to fetch latest for ${lottery.id}: ${latestRes.status}`);
          results.push({ lottery: lottery.id, inserted: 0, errors: 1, latest: 0 });
          continue;
        }
        const latestData: CaixaResult = await latestRes.json();
        latestConcurso = latestData.concurso;

        // Get what we already have
        const { data: existing } = await supabase
          .from("lottery_draws")
          .select("concurso")
          .eq("lottery_id", lottery.id)
          .order("concurso", { ascending: false })
          .limit(1);

        const lastStored = existing?.[0]?.concurso || 0;
        const startFrom = Math.max(fromConcurso, lastStored + 1);
        const endAt = toConcurso || latestConcurso;

        if (startFrom > endAt) {
          console.log(`${lottery.id}: already up to date (${lastStored})`);
          results.push({ lottery: lottery.id, inserted: 0, errors: 0, latest: lastStored });
          continue;
        }

        console.log(`${lottery.id}: fetching ${startFrom} to ${endAt}`);

        // Fetch in batches of 10
        const batchSize = 10;
        for (let batch = startFrom; batch <= endAt; batch += batchSize) {
          const promises: Promise<any>[] = [];
          for (let c = batch; c < Math.min(batch + batchSize, endAt + 1); c++) {
            promises.push(
              fetch(`${API_BASE}/${lottery.apiName}/${c}`)
                .then((r) => (r.ok ? r.json() : null))
                .catch(() => null)
            );
          }

          const batchResults = await Promise.all(promises);

          const rows = batchResults
            .filter((r): r is CaixaResult => r !== null && r.concurso)
            .map((r) => {
              const dezenas = r.dezenas || r.listaDezenas || [];
              return {
                lottery_id: lottery.id,
                concurso: r.concurso,
                draw_date: r.data || null,
                numbers: dezenas.map((d: string) => parseInt(d, 10)).filter((n: number) => !isNaN(n)),
              };
            })
            .filter((r) => r.numbers.length > 0);

          if (rows.length > 0) {
            const { error } = await supabase
              .from("lottery_draws")
              .upsert(rows, { onConflict: "lottery_id,concurso" });

            if (error) {
              console.error(`Insert error for ${lottery.id}:`, error);
              errors += rows.length;
            } else {
              inserted += rows.length;
            }
          }

          // Small delay between batches
          await new Promise((r) => setTimeout(r, 150));
        }
      } catch (e) {
        console.error(`Error syncing ${lottery.id}:`, e);
        errors++;
      }

      results.push({ lottery: lottery.id, inserted, errors, latest: latestConcurso });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Sync error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
