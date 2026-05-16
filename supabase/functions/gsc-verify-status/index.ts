import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SITE_URL = "https://titanloterias.lovable.app/";
const VERIFICATION_TOKEN = "4c5tRnYC8AZ3jyzDB8G9bgYBd0ZTg3rpbfD9EVBJ6zI";
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const gscKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');

    // Step 1: Check if tag is visible in public HTML
    let tagDetected = false;
    let deployReady = false;
    try {
      const htmlRes = await fetch(SITE_URL, { headers: { 'Cache-Control': 'no-cache' } });
      const html = await htmlRes.text();
      tagDetected = html.includes(VERIFICATION_TOKEN);
      deployReady = htmlRes.ok;
    } catch (err) {
      console.error("HTML fetch failed:", err);
    }

    if (!deployReady) {
      return respond({
        status: "pending",
        stage: "deploy",
        message: "Aguardando deploy do site.",
        tagDetected: false,
        verifiedByGoogle: false,
      });
    }

    if (!tagDetected) {
      return respond({
        status: "pending",
        stage: "propagation",
        message: "Tag ainda não visível no HTML público (cache de CDN/deploy em progresso).",
        tagDetected: false,
        verifiedByGoogle: false,
      });
    }

    // Step 2: Tag is visible — check Google's verification status
    if (!lovableApiKey || !gscKey) {
      return respond({
        status: "processing",
        stage: "google",
        message: "Tag detectada. Conector do Google indisponível para validação final.",
        tagDetected: true,
        verifiedByGoogle: false,
      });
    }

    const siteEncoded = encodeURIComponent(SITE_URL);
    const sitesRes = await fetch(`${GATEWAY}/webmasters/v3/sites/${siteEncoded}`, {
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'X-Connection-Api-Key': gscKey,
      },
    });

    let permissionLevel: string | null = null;
    if (sitesRes.ok) {
      const data = await sitesRes.json();
      permissionLevel = data.permissionLevel ?? null;
    }

    const verifiedByGoogle = permissionLevel && permissionLevel !== "siteUnverifiedUser";

    if (verifiedByGoogle) {
      return respond({
        status: "verified",
        stage: "complete",
        message: "Propriedade verificada com sucesso pelo Google.",
        tagDetected: true,
        verifiedByGoogle: true,
        permissionLevel,
      });
    }

    // Step 3: Try to trigger verification on Google's side now that tag is live
    const verifyRes = await fetch(
      `${GATEWAY}/siteVerification/v1/webResource?verificationMethod=META`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'X-Connection-Api-Key': gscKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          site: { identifier: SITE_URL, type: "SITE" },
        }),
      }
    );

    if (verifyRes.ok) {
      return respond({
        status: "verified",
        stage: "complete",
        message: "Propriedade acabou de ser verificada pelo Google.",
        tagDetected: true,
        verifiedByGoogle: true,
      });
    }

    const errBody = await verifyRes.text();
    return respond({
      status: "processing",
      stage: "google",
      message: "Tag detectada localmente; aguardando rastreador do Google ler a tag.",
      tagDetected: true,
      verifiedByGoogle: false,
      googleStatus: verifyRes.status,
      googleError: errBody.slice(0, 300),
    });
  } catch (error) {
    console.error("Erro:", error);
    return respond({
      status: "error",
      message: error instanceof Error ? error.message : "Erro desconhecido",
    }, 500);
  }
});
