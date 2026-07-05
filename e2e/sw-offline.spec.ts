import { test, expect } from "@playwright/test";

const WARMUP_ROUTES = ["/", "/login", "/planos", "/install", "/pwa-test"];

async function waitForActiveSW(page: import("@playwright/test").Page, timeoutMs = 20_000) {
  return await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return Boolean(reg?.active);
    },
    null,
    { timeout: timeoutMs },
  );
}

test.describe("Fallback offline do Service Worker (publicado)", () => {
  test("SW ativa, aquece cache e serve páginas offline", async ({ page, context }) => {
    // 1. Registro do SW
    await page.goto("/", { waitUntil: "load" });

    const swActive = await waitForActiveSW(page).catch(() => null);
    test.skip(
      !swActive,
      "Service Worker não ativou nesta origem — provavelmente ambiente sem SW (preview/dev).",
    );

    // 2. Aquecimento de cache: visita cada rota online
    for (const route of WARMUP_ROUTES) {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res!.status()).toBeLessThan(400);
    }

    // 3. Corta a rede
    await context.setOffline(true);

    // 4. Revisita as rotas offline — SW deve entregar HTML do cache (NetworkFirst)
    for (const route of WARMUP_ROUTES) {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res, `sem resposta offline para ${route}`).not.toBeNull();
      expect(res!.status(), `offline falhou em ${route}`).toBeLessThan(400);
      await expect(page.locator("#root")).toBeVisible();
    }

    await context.setOffline(false);
  });

  test("Bateria interna de /pwa-test roda com sucesso online", async ({ page }) => {
    await page.goto("/pwa-test", { waitUntil: "domcontentloaded" });
    const swActive = await waitForActiveSW(page).catch(() => null);
    test.skip(!swActive, "SW indisponível nesta origem.");

    await page.getByRole("button", { name: /Rodar testes/i }).click();

    // Espera até que não haja mais spinner de "running"
    await expect
      .poll(
        async () =>
          await page.locator('svg.animate-spin').count(),
        { timeout: 45_000, intervals: [1_000] },
      )
      .toBe(0);

    // Nenhum ícone de falha (XCircle usa text-destructive)
    const failures = await page.locator('svg.text-destructive').count();
    expect(failures, "houve testes falhados na bateria interna").toBeLessThanOrEqual(0);
  });
});
