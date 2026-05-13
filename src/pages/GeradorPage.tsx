import { lazy } from "react";
import { SafeSuspense } from "@/components/SafeSuspense";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { SelectedBetsProvider } from "@/contexts/SelectedBetsContext";
import { BetGenerator } from "@/components/BetGenerator";
import { NumberPickerGrid } from "@/components/NumberPickerGrid";
import { SavedBetsPanel } from "@/components/SavedBetsPanel";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/ComplianceDisclaimer";
import { BulkCheckBar } from "@/components/BulkCheckBar";
import { useSavedBets } from "@/hooks/useSavedBets";
import { Sparkles, Loader2 } from "lucide-react";

const RobustnessRadarPanel = lazy(() => import("@/components/RobustnessRadarPanel").then(m => ({ default: m.RobustnessRadarPanel })));
const AIPredictionPanel = lazy(() => import("@/components/AIPredictionPanel").then(m => ({ default: m.AIPredictionPanel })));
const IntelligentGeneratorPanel = lazy(() => import("@/components/IntelligentGeneratorPanel").then(m => ({ default: m.IntelligentGeneratorPanel })));
const EvolutiveGeneratorPanel = lazy(() => import("@/components/EvolutiveGeneratorPanel").then(m => ({ default: m.EvolutiveGeneratorPanel })));
const ProfessionalGeneratorPanel = lazy(() => import("@/components/ProfessionalGeneratorPanel").then(m => ({ default: m.ProfessionalGeneratorPanel })));
const EnhancedBetGenerator = lazy(() => import("@/components/EnhancedBetGenerator").then(m => ({ default: m.EnhancedBetGenerator })));
const MonteCarloPanel = lazy(() => import("@/components/MonteCarloPanel").then(m => ({ default: m.MonteCarloPanel })));
const BetOptimizerPanel = lazy(() => import("@/components/BetOptimizerPanel").then(m => ({ default: m.BetOptimizerPanel })));
const BetChecker = lazy(() => import("@/components/BetChecker").then(m => ({ default: m.BetChecker })));
const ExtremeGeneratorPanel = lazy(() => import("@/components/ExtremeGeneratorPanel").then(m => ({ default: m.ExtremeGeneratorPanel })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mr-2" />
    <span className="text-sm">Carregando módulo...</span>
  </div>
);

const GeradorPage = () => {
  const { config, draws, drawsWithPrizes, stats, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);

  const handleSaveBet = (numbers: number[], strategy?: string, score?: number, grade?: string) => {
    saveBet({ numbers, strategy, score, grade });
  };

  return (
    <SelectedBetsProvider>
      <div className="space-y-6">
        <PageHeader
          title="Gerador de Apostas"
          description="Gere combinações inteligentes com algoritmos estatísticos e IA"
          icon={Sparkles}
        />
        <LotteryContextBanner />
        <ComplianceDisclaimer />

        {draws.length === 0 ? (
          <EmptyState description="Importe os sorteios primeiro no Dashboard para usar o gerador." />
        ) : (
          <>
            {/* FREE: Basic generator + number picker + saved bets + bet checker */}
            <BetGenerator stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <NumberPickerGrid
                config={config}
                stats={stats}
                onSaveBet={(numbers) => handleSaveBet(numbers, "Manual")}
              />
              <SavedBetsPanel />
            </div>

            {/* VITALÍCIO: Advanced generators */}
            <PlanGate feature="gerador_avancado" fallbackMessage="Análise de Robustez e Score">
              <SafeSuspense fallback={<LazyFallback />}>
                <RobustnessRadarPanel stats={stats} config={config} draws={draws} lotteryId={selectedLottery} />
              </SafeSuspense>
            </PlanGate>

            <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Extremo com filtros avançados">
              <SafeSuspense fallback={<LazyFallback />}>
                <ExtremeGeneratorPanel stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />
              </SafeSuspense>
            </PlanGate>

            <PlanGate feature="gerador_avancado" fallbackMessage="Predição com IA avançada">
              <SafeSuspense fallback={<LazyFallback />}>
                <AIPredictionPanel config={config} stats={stats} draws={draws} onSaveBet={handleSaveBet} />
              </SafeSuspense>
            </PlanGate>

            <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Inteligente com análise multi-critério">
              <SafeSuspense fallback={<LazyFallback />}>
                <IntelligentGeneratorPanel stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />
              </SafeSuspense>
            </PlanGate>

            <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Evolutivo com algoritmo genético">
              <SafeSuspense fallback={<LazyFallback />}>
                <EvolutiveGeneratorPanel stats={stats} config={config} draws={draws} lotteryId={selectedLottery} />
              </SafeSuspense>
            </PlanGate>

            <PlanGate feature="gerador_profissional" fallbackMessage="Gerador Profissional com filtros avançados">
              <SafeSuspense fallback={<LazyFallback />}>
                <ProfessionalGeneratorPanel stats={stats} config={config} draws={draws} />
              </SafeSuspense>
            </PlanGate>

            <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Aprimorado e Monte Carlo">
              <div className="grid lg:grid-cols-2 gap-6">
                <SafeSuspense fallback={<LazyFallback />}>
                  <EnhancedBetGenerator stats={stats} config={config} onSaveBet={handleSaveBet} />
                </SafeSuspense>
                <SafeSuspense fallback={<LazyFallback />}>
                  <MonteCarloPanel stats={stats} config={config} />
                </SafeSuspense>
              </div>
            </PlanGate>

            <PlanGate feature="gerador_avancado" fallbackMessage="Otimizador de Apostas">
              <SafeSuspense fallback={<LazyFallback />}>
                <BetOptimizerPanel stats={stats} config={config} draws={draws} />
              </SafeSuspense>
            </PlanGate>

            {/* Bulk check results appear here */}
            <BulkCheckBar />

            {/* Bet Checker stays FREE */}
            <SafeSuspense fallback={<LazyFallback />}>
              <BetChecker draws={draws} drawsWithPrizes={drawsWithPrizes} lotteryId={selectedLottery} maxNumbers={config.numbers} pick={config.pick} stats={stats} config={config} />
            </SafeSuspense>
          </>
        )}
      </div>
    </SelectedBetsProvider>
  );
};

export default GeradorPage;
