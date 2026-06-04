import { useLotteryContext } from "@/contexts/LotteryContext";
import { AIAutonomousDashboard } from "@/components/AIAutonomousDashboard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { PlanGate } from "@/components/PlanGate";
import { Brain } from "lucide-react";

const IAAutonomaPage = () => {
  const { config, draws, stats } = useLotteryContext();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Protocolo IA Autônomo"
        description="Redes neurais em regime de aprendizado contínuo para detecção de anomalias estatísticas."
        icon={Brain}
        badge="NEURAL ACTIVE"
      />
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
        <LotteryContextBanner />
      </div>


      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para ativar a IA Autônoma." />
      ) : (
        <PlanGate feature="ia_autonoma" fallbackMessage="IA Autônoma com aprendizado contínuo">
          <AIAutonomousDashboard config={config} draws={draws} stats={stats} />
        </PlanGate>
      )}
    </div>
  );
};

export default IAAutonomaPage;
