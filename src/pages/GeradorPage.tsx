import { lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { BetGenerator } from "@/components/BetGenerator";
import { NumberPickerGrid } from "@/components/NumberPickerGrid";
import { SavedBetsPanel } from "@/components/SavedBetsPanel";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/ComplianceDisclaimer";
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
const WinningsSimulator = lazy(() => import("@/components/WinningsSimulator").then(m => ({ default: m.WinningsSimulator })));

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

          <div className="grid lg:grid-cols-2 gap-6">
            <NumberPickerGrid
              config={config}
              stats={stats}
              onSaveBet={(numbers) => handleSaveBet(numbers, "Manual")}
            />
            <SavedBetsPanel />
          </div>

          {/* PREMIUM: Advanced generators */}
          <PlanGate feature="gerador_avancado" fallbackMessage="Análise de Robustez e Score">
            <Suspense fallback={<LazyFallback />}>
              <RobustnessRadarPanel stats={stats} config={config} draws={draws} lotteryId={selectedLottery} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Extremo com filtros avançados">
            <Suspense fallback={<LazyFallback />}>
              <ExtremeGeneratorPanel stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="gerador_avancado" fallbackMessage="Predição com IA avançada">
            <Suspense fallback={<LazyFallback />}>
              <AIPredictionPanel config={config} stats={stats} draws={draws} onSaveBet={handleSaveBet} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Inteligente com análise multi-critério">
            <Suspense fallback={<LazyFallback />}>
              <IntelligentGeneratorPanel stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Evolutivo com algoritmo genético">
            <Suspense fallback={<LazyFallback />}>
              <EvolutiveGeneratorPanel stats={stats} config={config} draws={draws} lotteryId={selectedLottery} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="gerador_profissional" fallbackMessage="Gerador Profissional com filtros avançados">
            <Suspense fallback={<LazyFallback />}>
              <ProfessionalGeneratorPanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>

          <PlanGate feature="gerador_avancado" fallbackMessage="Gerador Aprimorado e Monte Carlo">
            <div className="grid lg:grid-cols-2 gap-6">
              <Suspense fallback={<LazyFallback />}>
                <EnhancedBetGenerator stats={stats} config={config} onSaveBet={handleSaveBet} />
              </Suspense>
              <Suspense fallback={<LazyFallback />}>
                <MonteCarloPanel stats={stats} config={config} />
              </Suspense>
            </div>
          </PlanGate>

          <PlanGate feature="gerador_avancado" fallbackMessage="Otimizador de Apostas">
            <Suspense fallback={<LazyFallback />}>
              <BetOptimizerPanel stats={stats} config={config} draws={draws} />
            </Suspense>
          </PlanGate>

          {/* Bet Checker stays FREE */}
          <Suspense fallback={<LazyFallback />}>
            <BetChecker draws={draws} drawsWithPrizes={drawsWithPrizes} lotteryId={selectedLottery} maxNumbers={config.numbers} pick={config.pick} />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default GeradorPage;
