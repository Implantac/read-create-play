import { useMemo, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { SelectedBetsProvider } from "@/contexts/SelectedBetsContext";
import { computeMatrixAnalysis } from "@/engine/matrix-analysis";
import { MatrizAnaliseTable } from "@/components/MatrizAnaliseTable";
import { FarolDezenas } from "@/components/FarolDezenas";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/ComplianceDisclaimer";
import { PlanGate } from "@/components/PlanGate";
import { useSavedBets } from "@/hooks/useSavedBets";
import { Grid3X3, Loader2, Info } from "lucide-react";

const SmartUnfoldingGenerator = lazy(() =>
  import("@/components/SmartUnfoldingGenerator").then(m => ({ default: m.SmartUnfoldingGenerator }))
);

const LazyFallback = () => (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mr-2" />
    <span className="text-sm">Carregando módulo...</span>
  </div>
);

const MatrizAnalisePage = () => {
  const { config, draws, syncing, syncDraws, syncAllLotteries, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);

  const matrixData = useMemo(
    () => computeMatrixAnalysis(draws, config.numbers),
    [draws, config.numbers]
  );

  const handleSaveBet = (numbers: number[], strategy?: string, score?: number, grade?: string) => {
    saveBet({ numbers, strategy, score, grade });
  };

  if (draws.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Matriz de Análise" description="Base estatística completa com score inteligente" icon={Grid3X3} />
        <LotteryContextBanner />
        <EmptyState onImport={syncDraws} onImportAll={syncAllLotteries} lotteryName={config.name} syncing={syncing} />
      </div>
    );
  }

  return (
    <SelectedBetsProvider>
      <div className="space-y-6">
        <PageHeader
          title="Matriz de Análise"
          description={`Score inteligente e ranking completo — ${config.name}`}
          icon={Grid3X3}
          badge={`${draws.length} sorteios`}
        />
        <LotteryContextBanner />
        <ComplianceDisclaimer />

        {/* Score methodology */}
        <div className="rounded-xl glass-card p-4 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold text-foreground mb-1">Como o Score Funciona</p>
            <p>
              Score = (30% × Frequência Total) + (25% × Frequência Recente) + (20% × Baixo Atraso) + (15% × Tendência) + (10% × Consistência Histórica).
              Todos os valores são normalizados de 0 a 100. O ranking final determina a classificação no Farol.
            </p>
          </div>
        </div>

        {/* Farol */}
        <FarolDezenas data={matrixData} totalNumbers={config.numbers} />

        {/* Matrix Table */}
        <MatrizAnaliseTable data={matrixData} />

        {/* Smart Unfolding Generator */}
        <PlanGate feature="gerador_avancado" fallbackMessage="Desdobramento Inteligente baseado no Score">
          <Suspense fallback={<LazyFallback />}>
            <SmartUnfoldingGenerator
              matrixData={matrixData}
              config={config}
              onSaveBet={handleSaveBet}
            />
          </Suspense>
        </PlanGate>
      </div>
    </SelectedBetsProvider>
  );
};

export default MatrizAnalisePage;
