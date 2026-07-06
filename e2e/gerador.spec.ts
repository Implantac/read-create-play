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

    // 3a. Bolas: pelo menos 5 renderizadas, todas com número de 2 dígitos e sem duplicatas
    const balls = page.locator(".lottery-ball");
    await expect(balls.first()).toBeVisible();
    const ballCount = await balls.count();
    expect(ballCount).toBeGreaterThanOrEqual(5);

    const ballTexts: string[] = [];
    for (let i = 0; i < ballCount; i++) {
      const t = (await balls.nth(i).textContent())?.trim() ?? "";
      expect(t, `bola #${i} deve ter 2 dígitos`).toMatch(/^\d{2}$/);
      ballTexts.push(t);
    }
    // Números dentro de um mesmo jogo devem ser únicos (checagem por card)
    // (verificamos que ao menos o primeiro card não tem duplicatas na sua fatia)
    const firstCardBalls = ballTexts.slice(0, Math.min(ballCount, 25));
    expect(new Set(firstCardBalls).size).toBe(firstCardBalls.length);

    // 3b. Titan Score: label + valor numérico 0-100 + classificação qualitativa
    await expect(page.getByText(/Titan Score/i).first()).toBeVisible();

    const scoreLocator = page.getByText(/\/100/).first();
    await expect(scoreLocator).toBeVisible();
    const scoreRaw = (await scoreLocator.textContent())?.trim() ?? "";
    const scoreMatch = scoreRaw.match(/(\d{1,3})\s*\/\s*100/);
    expect(scoreMatch, `Titan Score deve estar no formato N/100 (recebido: "${scoreRaw}")`).not.toBeNull();
    const scoreValue = Number(scoreMatch![1]);
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);

    // Rótulo qualitativo derivado do score (Excelente ≥90, Alta Convergência ≥75, Estável <75)
    const expectedLabel =
      scoreValue >= 90 ? /Excelente/i : scoreValue >= 75 ? /Alta Convergência/i : /Estável/i;
    await expect(page.getByText(expectedLabel).first()).toBeVisible();

    // 3c. Ações pós-geração disponíveis (salvar portfólio + novo ciclo)
    await expect(page.getByRole("button", { name: /Salvar Todos no Portfólio/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Novo Ciclo de Geração/i })).toBeVisible();
  });
});
