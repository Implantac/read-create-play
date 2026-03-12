import { lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Brain, Loader2 } from "lucide-react";

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
      <PageHeader
        title="Estratégias IA"
        description="Machine Learning, otimização genética e análise preditiva"
        icon={Brain}
        badge="ML"
      />
      <LotteryContextBanner />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para usar as estratégias." />
      ) : (
        <>
          <Suspense fallback={<LazyFallback />}>
            <StrategyComparatorPanel stats={stats} config={config} draws={draws} />
          </Suspense>

          <Suspense fallback={<LazyFallback />}>
            <PatternDetectorPanel config={config} draws={draws} stats={stats} />
          </Suspense>

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
          <Suspense fallback={<LazyFallback />}>
            <ConditionalProbabilityPanel draws={draws} config={config} />
          </Suspense>
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
