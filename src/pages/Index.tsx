import { useState, useMemo, useCallback } from "react";
import { LOTTERIES, getMockDraws, DrawResult } from "@/data/lotteries";
import { computeFrequencyStats, computeSumDistribution } from "@/engine/statistics";
import { LotterySelector } from "@/components/LotterySelector";
import { StatsCard } from "@/components/StatsCard";
import { FrequencyChart } from "@/components/FrequencyChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { EnhancedBetGenerator } from "@/components/EnhancedBetGenerator";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { RecentDraws } from "@/components/RecentDraws";
import { SumChart } from "@/components/SumChart";
import { ParityChart } from "@/components/ParityChart";
import { ConsecutiveChart } from "@/components/ConsecutiveChart";
import { RangeDistribution } from "@/components/RangeDistribution";
import { DelayChart } from "@/components/DelayChart";
import { MLPanel } from "@/components/MLPanel";
import { AdvancedAnalyticsPanel } from "@/components/AdvancedAnalyticsPanel";
import { BetChecker } from "@/components/BetChecker";
import { GameSimulator } from "@/components/GameSimulator";
import { AutoUpdater } from "@/components/AutoUpdater";
import { ConditionalProbabilityPanel } from "@/components/ConditionalProbabilityPanel";
import { MassiveSimulatorPanel } from "@/components/MassiveSimulatorPanel";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Flame, Snowflake, Zap } from "lucide-react";

const Index = () => {
  const [selectedLottery, setSelectedLottery] = useState("megasena");
  const [extraDraws, setExtraDraws] = useState<DrawResult[]>([]);

  const config = LOTTERIES.find(l => l.id === selectedLottery)!;
  const mockDraws = useMemo(() => getMockDraws(selectedLottery), [selectedLottery]);

  const draws = useMemo(() => {
    const all = [...extraDraws, ...mockDraws];
    // Deduplicate by concurso
    const seen = new Set<number>();
    return all.filter(d => {
      if (seen.has(d.concurso)) return false;
      seen.add(d.concurso);
      return true;
    }).sort((a, b) => b.concurso - a.concurso);
  }, [mockDraws, extraDraws]);

  const stats = useMemo(() => computeFrequencyStats(draws, config.numbers), [draws, config.numbers]);
  const sumData = useMemo(() => computeSumDistribution(draws), [draws]);

  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  const avgDelay = Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length);

  const handleNewDraw = useCallback((draw: DrawResult) => {
    setExtraDraws(prev => [draw, ...prev]);
  }, []);

  const handleLotteryChange = useCallback((id: string) => {
    setSelectedLottery(id);
    setExtraDraws([]);
  }, []);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-green">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">
                  Prompt Titan <span className="text-primary text-glow-green">Loterias</span>
                </h1>
                <p className="text-xs text-muted-foreground">Análise estatística avançada + IA</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Concursos analisados</p>
              <p className="text-sm font-mono font-bold text-foreground">{draws.length}</p>
            </div>
          </div>
          <LotterySelector selected={selectedLottery} onSelect={handleLotteryChange} />
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Auto Updater */}
        <AutoUpdater
          lotteryId={selectedLottery}
          onNewDraw={handleNewDraw}
          latestConcurso={draws[0]?.concurso || 0}
        />

        {/* Stats Cards */}
        <motion.div
          key={selectedLottery}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatsCard title="Total Concursos" value={draws.length} icon={BarChart3} color="green" subtitle="Resultados históricos" />
          <StatsCard title="Números Quentes" value={hotNumbers} icon={Flame} color="red" subtitle="Acima da média" />
          <StatsCard title="Números Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle="Abaixo da média" />
          <StatsCard title="Atraso Médio" value={`${avgDelay}d`} icon={TrendingUp} color="amber" subtitle="Concursos sem aparecer" />
        </motion.div>

        {/* Frequency & Heatmap */}
        <div className="grid lg:grid-cols-2 gap-6">
          <FrequencyChart stats={stats} />
          <HeatmapGrid stats={stats} totalNumbers={config.numbers} />
        </div>

        {/* Parity & Consecutive */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ParityChart draws={draws} />
          <ConsecutiveChart draws={draws} />
        </div>

        {/* Range & Delay */}
        <div className="grid lg:grid-cols-2 gap-6">
          <RangeDistribution draws={draws} config={config} />
          <DelayChart stats={stats} />
        </div>

        {/* Sum & Recent */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SumChart data={sumData} />
          <RecentDraws draws={draws} />
        </div>

        {/* ML Panel - Full Width */}
        <MLPanel stats={stats} config={config} />

        {/* Advanced Analytics - Full Width */}
        <AdvancedAnalyticsPanel stats={stats} draws={draws} config={config} />

        {/* Conditional Probability - Full Width */}
        <ConditionalProbabilityPanel draws={draws} config={config} />

        {/* Game Checker & Simulator */}
        <div className="grid lg:grid-cols-2 gap-6">
          <BetChecker
            draws={draws}
            lotteryId={selectedLottery}
            maxNumbers={config.numbers}
            pick={config.pick}
          />
          <GameSimulator stats={stats} config={config} draws={draws} />
        </div>

        {/* Enhanced Generator & Monte Carlo */}
        <div className="grid lg:grid-cols-2 gap-6">
          <EnhancedBetGenerator stats={stats} config={config} />
          <MonteCarloPanel stats={stats} config={config} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Prompt Titan Loterias — Motor estatístico v3.0 + Machine Learning + API Caixa
        </div>
      </footer>
    </div>
  );
};

export default Index;
