import { lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { FlaskConical, Loader2 } from "lucide-react";

const HistoricalSimulatorPanel = lazy(() => import("@/components/HistoricalSimulatorPanel").then(m => ({ default: m.HistoricalSimulatorPanel })));
const MassiveSimulationDashboard = lazy(() => import("@/components/MassiveSimulationDashboard").then(m => ({ default: m.MassiveSimulationDashboard })));
const IntelligentSimulatorPanel = lazy(() => import("@/components/IntelligentSimulatorPanel").then(m => ({ default: m.IntelligentSimulatorPanel })));
const MassiveSimulatorPanel = lazy(() => import("@/components/MassiveSimulatorPanel").then(m => ({ default: m.MassiveSimulatorPanel })));
const GameSimulator = lazy(() => import("@/components/GameSimulator").then(m => ({ default: m.GameSimulator })));
const BacktestPanel = lazy(() => import("@/components/BacktestPanel").then(m => ({ default: m.BacktestPanel })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mr-2" />
    <span className="text-sm">Carregando módulo...</span>
  </div>
);

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
          <Suspense fallback={<LazyFallback />}>
            <HistoricalSimulatorPanel config={config} draws={draws} stats={stats} />
          </Suspense>

          <Suspense fallback={<LazyFallback />}>
            <MassiveSimulationDashboard stats={stats} config={config} draws={draws} />
          </Suspense>

          <Suspense fallback={<LazyFallback />}>
            <IntelligentSimulatorPanel config={config} draws={draws} stats={stats} />
          </Suspense>

          <PlanGate feature="simulacoes" fallbackMessage="Simulador Massivo Monte Carlo">
            <Suspense fallback={<LazyFallback />}>
              <MassiveSimulatorPanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>
          <PlanGate feature="simulacoes" fallbackMessage="Simulações de Jogos">
            <div className="grid lg:grid-cols-2 gap-6">
              <Suspense fallback={<LazyFallback />}>
                <GameSimulator stats={stats} config={config} draws={draws} />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <BacktestPanel stats={stats} config={config} draws={draws} />
              </Suspense>
            </div>
          </PlanGate>
        </>
      )}
    </div>
  );
};

export default SimulacoesPage;
