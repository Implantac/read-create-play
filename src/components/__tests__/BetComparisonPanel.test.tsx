import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BetComparisonPanel } from "../BetComparisonPanel";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock das dependências que não queremos testar aqui
vi.mock("@/components/BetHitsChart", () => ({
  BetHitsChart: () => <div data-testid="hits-chart" />
}));

const mockBets = [
  {
    numbers: [1, 2, 3, 4, 5, 6],
    label: "Aposta Teste 1",
    results: [
      { concurso: 1, date: "01/01/2026", hits: 4, matched: [1, 2, 3, 4], prizeValue: 800, prize: "Quadra" }
    ],
    avgHits: 4,
    bestHit: 4,
    prizeHits: 1,
    totalPrizeValue: 800,
    totalPrize: "R$ 800",
    score: 85,
    trend: "stable" as const,
    recentAvg: 4,
    previousAvg: 4
  }
];

describe("BetComparisonPanel Accessibility", () => {
  it("deve anunciar corretamente o tooltip quando o botão de métrica recebe foco", async () => {
    render(
      <TooltipProvider>
        <BetComparisonPanel 
          bets={mockBets} 
          onClose={() => {}} 
          lotteryId="megasena" 
          pick={6} 
        />
      </TooltipProvider>
    );

    // Encontrar o botão de média (que tem tooltip)
    // O aria-label contém o valor e a descrição do tooltip
    const avgButton = screen.getByLabelText(/Média: 4.00.*Média de acertos em todos os sorteios analisados/);
    expect(avgButton).toBeInTheDocument();

    // Simular foco para verificar se o tooltip aparece e está associado
    avgButton.focus();
    
    // O tooltip deve ter o ID que o botão referencia no aria-describedby
    const tooltipId = avgButton.getAttribute("aria-describedby");
    expect(tooltipId).toBeDefined();

    await waitFor(() => {
      const tooltipContent = document.getElementById(tooltipId!);
      expect(tooltipContent).toBeInTheDocument();
      expect(tooltipContent).toHaveTextContent("Média de acertos em todos os sorteios analisados");
    });
  });

  it("deve remover o tooltip quando a tecla Escape é pressionada", async () => {
    render(
      <TooltipProvider>
        <BetComparisonPanel 
          bets={mockBets} 
          onClose={() => {}} 
          lotteryId="megasena" 
          pick={6} 
        />
      </TooltipProvider>
    );

    const avgButton = screen.getByLabelText(/Média: 4.00/);
    avgButton.focus();

    const tooltipId = avgButton.getAttribute("aria-describedby");
    
    // Aguarda o tooltip aparecer
    await waitFor(() => {
      expect(document.getElementById(tooltipId!)).toBeInTheDocument();
    });

    // Pressiona Escape
    fireEvent.keyDown(avgButton, { key: "Escape", code: "Escape" });

    // Aguarda o tooltip desaparecer
    await waitFor(() => {
      expect(document.getElementById(tooltipId!)).not.toBeInTheDocument();
    });
  });

  it("deve remover o tooltip quando houver um clique fora do elemento", async () => {
    render(
      <TooltipProvider>
        <div data-testid="outside-element">Fora</div>
        <BetComparisonPanel 
          bets={mockBets} 
          onClose={() => {}} 
          lotteryId="megasena" 
          pick={6} 
        />
      </TooltipProvider>
    );

    const avgButton = screen.getByLabelText(/Média: 4.00/);
    
    // Abre o tooltip via foco
    fireEvent.focus(avgButton);

    // Aguarda o tooltip aparecer no DOM (usando o papel semântico do Radix)
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();

    // Clica fora
    fireEvent.mouseDown(screen.getByTestId("outside-element"));

    // Aguarda o tooltip desaparecer
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("deve permitir que o leitor de tela identifique os badges de métricas", () => {
    render(
      <TooltipProvider>
        <BetComparisonPanel 
          bets={mockBets} 
          onClose={() => {}} 
          lotteryId="megasena" 
          pick={6} 
        />
      </TooltipProvider>
    );

    const scoreBadge = screen.getByLabelText(/Pontuação total: 85 de 100/);
    expect(scoreBadge).toBeInTheDocument();
  });
});

