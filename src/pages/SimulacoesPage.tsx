import { lazy } from "react";
import { SafeSuspense } from "@/components/SafeSuspense";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/ComplianceDisclaimer";
import { ComparativeSimulatorPanel } from "@/components/ComparativeSimulatorPanel";
import { VolatilitySimulationPanel } from "@/components/VolatilitySimulationPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Loader2, TrendingUp, Cpu, BarChart3, Layers, Activity, Brain } from "lucide-react";
import { AdvancedAnalyticsPanel } from "@/components/AdvancedAnalyticsPanel";

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
        title="Simulation Lab"
        description={`Ambiente de alta performance para backtesting e simulações estocásticas — ${config.name}`}
        icon={FlaskConical}
        badge="Quantum Engine v4.2"
      />

      <LotteryContextBanner />
      <ComplianceDisclaimer />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para rodar simulações." />
      ) : (
        <PlanGate feature="simulacoes" fallbackMessage="Simulações avançadas — disponível no plano Vitalício">
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-black text-foreground font-mono">{config.pick}</div>
                  <div className="text-[10px] text-muted-foreground">Dezenas sorteadas</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <Layers className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-black text-foreground font-mono">{config.numbers}</div>
                  <div className="text-[10px] text-muted-foreground">Total de números</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <Cpu className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-black text-foreground font-mono">7</div>
                  <div className="text-[10px] text-muted-foreground">Simuladores</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <BarChart3 className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-lg font-black text-foreground font-mono">{draws.length.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Sorteios na base</div>
                </CardContent>
              </Card>
            </div>

            <AdvancedAnalyticsPanel stats={stats} draws={draws} config={config} />
            <VolatilitySimulationPanel lotteryId={config.id} draws={draws} />
            <ComparativeSimulatorPanel stats={stats} config={config} draws={draws} />

            <SafeSuspense fallback={<LazyFallback />}>
              <HistoricalSimulatorPanel config={config} draws={draws} stats={stats} />
            </SafeSuspense>

            <SafeSuspense fallback={<LazyFallback />}>
              <MassiveSimulationDashboard stats={stats} config={config} draws={draws} />
            </SafeSuspense>

            <SafeSuspense fallback={<LazyFallback />}>
              <IntelligentSimulatorPanel config={config} draws={draws} stats={stats} />
            </SafeSuspense>

            <SafeSuspense fallback={<LazyFallback />}>
              <MassiveSimulatorPanel stats={stats} config={config} draws={draws} />
            </SafeSuspense>

            <div className="grid lg:grid-cols-2 gap-6">
              <SafeSuspense fallback={<LazyFallback />}>
                <GameSimulator stats={stats} config={config} draws={draws} />
              </SafeSuspense>
              <SafeSuspense fallback={<LazyFallback />}>
                <BacktestPanel stats={stats} config={config} draws={draws} />
              </SafeSuspense>
            </div>
          </>
        </PlanGate>
      )}
    </div>
  );
};

export default SimulacoesPage;
