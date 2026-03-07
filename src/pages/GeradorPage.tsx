import { useLotteryContext } from "@/contexts/LotteryContext";
import { EnhancedBetGenerator } from "@/components/EnhancedBetGenerator";
import { ProfessionalGeneratorPanel } from "@/components/ProfessionalGeneratorPanel";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { BetOptimizerPanel } from "@/components/BetOptimizerPanel";
import { BetChecker } from "@/components/BetChecker";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Sparkles } from "lucide-react";

const GeradorPage = () => {
  const { config, draws, stats, selectedLottery } = useLotteryContext();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerador de Apostas"
        description="Gere combinações inteligentes com algoritmos estatísticos e IA"
        icon={Sparkles}
      />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para usar o gerador." />
      ) : (
        <>
          <PlanGate feature="gerador_profissional" fallbackMessage="Gerador Profissional com filtros avançados">
            <ProfessionalGeneratorPanel stats={stats} config={config} draws={draws} />
          </PlanGate>

          <div className="grid lg:grid-cols-2 gap-6">
            <EnhancedBetGenerator stats={stats} config={config} />
            <MonteCarloPanel stats={stats} config={config} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <BetOptimizerPanel stats={stats} config={config} draws={draws} />
            <BetChecker draws={draws} lotteryId={selectedLottery} maxNumbers={config.numbers} pick={config.pick} />
          </div>
        </>
      )}
    </div>
  );
};

export default GeradorPage;
