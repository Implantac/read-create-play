import { lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/common/ComplianceDisclaimer";
import { ComparativeSimulatorPanel } from "@/components/lottery/simulators/ComparativeSimulatorPanel";
import { StrategyBriefingPanel } from "@/components/lottery/analysis/StrategyBriefingPanel";
import { FlaskConical, Loader2, Calculator } from "lucide-react";
import { InvestmentSimulator } from "@/components/lottery/simulators/InvestmentSimulator";

const HistoricalSimulatorPanel = lazy(() => import("@/components/lottery/simulators/HistoricalSimulatorPanel").then(m => ({ default: m.HistoricalSimulatorPanel })));
const MassiveSimulationDashboard = lazy(() => import("@/components/lottery/simulators/MassiveSimulationDashboard").then(m => ({ default: m.MassiveSimulationDashboard })));
const IntelligentSimulatorPanel = lazy(() => import("@/components/lottery/simulators/IntelligentSimulatorPanel").then(m => ({ default: m.IntelligentSimulatorPanel })));
const MassiveSimulatorPanel = lazy(() => import("@/components/lottery/simulators/MassiveSimulatorPanel").then(m => ({ default: m.MassiveSimulatorPanel })));
const GameSimulator = lazy(() => import("@/components/lottery/simulators/GameSimulator").then(m => ({ default: m.GameSimulator })));
const BacktestPanel = lazy(() => import("@/components/BacktestPanel").then(m => ({ default: m.BacktestPanel })));
const BaselineBenchmarkPanel = lazy(() => import("@/components/BaselineBenchmarkPanel").then(m => ({ default: m.BaselineBenchmarkPanel })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mr-2" />
    <span className="text-sm">Carregando módulo...</span>
  </div>
);

const SimulacoesPage = () => {
  const { config, draws, stats } = useLotteryContext();

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        title="Simulador Histórico"
        description="Execute qualquer estratégia contra concursos passados e analise o desempenho histórico, acertos e eficiência teórica."
        icon={FlaskConical}
        badge="SIMULATION CORE v4.0"
      />
      
      {draws.length === 0 ? (
        <EmptyState title="Database Offline" description="Conecte-se à rede de dados oficial no Dashboard para habilitar os testes de robustez." />
      ) : (
        <PlanGate feature="simulacoes" fallbackMessage="Engine de Simulação Massiva">
          <div className="space-y-10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
              <LotteryContextBanner />
            </div>

            <StrategyBriefingPanel config={config} stats={stats} draws={draws} compact />
            <InvestmentSimulator />

            <ComparativeSimulatorPanel stats={stats} config={config} draws={draws} />

            <Suspense fallback={<LazyFallback />}>
              <BaselineBenchmarkPanel stats={stats} config={config} draws={draws} />
            </Suspense>

            <Suspense fallback={<LazyFallback />}>
              <HistoricalSimulatorPanel config={config} draws={draws} stats={stats} />
            </Suspense>

            <Suspense fallback={<LazyFallback />}>
              <MassiveSimulationDashboard stats={stats} config={config} draws={draws} />
            </Suspense>

            <Suspense fallback={<LazyFallback />}>
              <IntelligentSimulatorPanel config={config} draws={draws} stats={stats} />
            </Suspense>

            <Suspense fallback={<LazyFallback />}>
              <MassiveSimulatorPanel stats={stats} config={config} draws={draws} />
            </Suspense>

            <div className="grid lg:grid-cols-2 gap-6">
              <Suspense fallback={<LazyFallback />}>
                <GameSimulator stats={stats} config={config} draws={draws} />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <BacktestPanel stats={stats} config={config} draws={draws} />
              </Suspense>
            </div>
          </div>
        </PlanGate>
      )}

    </div>
  );
};

export default SimulacoesPage;
