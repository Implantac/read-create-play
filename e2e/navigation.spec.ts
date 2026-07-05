import { test, expect } from "@playwright/test";

const ROUTES = ["/", "/login", "/planos", "/install", "/pwa-test"];

test.describe("Navegação entre múltiplas páginas (publicado)", () => {
  for (const route of ROUTES) {
    test(`carrega ${route} com HTML válido`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res, `sem resposta para ${route}`).not.toBeNull();
      expect(res!.status(), `HTTP inesperado em ${route}`).toBeLessThan(400);

      const ct = res!.headers()["content-type"] || "";
      expect(ct).toContain("html");

      // SPA React deve montar o root
      await expect(page.locator("#root")).toBeVisible();
      await expect(page).toHaveTitle(/.+/);
    });
  }

  test("navegação client-side sequencial mantém a SPA viva", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    for (const route of ROUTES.slice(1)) {
      await page.evaluate((r) => window.history.pushState({}, "", r), route);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("#root")).toBeVisible();
    }
  });
});
