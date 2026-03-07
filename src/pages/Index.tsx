import { useState, useMemo, useCallback } from "react";
import { LOTTERIES, DrawResult } from "@/data/lotteries";
import { computeFrequencyStats, computeSumDistribution } from "@/engine/statistics";
import { useLotteryDraws } from "@/hooks/useLotteryDraws";
import { LotterySelector } from "@/components/LotterySelector";
import { StatsCard } from "@/components/StatsCard";
import { FrequencyChart } from "@/components/FrequencyChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { EnhancedBetGenerator } from "@/components/EnhancedBetGenerator";
import { ProfessionalGeneratorPanel } from "@/components/ProfessionalGeneratorPanel";
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
import { BetOptimizerPanel } from "@/components/BetOptimizerPanel";
import { BacktestPanel } from "@/components/BacktestPanel";
import { HPEnginePanel } from "@/components/HPEnginePanel";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Flame, Snowflake, Zap, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedLottery, setSelectedLottery] = useState("megasena");
  const config = LOTTERIES.find(l => l.id === selectedLottery)!;
  const { draws, loading, syncing, count, syncDraws, syncAllLotteries, addDraw } = useLotteryDraws(selectedLottery);
  const stats = useMemo(() => computeFrequencyStats(draws, config.numbers), [draws, config.numbers]);
  const sumData = useMemo(() => computeSumDistribution(draws), [draws]);
  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  const avgDelay = Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length);
  const handleNewDraw = useCallback((draw: DrawResult) => { addDraw(draw); }, [addDraw]);
  const handleLotteryChange = useCallback((id: string) => { setSelectedLottery(id); }, []);

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-green">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">Titan <span className="text-primary text-glow-green">Loterias</span></h1>
                <p className="text-xs text-muted-foreground">Análise estatística avançada + IA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Concursos no banco</p>
                <p className="text-sm font-mono font-bold text-foreground">{loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : count}</p>
              </div>
              <Button size="sm" variant="outline" onClick={syncDraws} disabled={syncing} className="hidden sm:flex gap-1 text-xs">
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                {syncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </div>
          </div>
          <LotterySelector selected={selectedLottery} onSelect={handleLotteryChange} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6">
        {!loading && draws.length === 0 && (
          <div className="rounded-xl bg-card border border-border p-6 text-center space-y-3">
            <Database className="w-8 h-8 mx-auto text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Banco de dados vazio</h3>
            <p className="text-xs text-muted-foreground">Clique para importar todos os sorteios históricos da API da Caixa</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={syncDraws} disabled={syncing} className="gap-1">{syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}Importar {config.name}</Button>
              <Button onClick={syncAllLotteries} disabled={syncing} variant="outline" className="gap-1">{syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}Importar Todas</Button>
            </div>
          </div>
        )}
        {loading && (<div className="flex items-center justify-center py-12 gap-2 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin" /><span className="text-sm">Carregando resultados...</span></div>)}
        {draws.length > 0 && (
          <>
            <AutoUpdater lotteryId={selectedLottery} onNewDraw={handleNewDraw} latestConcurso={draws[0]?.concurso || 0} />
            <motion.div key={selectedLottery} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard title="Total Concursos" value={draws.length} icon={BarChart3} color="green" subtitle="Resultados históricos" />
              <StatsCard title="Números Quentes" value={hotNumbers} icon={Flame} color="red" subtitle="Acima da média" />
              <StatsCard title="Números Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle="Abaixo da média" />
              <StatsCard title="Atraso Médio" value={`${avgDelay}d`} icon={TrendingUp} color="amber" subtitle="Concursos sem aparecer" />
            </motion.div>
            <div className="grid lg:grid-cols-2 gap-6"><FrequencyChart stats={stats} /><HeatmapGrid stats={stats} totalNumbers={config.numbers} /></div>
            <div className="grid lg:grid-cols-2 gap-6"><ParityChart draws={draws} /><ConsecutiveChart draws={draws} /></div>
            <div className="grid lg:grid-cols-2 gap-6"><RangeDistribution draws={draws} config={config} /><DelayChart stats={stats} /></div>
            <div className="grid lg:grid-cols-2 gap-6"><SumChart data={sumData} /><RecentDraws draws={draws} /></div>
            <MLPanel stats={stats} config={config} />
            <AdvancedAnalyticsPanel stats={stats} draws={draws} config={config} />
            <ConditionalProbabilityPanel draws={draws} config={config} />
            <div className="grid lg:grid-cols-2 gap-6"><BetChecker draws={draws} lotteryId={selectedLottery} maxNumbers={config.numbers} pick={config.pick} /><GameSimulator stats={stats} config={config} draws={draws} /></div>
            <MassiveSimulatorPanel stats={stats} config={config} draws={draws} />
            <HPEnginePanel stats={stats} config={config} draws={draws} />
            <div className="grid lg:grid-cols-2 gap-6"><BetOptimizerPanel stats={stats} config={config} draws={draws} /><BacktestPanel stats={stats} config={config} draws={draws} /></div>
            <ProfessionalGeneratorPanel stats={stats} config={config} draws={draws} />
            <div className="grid lg:grid-cols-2 gap-6"><EnhancedBetGenerator stats={stats} config={config} /><MonteCarloPanel stats={stats} config={config} /></div>
          </>
        )}
      </main>
      <footer className="border-t border-border py-4 mt-8"><div className="container mx-auto px-4 text-center text-xs text-muted-foreground">Titan Loterias — Motor estatístico v4.0 + Machine Learning + Banco de Dados + API Caixa</div></footer>
    </div>
  );
};

export default Index;
