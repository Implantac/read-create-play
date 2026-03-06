import { useState, useMemo } from "react";
import { LOTTERIES, getMockDraws } from "@/data/lotteries";
import { computeFrequencyStats, computeSumDistribution } from "@/engine/statistics";
import { LotterySelector } from "@/components/LotterySelector";
import { StatsCard } from "@/components/StatsCard";
import { FrequencyChart } from "@/components/FrequencyChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { BetGenerator } from "@/components/BetGenerator";
import { MonteCarloPanel } from "@/components/MonteCarloPanel";
import { RecentDraws } from "@/components/RecentDraws";
import { SumChart } from "@/components/SumChart";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Flame, Snowflake, Zap } from "lucide-react";

const Index = () => {
  const [selectedLottery, setSelectedLottery] = useState("megasena");

  const config = LOTTERIES.find(l => l.id === selectedLottery)!;
  const draws = useMemo(() => getMockDraws(selectedLottery), [selectedLottery]);
  const stats = useMemo(() => computeFrequencyStats(draws, config.numbers), [draws, config.numbers]);
  const sumData = useMemo(() => computeSumDistribution(draws), [draws]);

  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  const avgDelay = Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length);

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
                <p className="text-xs text-muted-foreground">Análise estatística avançada</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Concursos analisados</p>
              <p className="text-sm font-mono font-bold text-foreground">{draws.length}</p>
            </div>
          </div>
          <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
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

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <FrequencyChart stats={stats} />
          <HeatmapGrid stats={stats} totalNumbers={config.numbers} />
        </div>

        {/* Sum & Recent */}
        <div className="grid lg:grid-cols-2 gap-6">
          <SumChart data={sumData} />
          <RecentDraws draws={draws} />
        </div>

        {/* Generator & Monte Carlo */}
        <div className="grid lg:grid-cols-2 gap-6">
          <BetGenerator stats={stats} config={config} />
          <MonteCarloPanel stats={stats} config={config} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          Prompt Titan Loterias — Motor estatístico v1.0
        </div>
      </footer>
    </div>
  );
};

export default Index;
