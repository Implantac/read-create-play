import { useLotteryContext } from "@/contexts/LotteryContext";
import { MLPanel } from "@/components/MLPanel";
import { AdvancedAnalyticsPanel } from "@/components/AdvancedAnalyticsPanel";
import { ConditionalProbabilityPanel } from "@/components/ConditionalProbabilityPanel";
import { HPEnginePanel } from "@/components/HPEnginePanel";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { PatternDetectorPanel } from "@/components/PatternDetectorPanel";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Brain } from "lucide-react";

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
          {/* Detector de Padrões com IA */}
          <PatternDetectorPanel config={config} draws={draws} stats={stats} />

          <PlanGate feature="otimizacao" fallbackMessage="Otimização com Algoritmo Genético + SA">
            <OptimizationPanel stats={stats} config={config} draws={draws} />
          </PlanGate>
          <PlanGate feature="estrategias_ml" fallbackMessage="Machine Learning Preditivo">
            <MLPanel stats={stats} config={config} draws={draws} />
          </PlanGate>
          <PlanGate feature="estrategias_analytics" fallbackMessage="Analytics Avançado">
            <AdvancedAnalyticsPanel stats={stats} draws={draws} config={config} />
          </PlanGate>
          <ConditionalProbabilityPanel draws={draws} config={config} />
          <PlanGate feature="estrategias_hp" fallbackMessage="Motor HP Matemático">
            <HPEnginePanel stats={stats} config={config} draws={draws} />
          </PlanGate>
        </>
      )}
    </div>
  );
};

export default EstrategiasPage;
