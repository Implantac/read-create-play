import { lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { BayesianNetworkPanel } from "@/components/BayesianNetworkPanel";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, Cpu, Sparkles, Target, Layers } from "lucide-react";

const StrategySimulatorPanel = lazy(() => import("@/components/StrategySimulatorPanel").then(m => ({ default: m.StrategySimulatorPanel })));
const StrategyComparatorPanel = lazy(() => import("@/components/StrategyComparatorPanel").then(m => ({ default: m.StrategyComparatorPanel })));
const PatternDetectorPanel = lazy(() => import("@/components/PatternDetectorPanel").then(m => ({ default: m.PatternDetectorPanel })));
const OptimizationPanel = lazy(() => import("@/components/OptimizationPanel").then(m => ({ default: m.OptimizationPanel })));
const MLPanel = lazy(() => import("@/components/MLPanel").then(m => ({ default: m.MLPanel })));
const AdvancedAnalyticsPanel = lazy(() => import("@/components/AdvancedAnalyticsPanel").then(m => ({ default: m.AdvancedAnalyticsPanel })));
const ConditionalProbabilityPanel = lazy(() => import("@/components/ConditionalProbabilityPanel").then(m => ({ default: m.ConditionalProbabilityPanel })));
const HPEnginePanel = lazy(() => import("@/components/HPEnginePanel").then(m => ({ default: m.HPEnginePanel })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mr-2" />
    <span className="text-sm">Carregando módulo...</span>
  </div>
);

const EstrategiasPage = () => {
  const { config, draws, stats } = useLotteryContext();

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 via-background to-accent/5 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 ring-2 ring-primary/20">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              Estratégias IA
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Machine Learning, otimização genética e análise preditiva para{" "}
              <span className="text-primary font-semibold">{config.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs gap-1.5 py-1.5 px-3">
              <Cpu className="w-3 h-3" />
              8 módulos
            </Badge>
            <Badge className="text-xs gap-1.5 py-1.5 px-3 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-3 h-3" />
              ML
            </Badge>
          </div>
        </div>
      </div>

      <LotteryContextBanner />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para usar as estratégias." />
      ) : (
        <>
          <BayesianNetworkPanel config={config} draws={draws} stats={stats} />

          <PlanGate feature="estrategias_basicas" fallbackMessage="Simulador de Estratégias">
            <Suspense fallback={<LazyFallback />}>
              <StrategySimulatorPanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="estrategias_basicas" fallbackMessage="Comparador de Estratégias">
            <Suspense fallback={<LazyFallback />}>
              <StrategyComparatorPanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="estrategias_basicas" fallbackMessage="Detector de Padrões">
            <Suspense fallback={<LazyFallback />}>
              <PatternDetectorPanel config={config} draws={draws} stats={stats} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="estrategias_basicas" fallbackMessage="Probabilidade Condicional">
            <Suspense fallback={<LazyFallback />}>
              <ConditionalProbabilityPanel draws={draws} config={config} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="otimizacao" fallbackMessage="Otimização com Algoritmo Genético + SA">
            <Suspense fallback={<LazyFallback />}>
              <OptimizationPanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>
          <PlanGate feature="estrategias_ml" fallbackMessage="Machine Learning Preditivo">
            <Suspense fallback={<LazyFallback />}>
              <MLPanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>
          <PlanGate feature="estrategias_analytics" fallbackMessage="Analytics Avançado">
            <Suspense fallback={<LazyFallback />}>
              <AdvancedAnalyticsPanel stats={stats} draws={draws} config={config} />
            </Suspense>
          </PlanGate>
          <PlanGate feature="estrategias_hp" fallbackMessage="Motor HP Matemático">
            <Suspense fallback={<LazyFallback />}>
              <HPEnginePanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>
        </>
      )}
    </div>
  );
};

export default EstrategiasPage;
