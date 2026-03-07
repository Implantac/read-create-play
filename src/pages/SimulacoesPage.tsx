import { useLotteryContext } from "@/contexts/LotteryContext";
import { GameSimulator } from "@/components/GameSimulator";
import { MassiveSimulatorPanel } from "@/components/MassiveSimulatorPanel";
import { BacktestPanel } from "@/components/BacktestPanel";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FlaskConical } from "lucide-react";

const SimulacoesPage = () => {
  const { config, draws, stats } = useLotteryContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulações"
        description="Teste estratégias com simulações Monte Carlo e backtesting"
        icon={FlaskConical}
      />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para rodar simulações." />
      ) : (
        <>
          <PlanGate feature="simulacoes" fallbackMessage="Simulador Massivo de Apostas">
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
