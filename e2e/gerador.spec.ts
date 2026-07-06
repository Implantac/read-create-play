import { test, expect } from "@playwright/test";

/**
 * E2E: gera uma aposta pelo fluxo do /gerador e valida os resultados na UI.
 *
 * Pré-requisitos (via env):
 *   E2E_TEST_EMAIL     — e-mail de uma conta válida na base
 *   E2E_TEST_PASSWORD  — senha correspondente
 *
 * Sem essas variáveis o teste é ignorado (evita quebrar CI sem credenciais).
 */

const EMAIL = process.env.E2E_TEST_EMAIL;
const PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("Gerador de apostas — fluxo E2E", () => {
  test.skip(!EMAIL || !PASSWORD, "Defina E2E_TEST_EMAIL e E2E_TEST_PASSWORD para rodar este cenário");

  test("gera jogos e exibe bolas + score na interface", async ({ page }) => {
    // 1. Login por e-mail/senha
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(EMAIL!);
    await page.locator('input[type="password"]').fill(PASSWORD!);
    await page.getByRole("button", { name: /^Entrar$/ }).click();

    // Sessão autenticada deixa a home acessível
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });

    // 2. Vai para o gerador
    await page.goto("/gerador", { waitUntil: "domcontentloaded" });

    // Etapa 01 → 02: Configurar Engine
    await page.getByRole("button", { name: /Configurar Engine/i }).click();

    // Etapa 02 → 03: escolher a primeira estratégia da grade avança automaticamente
    const strategyButtons = page.locator('button:has-text("Configurar Algoritmo") ~ * button, button:has(h4)').first();
    // Fallback robusto: clica no primeiro cartão de estratégia visível (contém <h4>)
    await page.locator("button").filter({ has: page.locator("h4") }).first().click();

    // Etapa 03: dispara a geração com o quantidade default (1 jogo)
    const generateBtn = page.getByRole("button", { name: /Gerar \d+ Jogos?/i });
    await expect(generateBtn).toBeEnabled({ timeout: 15_000 });
    await generateBtn.click();

    // 3. Valida a tela de resultados (Etapa 04)
    await expect(page.getByRole("heading", { name: /Predições Finalizadas/i })).toBeVisible({
      timeout: 30_000,
    });

    // Deve renderizar ao menos uma bola do jogo gerado (elementos .lottery-ball)
    const balls = page.locator(".lottery-ball");
    await expect(balls.first()).toBeVisible();
    const ballCount = await balls.count();
    expect(ballCount).toBeGreaterThanOrEqual(5);

    // Cada bola deve exibir um número de 2 dígitos
    const firstBallText = (await balls.first().textContent())?.trim() ?? "";
    expect(firstBallText).toMatch(/^\d{2}$/);

    // O Titan Score também deve aparecer (X/100)
    await expect(page.getByText(/\/100/).first()).toBeVisible();
  });
});
