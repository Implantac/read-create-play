import { useLotteryContext } from "@/contexts/LotteryContext";
import { MLPanel } from "@/components/MLPanel";
import { AdvancedAnalyticsPanel } from "@/components/AdvancedAnalyticsPanel";
import { ConditionalProbabilityPanel } from "@/components/ConditionalProbabilityPanel";
import { HPEnginePanel } from "@/components/HPEnginePanel";
import { OptimizationPanel } from "@/components/OptimizationPanel";
import { PlanGate } from "@/components/PlanGate";

const EstrategiasPage = () => {
  const { config, draws, stats } = useLotteryContext();

  if (draws.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Importe os sorteios primeiro no Dashboard para usar as estratégias.
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default EstrategiasPage;
