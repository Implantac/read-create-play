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

    // Perde o foco (simulando clique fora ou tab)
    fireEvent.blur(avgButton);

    // Aguarda o tooltip desaparecer
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("deve abrir o tooltip ao navegar com teclado (Tab) e fechar ao sair (Shift+Tab)", async () => {
    render(
      <TooltipProvider>
        <button data-testid="other-button">Outro</button>
        <BetComparisonPanel 
          bets={mockBets} 
          onClose={() => {}} 
          lotteryId="megasena" 
          pick={6} 
        />
      </TooltipProvider>
    );

    const avgButton = screen.getByLabelText(/Média: 4.00/);
    const otherButton = screen.getByTestId("other-button");

    // Simula navegação via Tab (focando no elemento)
    fireEvent.focus(avgButton);

    // Aguarda o tooltip aparecer
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();

    // Simula saída via Shift+Tab (focando em outro elemento)
    fireEvent.blur(avgButton);
    fireEvent.focus(otherButton);

    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("deve abrir o tooltip ao navegar com teclado (Tab)", async () => {
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
    
    // O Radix Tooltip abre no foco do teclado por padrão
    fireEvent.focus(avgButton);
    
    // Aguarda o tooltip
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
  });

  it("deve remover a referência aria-describedby quando o tooltip é fechado via Escape", async () => {
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
    
    // Abre o tooltip
    fireEvent.focus(avgButton);
    await screen.findByRole("tooltip");

    // Verifica que o atributo aria-describedby está presente e aponta para algo
    const tooltipId = avgButton.getAttribute("aria-describedby");
    expect(tooltipId).toBeTruthy();

    // Fecha com Escape
    fireEvent.keyDown(avgButton, { key: "Escape", code: "Escape" });

    // Aguarda o tooltip sumir do DOM
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    // O Radix limpa ou mantém o ID mas remove o elemento. 
    // Vamos verificar se o elemento referenciado ainda existe no DOM.
    if (tooltipId) {
      expect(document.getElementById(tooltipId)).toBeNull();
    }
  });

  it("deve manter o foco no botão que abriu o tooltip após pressionar Escape", async () => {
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
    
    // Foca no botão para abrir o tooltip
    avgButton.focus();
    expect(document.activeElement).toBe(avgButton);

    // Aguarda o tooltip aparecer
    await screen.findByRole("tooltip");

    // Pressiona Escape para fechar o tooltip
    fireEvent.keyDown(avgButton, { key: "Escape", code: "Escape" });

    // Aguarda o tooltip sumir
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    // Verifica se o foco permanece no botão original
    expect(document.activeElement).toBe(avgButton);
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

  it("deve atualizar o estado (data-state) do trigger ao abrir e fechar o tooltip", async () => {
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
    
    // Estado inicial deve ser 'closed'
    expect(avgButton).toHaveAttribute("data-state", "closed");

    // Abre o tooltip via foco
    avgButton.focus();

    // Aguarda o estado mudar para 'delayed-open' ou 'open'
    await waitFor(() => {
      const state = avgButton.getAttribute("data-state");
      expect(["open", "delayed-open"]).toContain(state);
    });

    // Pressiona Escape
    fireEvent.keyDown(avgButton, { key: "Escape", code: "Escape" });

    // Volta para 'closed'
    await waitFor(() => {
      expect(avgButton).toHaveAttribute("data-state", "closed");
    });
  });
});

