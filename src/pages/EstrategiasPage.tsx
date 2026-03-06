import { useLotteryContext } from "@/contexts/LotteryContext";
import { MLPanel } from "@/components/MLPanel";
import { AdvancedAnalyticsPanel } from "@/components/AdvancedAnalyticsPanel";
import { ConditionalProbabilityPanel } from "@/components/ConditionalProbabilityPanel";
import { HPEnginePanel } from "@/components/HPEnginePanel";
import { OptimizationPanel } from "@/components/OptimizationPanel";

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
      <OptimizationPanel stats={stats} config={config} draws={draws} />
      <MLPanel stats={stats} config={config} />
      <AdvancedAnalyticsPanel stats={stats} draws={draws} config={config} />
      <ConditionalProbabilityPanel draws={draws} config={config} />
      <HPEnginePanel stats={stats} config={config} draws={draws} />
    </div>
  );
};

export default EstrategiasPage;
