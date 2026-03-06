import { useLotteryContext } from "@/contexts/LotteryContext";
import { GameSimulator } from "@/components/GameSimulator";
import { MassiveSimulatorPanel } from "@/components/MassiveSimulatorPanel";
import { BacktestPanel } from "@/components/BacktestPanel";
import { PlanGate } from "@/components/PlanGate";

const SimulacoesPage = () => {
  const { config, draws, stats } = useLotteryContext();

  if (draws.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Importe os sorteios primeiro no Dashboard para rodar simulações.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlanGate feature="simulacoes" fallbackMessage="Simulador Massivo de Apostas">
        <MassiveSimulatorPanel stats={stats} config={config} draws={draws} />
      </PlanGate>
      <PlanGate feature="simulacoes" fallbackMessage="Simulações de Jogos">
        <div className="grid lg:grid-cols-2 gap-6">
          <GameSimulator stats={stats} config={config} draws={draws} />
          <BacktestPanel stats={stats} config={config} draws={draws} />
        </div>
      </PlanGate>
    </div>
  );
};

export default SimulacoesPage;
