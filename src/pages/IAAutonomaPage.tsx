import { useLotteryContext } from "@/contexts/LotteryContext";
import { AIAutonomousDashboard } from "@/components/AIAutonomousDashboard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Brain } from "lucide-react";

const IAAutonomaPage = () => {
  const { config, draws, stats } = useLotteryContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="IA Autônoma"
        description="Inteligência artificial com aprendizado contínuo e análise preditiva"
        icon={Brain}
        badge="AUTÔNOMA"
      />
      <LotteryContextBanner />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para ativar a IA Autônoma." />
      ) : (
        <AIAutonomousDashboard config={config} draws={draws} stats={stats} />
      )}
    </div>
  );
};

export default IAAutonomaPage;
