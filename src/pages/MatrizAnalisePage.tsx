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
  <div className="rounded-2xl glass-card p-5 border border-border/40 flex items-start gap-4 group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
      {icon}
    </div>
    <div className="min-w-0 relative z-10">
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-1">{label}</p>
      <p className="text-2xl font-black font-mono text-foreground tracking-tighter italic">{value}</p>
      {subtitle && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-40">{subtitle}</p>}
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">Intelligence Matrix v5.3</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
            Matriz de <span className="gradient-brand-text">Análise</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-md">Score inteligente e ranking combinatório completo para detecção de anomalias.</p>
        </div>
      </div>
      
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
        <LotteryContextBanner />
      </div>
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
        <div className="rounded-2xl glass-card p-6 flex flex-col md:flex-row items-center gap-6 border border-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-black text-foreground uppercase tracking-widest text-xs italic">Algoritmo de Scoring</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">Distribuição Ponderada (5 Pilares)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 relative z-10">
            {[
              { label: "Frequência Total", val: "30%", color: "text-emerald-400" },
              { label: "Ciclos Recentes", val: "25%", color: "text-blue-400" },
              { label: "Variação Atraso", val: "20%", color: "text-amber-400" },
              { label: "Momentum", val: "15%", color: "text-purple-400" },
              { label: "Entropia", val: "10%", color: "text-pink-400" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col border-l border-border/40 pl-4">
                <span className={`text-base font-black font-mono italic ${item.color}`}>{item.val}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{item.label}</span>
              </div>
            ))}
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
