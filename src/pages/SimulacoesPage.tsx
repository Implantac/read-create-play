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
import { FlaskConical, Loader2, TrendingUp, Cpu, BarChart3, Layers, Activity } from "lucide-react";

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
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-accent/5 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 ring-2 ring-primary/20">
            <FlaskConical className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              Simulações
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Teste estratégias com simulações Monte Carlo, backtesting e simulação massiva para{" "}
              <span className="text-primary font-semibold">{config.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs gap-1.5 py-1.5 px-3">
              <BarChart3 className="w-3 h-3" />
              {draws.length.toLocaleString()} sorteios
            </Badge>
          </div>
        </div>
      </div>

      <LotteryContextBanner />
      <ComplianceDisclaimer />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para rodar simulações." />
      ) : (
        <PlanGate feature="simulacoes" fallbackMessage="Simulações avançadas — disponível nos planos Premium e superiores">
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
