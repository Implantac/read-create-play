import { useLotteryContext } from "@/contexts/LotteryContext";
import { GameSimulator } from "@/components/GameSimulator";
import { MassiveSimulatorPanel } from "@/components/MassiveSimulatorPanel";
import { MassiveSimulationDashboard } from "@/components/MassiveSimulationDashboard";
import { BacktestPanel } from "@/components/BacktestPanel";
import { IntelligentSimulatorPanel } from "@/components/IntelligentSimulatorPanel";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { FlaskConical } from "lucide-react";

const SimulacoesPage = () => {
  const { config, draws, stats } = useLotteryContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulações"
        description="Teste estratégias com simulações Monte Carlo, backtesting e simulação massiva com IA"
        icon={FlaskConical}
      />
      <LotteryContextBanner />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para rodar simulações." />
      ) : (
        <>
          {/* Motor de Simulação Massiva v2 - Destaque principal */}
          <MassiveSimulationDashboard stats={stats} config={config} draws={draws} />

          {/* Simulador Inteligente com IA */}
          <IntelligentSimulatorPanel config={config} draws={draws} stats={stats} />

          <PlanGate feature="simulacoes" fallbackMessage="Simulador Massivo Monte Carlo">
            <MassiveSimulatorPanel stats={stats} config={config} draws={draws} />
          </PlanGate>
          <PlanGate feature="simulacoes" fallbackMessage="Simulações de Jogos">
            <div className="grid lg:grid-cols-2 gap-6">
              <GameSimulator stats={stats} config={config} draws={draws} />
              <BacktestPanel stats={stats} config={config} draws={draws} />
            </div>
          </PlanGate>
        </>
      )}
    </div>
  );
};

export default SimulacoesPage;
