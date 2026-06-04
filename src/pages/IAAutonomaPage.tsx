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
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <PageHeader
        title="Protocolo IA Autônomo"
        description="Redes neurais em regime de aprendizado contínuo para detecção de anomalias estatísticas e padrões ocultos."
        icon={Brain}
        badge="ALPHA NEURAL CORE"
      />
      
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
        <LotteryContextBanner />
      </div>


      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para ativar a IA Autônoma." />
      ) : (
        <PlanGate feature="ia_autonoma" fallbackMessage="IA Autônoma com aprendizado contínuo para usuários de elite">
          <AIAutonomousDashboard config={config} draws={draws} stats={stats} />
        </PlanGate>
      )}
    </div>
  );
  );
};

export default IAAutonomaPage;
