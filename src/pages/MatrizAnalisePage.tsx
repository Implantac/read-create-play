import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { SelectedBetsProvider } from "@/contexts/SelectedBetsContext";
import { computeMatrixAnalysis } from "@/engine/matrix-analysis";
import { MatrizAnaliseTable } from "@/components/MatrizAnaliseTable";
import { FarolDezenas } from "@/components/FarolDezenas";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { ComplianceDisclaimer } from "@/components/ComplianceDisclaimer";
import { PlanGate } from "@/components/PlanGate";
import { useSavedBets } from "@/hooks/useSavedBets";
import { Grid3X3, Loader2, TrendingUp, TrendingDown, Clock, BarChart3, Zap } from "lucide-react";
import { lazy, Suspense } from "react";

const SmartUnfoldingGenerator = lazy(() =>
  import("@/components/SmartUnfoldingGenerator").then(m => ({ default: m.SmartUnfoldingGenerator }))
);

const LazyFallback = () => (
  <div className="flex items-center justify-center py-8 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin mr-2" />
    <span className="text-sm">Carregando módulo...</span>
  </div>
);

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

const SummaryCard = ({ icon, label, value, subtitle, color }: SummaryCardProps) => (
  <div className={`rounded-xl glass-card p-4 border border-border/50 flex items-start gap-3 group hover:scale-[1.02] transition-transform`}>
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-lg font-bold font-mono text-foreground leading-tight">{value}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const MatrizAnalisePage = () => {
  const { config, draws, syncing, syncDraws, syncAllLotteries, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);

  const matrixData = useMemo(
    () => computeMatrixAnalysis(draws, config.numbers),
    [draws, config.numbers]
  );

  const summaryStats = useMemo(() => {
    if (matrixData.length === 0) return null;
    const greens = matrixData.filter(d => d.signal === "green");
    const reds = matrixData.filter(d => d.signal === "red");
    const rising = matrixData.filter(d => d.trend === "up");
    const falling = matrixData.filter(d => d.trend === "down");
    const avgScore = Math.round(matrixData.reduce((s, r) => s + r.score, 0) / matrixData.length);
    const maxDelay = Math.max(...matrixData.map(r => r.currentDelay));
    const topNumber = matrixData[0];
    return { greens: greens.length, reds: reds.length, rising: rising.length, falling: falling.length, avgScore, maxDelay, topNumber };
  }, [matrixData]);

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

        {/* Summary Cards */}
        {summaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard
              icon={<Zap className="w-4.5 h-4.5 text-amber-300" />}
              label="Score Médio"
              value={summaryStats.avgScore}
              subtitle="de 100 pontos"
              color="bg-amber-500/10 border border-amber-500/20"
            />
            <SummaryCard
              icon={<TrendingUp className="w-4.5 h-4.5 text-emerald-300" />}
              label="Em Alta"
              value={summaryStats.rising}
              subtitle={`de ${config.numbers} dezenas`}
              color="bg-emerald-500/10 border border-emerald-500/20"
            />
            <SummaryCard
              icon={<TrendingDown className="w-4.5 h-4.5 text-red-300" />}
              label="Em Baixa"
              value={summaryStats.falling}
              subtitle={`de ${config.numbers} dezenas`}
              color="bg-red-500/10 border border-red-500/20"
            />
            <SummaryCard
              icon={<Clock className="w-4.5 h-4.5 text-blue-300" />}
              label="Maior Atraso"
              value={`${summaryStats.maxDelay}x`}
              subtitle="sorteios sem sair"
              color="bg-blue-500/10 border border-blue-500/20"
            />
          </div>
        )}

        {/* Score methodology */}
        <div className="rounded-xl glass-card p-4 flex items-start gap-3 text-xs text-muted-foreground border border-border/30">
          <BarChart3 className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold text-foreground mb-1">Fórmula do Score (5 Pilares)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span><strong className="text-emerald-400">30%</strong> Frequência Total</span>
              <span><strong className="text-blue-400">25%</strong> Frequência Recente</span>
              <span><strong className="text-amber-400">20%</strong> Baixo Atraso</span>
              <span><strong className="text-purple-400">15%</strong> Tendência</span>
              <span><strong className="text-pink-400">10%</strong> Consistência</span>
            </div>
          </div>
        </div>

        {/* Farol */}
        <FarolDezenas
          data={matrixData}
          totalNumbers={config.numbers}
          pickSize={config.pick}
          onSaveBet={(numbers, strategy, score) => handleSaveBet(numbers, strategy, score)}
        />

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
