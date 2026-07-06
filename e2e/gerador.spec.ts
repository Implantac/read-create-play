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
    const savePortfolioBtn = page.getByRole("button", { name: /Salvar Todos no Portfólio/i });
    await expect(savePortfolioBtn).toBeVisible();
    await expect(page.getByRole("button", { name: /Novo Ciclo de Geração/i })).toBeVisible();

    // 4. Persiste os jogos gerados no portfólio para o ROI computar
    const generatedGames = await page.locator(".lottery-ball").evaluateAll((nodes) => nodes.length);
    await savePortfolioBtn.click();
    // Aguarda o toast de confirmação (ou apenas dá tempo do save assíncrono)
    await page.waitForTimeout(1500);

    // 5. Valida o Dashboard de ROI (percentual, valores e consistência)
    await page.goto("/roi", { waitUntil: "domcontentloaded" });

    // Se o usuário não tiver plano ROI, o PlanGate mostra fallback: encerramos com aviso.
    const gateFallback = page.getByText(/Dashboard de ROI e análise de premiações/i);
    const roiTab = page.getByRole("tab", { name: /^ROI$/ });
    const tabVisible = await roiTab.isVisible().catch(() => false);
    if (!tabVisible) {
      const gated = await gateFallback.isVisible().catch(() => false);
      test.skip(gated, "Conta de teste sem acesso ao Dashboard de ROI (PlanGate).");
    }

    await expect(roiTab).toBeVisible({ timeout: 15_000 });

    // Cartões-resumo
    await expect(page.getByText(/Total Investido/i)).toBeVisible();
    await expect(page.getByText(/Total Retorno/i)).toBeVisible();

    // Card do ROI: label + valor percentual assinado (+X.X% ou -X.X%)
    const roiCard = page
      .locator("div")
      .filter({ hasText: /^ROI$/ })
      .locator("xpath=ancestor::*[contains(@class,'Card') or self::*][1]")
      .first();

    const roiPctLocator = page.locator("p").filter({ hasText: /^[+-]?\d+(?:[.,]\d+)?%$/ }).first();
    await expect(roiPctLocator).toBeVisible({ timeout: 15_000 });

    const readMoney = async (label: RegExp) => {
      const raw = await page.getByText(label).locator("xpath=following::p[1]").first().textContent();
      const match = (raw ?? "").match(/R\$\s*(-?\d+(?:[.,]\d{2}))/);
      expect(match, `valor monetário esperado após "${label}" (recebido: "${raw}")`).not.toBeNull();
      return Number(match![1].replace(/\./g, "").replace(",", "."));
    };

    const invested = await readMoney(/Total Investido/i);
    const returned = await readMoney(/Total Retorno/i);
    const roiRaw = (await roiPctLocator.textContent())?.trim() ?? "";
    const roiPct = Number(roiRaw.replace(/[+%]/g, "").replace(",", "."));

    // Consistência básica
    expect(invested).toBeGreaterThan(0);
    expect(returned).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(roiPct)).toBe(true);

    // Fórmula: ROI% = (returned - invested)/invested * 100 (tolerância de 0,2pp por arredondamento)
    const expectedRoi = ((returned - invested) / invested) * 100;
    expect(Math.abs(expectedRoi - roiPct)).toBeLessThanOrEqual(0.2);

    // Sinal do ROI coerente com a comparação retorno vs investido
    if (returned > invested) expect(roiPct).toBeGreaterThan(0);
    else if (returned < invested) expect(roiPct).toBeLessThan(0);
    else expect(roiPct).toBe(0);

    // Sanity: houve pelo menos 1 jogo gerado antes de salvar
    expect(generatedGames).toBeGreaterThan(0);
  });
});
