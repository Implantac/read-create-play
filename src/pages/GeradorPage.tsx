import { useLotteryContext } from "@/contexts/LotteryContext";
import { EnhancedBetGenerator } from "@/components/EnhancedBetGenerator";
import { AIPredictionPanel } from "@/components/AIPredictionPanel";
import { ProfessionalGeneratorPanel } from "@/components/ProfessionalGeneratorPanel";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { BetOptimizerPanel } from "@/components/BetOptimizerPanel";
import { BetChecker } from "@/components/BetChecker";
import { NumberPickerGrid } from "@/components/NumberPickerGrid";
import { SavedBetsPanel } from "@/components/SavedBetsPanel";
import { EvolutiveGeneratorPanel } from "@/components/EvolutiveGeneratorPanel";
import { IntelligentGeneratorPanel } from "@/components/IntelligentGeneratorPanel";
import { RobustnessRadarPanel } from "@/components/RobustnessRadarPanel";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { useSavedBets } from "@/hooks/useSavedBets";
import { Sparkles } from "lucide-react";

const GeradorPage = () => {
  const { config, draws, stats, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);

  const handleSaveBet = (numbers: number[], strategy?: string, score?: number, grade?: string) => {
    saveBet({ numbers, strategy, score, grade });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gerador de Apostas"
        description="Gere combinações inteligentes com algoritmos estatísticos e IA"
        icon={Sparkles}
      />
      <LotteryContextBanner />

      {draws.length === 0 ? (
        <EmptyState description="Importe os sorteios primeiro no Dashboard para usar o gerador." />
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            <NumberPickerGrid
              config={config}
              stats={stats}
              onSaveBet={(numbers) => handleSaveBet(numbers, "Manual")}
            />
            <SavedBetsPanel />
          </div>

          <AIPredictionPanel config={config} stats={stats} onSaveBet={handleSaveBet} />

          {/* Gerador Inteligente */}
          <IntelligentGeneratorPanel stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />

          {/* Gerador Evolutivo */}
          <EvolutiveGeneratorPanel stats={stats} config={config} draws={draws} lotteryId={selectedLottery} />

          <PlanGate feature="gerador_profissional" fallbackMessage="Gerador Profissional com filtros avançados">
            <ProfessionalGeneratorPanel stats={stats} config={config} draws={draws} />
          </PlanGate>

          <div className="grid lg:grid-cols-2 gap-6">
            <EnhancedBetGenerator stats={stats} config={config} onSaveBet={handleSaveBet} />
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
