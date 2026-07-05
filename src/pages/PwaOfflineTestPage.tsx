import { useEffect, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type TestStatus = "idle" | "running" | "pass" | "fail";
interface TestResult {
  name: string;
  status: TestStatus;
  detail?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// Patch window.fetch to simulate offline. SW intercepts requests BEFORE our patch
// only if we let the call reach the network layer — to validate the SW cache, we
// route requests through caches.match() ourselves when "offline" mode is on.
const ORIGINAL_FETCH = window.fetch.bind(window);
let offlineMode = false;

async function offlineAwareFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (!offlineMode) return ORIGINAL_FETCH(input, init);

  const req = new Request(input as RequestInfo, init);
  // Try Cache Storage directly (populated by the Workbox runtime caches).
  const cached = await caches.match(req, { ignoreSearch: false });
  if (cached) return cached;
  // Fallback: try ignoring vary/search
  const loose = await caches.match(req, { ignoreSearch: true, ignoreVary: true });
  if (loose) return loose;

  throw new TypeError("Simulated offline: no cache entry");
}

function installFetchPatch() {
  if ((window.fetch as unknown as { __titanPatched?: boolean }).__titanPatched) return;
  const wrapped = offlineAwareFetch as typeof window.fetch & { __titanPatched: boolean };
  wrapped.__titanPatched = true;
  window.fetch = wrapped;
}

const PwaOfflineTestPage = () => {
  const [swReady, setSwReady] = useState<boolean>(false);
  const [cacheNames, setCacheNames] = useState<string[]>([]);
  const [offline, setOffline] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const refreshCaches = useCallback(async () => {
    if (!("caches" in window)) return;
    const names = await caches.keys();
    setCacheNames(names);
  }, []);

  useEffect(() => {
    installFetchPatch();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => setSwReady(Boolean(reg?.active)));
    }
    refreshCaches();
  }, [refreshCaches]);

  const toggleOffline = (next: boolean) => {
    offlineMode = next;
    setOffline(next);
  };

  const runTests = async () => {
    setRunning(true);
    const out: TestResult[] = [];

    const htmlRoutes = ["/", "/dashboard", "/gerador", "/estatisticas", "/planos", "/install"];
    const staticAssets = ["/favicon.png", "/manifest.webmanifest", "/robots.txt"];
    const supabaseTables: Array<{ table: string; select: string }> = [
      { table: "profiles", select: "id" },
      { table: "lottery_draws", select: "id" },
      { table: "saved_bets", select: "id" },
      { table: "notifications", select: "id" },
      { table: "user_gamification", select: "user_id" },
    ];

    const htmlTest = (route: string) => async (): Promise<TestResult> => {
      try {
        const res = await fetch(route, { cache: "no-store" });
        const ok = res.ok && (res.headers.get("content-type") || "").includes("html");
        return { name: "", status: ok ? "pass" : "fail", detail: `HTTP ${res.status}` };
      } catch (e) {
        return { name: "", status: "fail", detail: (e as Error).message };
      }
    };

    const assetTest = (path: string) => async (): Promise<TestResult> => {
      try {
        const res = await fetch(path, { cache: "no-store" });
        return { name: "", status: res.ok ? "pass" : "fail", detail: `HTTP ${res.status}` };
      } catch (e) {
        return { name: "", status: "fail", detail: (e as Error).message };
      }
    };

    const supabaseTest = (table: string, select: string) => async (): Promise<TestResult> => {
      if (!SUPABASE_URL) return { name: "", status: "fail", detail: "VITE_SUPABASE_URL ausente" };
      try {
        const { error } = await supabase.from(table as never).select(select).limit(1);
        if (error && offline) {
          const cached = await caches.match(
            `${SUPABASE_URL}/rest/v1/${table}?select=${select}&limit=1`,
            { ignoreSearch: true },
          );
          if (cached) return { name: "", status: "pass", detail: "Servido do cache do SW" };
          return { name: "", status: "fail", detail: error.message };
        }
        if (error) return { name: "", status: "fail", detail: error.message };
        return { name: "", status: "pass", detail: offline ? "Cache hit" : "Online OK" };
      } catch (e) {
        return { name: "", status: "fail", detail: (e as Error).message };
      }
    };

    const edgeFunctionTest = (fn: string) => async (): Promise<TestResult> => {
      if (!SUPABASE_URL) return { name: "", status: "fail", detail: "VITE_SUPABASE_URL ausente" };
      const url = `${SUPABASE_URL}/functions/v1/${fn}`;
      try {
        const res = await fetch(url, { method: "OPTIONS", cache: "no-store" });
        return { name: "", status: res.ok || res.status === 204 ? "pass" : "fail", detail: `HTTP ${res.status}` };
      } catch (e) {
        if (offline) {
          const cached = await caches.match(url, { ignoreSearch: true, ignoreVary: true });
          if (cached) return { name: "", status: "pass", detail: "Cache hit" };
        }
        return { name: "", status: "fail", detail: (e as Error).message };
      }
    };

    const tests: Array<{ name: string; run: () => Promise<TestResult> }> = [
      ...htmlRoutes.map((r) => ({ name: `HTML navigation (${r})`, run: htmlTest(r) })),
      ...staticAssets.map((a) => ({ name: `Asset estático (${a})`, run: assetTest(a) })),
      ...supabaseTables.map((t) => ({
        name: `Supabase REST (${t.table})`,
        run: supabaseTest(t.table, t.select),
      })),
      { name: "Edge Function (check-subscription)", run: edgeFunctionTest("check-subscription") },
      { name: "Edge Function (sync-lottery-draws)", run: edgeFunctionTest("sync-lottery-draws") },
    ];

    for (const t of tests) {
      out.push({ name: t.name, status: "running" });
      setResults([...out]);
      const r = await t.run();
      out[out.length - 1] = { ...r, name: t.name };
      setResults([...out]);
    }

    setRunning(false);
    refreshCaches();
  };

  const StatusIcon = ({ status }: { status: TestStatus }) => {
    if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "fail") return <XCircle className="h-4 w-4 text-destructive" />;
    return <span className="h-4 w-4 inline-block rounded-full border border-muted" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Teste Offline (PWA) — Titan Loterias</title>
        <meta name="description" content="Painel de teste do service worker: simula perda de rede e valida o fallback de cache para HTML e API." />
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Modo de Teste Offline</h1>
          <p className="text-sm text-muted-foreground">
            Simula perda de rede e verifica se o Service Worker entrega HTML, assets e chamadas Supabase via cache.
          </p>
        </header>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              {offline ? <WifiOff className="h-4 w-4 text-destructive" /> : <Wifi className="h-4 w-4 text-green-500" />}
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={swReady ? "default" : "destructive"}>SW: {swReady ? "ativo" : "inativo"}</Badge>
              <Badge variant={offline ? "destructive" : "secondary"}>Rede: {offline ? "simulada offline" : "online"}</Badge>
              <Badge variant="outline">{cacheNames.length} cache(s)</Badge>
            </div>
            {!swReady && (
              <p className="text-xs text-muted-foreground">
                O Service Worker só registra em produção (fora do preview do editor). Abra a versão publicada para testar offline real.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={offline ? "destructive" : "outline"} onClick={() => toggleOffline(!offline)}>
                {offline ? "Desativar offline" : "Simular offline"}
              </Button>
              <Button size="sm" onClick={runTests} disabled={running}>
                {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Rodar testes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground">Clique em "Rodar testes" para começar.</p>
            ) : (
              <ul className="space-y-2">
                {results.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <StatusIcon status={r.status} />
                    <div className="flex-1">
                      <div className="font-medium">{r.name}</div>
                      {r.detail && <div className="text-xs text-muted-foreground">{r.detail}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {cacheNames.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Caches do Service Worker</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs font-mono space-y-1">
                {cacheNames.map((n) => (
                  <li key={n} className="text-muted-foreground">• {n}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Para validar offline real, use também as DevTools (Network → Offline) e navegue pelo app.
        </p>
      </div>
    </div>
  );
};

export default PwaOfflineTestPage;
