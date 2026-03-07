import { useLotteryContext } from "@/contexts/LotteryContext";
import { MLPanel } from "@/components/MLPanel";
import { AdvancedAnalyticsPanel } from "@/components/AdvancedAnalyticsPanel";
import { ConditionalProbabilityPanel } from "@/components/ConditionalProbabilityPanel";
import { HPEnginePanel } from "@/components/HPEnginePanel";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
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

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para usar as estratégias." />
      ) : (
        <>
          <PlanGate feature="otimizacao" fallbackMessage="Otimização com Algoritmo Genético + SA">
            <OptimizationPanel stats={stats} config={config} draws={draws} />
          </PlanGate>
          <PlanGate feature="estrategias_ml" fallbackMessage="Machine Learning Preditivo">
            <MLPanel stats={stats} config={config} />
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
