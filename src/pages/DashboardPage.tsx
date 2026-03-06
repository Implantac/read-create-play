import { useMemo, useCallback } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { StatsCard } from "@/components/StatsCard";
import { FrequencyChart } from "@/components/FrequencyChart";
import { HeatmapGrid } from "@/components/HeatmapGrid";
import { RecentDraws } from "@/components/RecentDraws";
import { SumChart } from "@/components/SumChart";
import { ParityChart } from "@/components/ParityChart";
import { ConsecutiveChart } from "@/components/ConsecutiveChart";
import { RangeDistribution } from "@/components/RangeDistribution";
import { DelayChart } from "@/components/DelayChart";
import { AutoUpdater } from "@/components/AutoUpdater";
import { motion } from "framer-motion";
import { BarChart3, Flame, Snowflake, TrendingUp, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const { config, draws, loading, syncing, stats, sumData, syncDraws, syncAllLotteries, addDraw, selectedLottery } = useLotteryContext();

  const hotNumbers = stats.filter(s => s.status === "hot").length;
  const coldNumbers = stats.filter(s => s.status === "cold").length;
  const avgDelay = stats.length > 0 ? Math.round(stats.reduce((a, s) => a + s.lastSeen, 0) / stats.length) : 0;

  const handleNewDraw = useCallback((draw: any) => addDraw(draw), [addDraw]);

  return (
    <div className="space-y-6">
      {!loading && draws.length === 0 && (
        <div className="rounded-xl bg-card border border-border p-6 text-center space-y-3">
          <Database className="w-8 h-8 mx-auto text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Banco de dados vazio</h3>
          <p className="text-xs text-muted-foreground">Importe os sorteios históricos da API da Caixa</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={syncDraws} disabled={syncing} className="gap-1">
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              Importar {config.name}
            </Button>
            <Button onClick={syncAllLotteries} disabled={syncing} variant="outline" className="gap-1">
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              Importar Todas
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando resultados...</span>
        </div>
      )}

      {draws.length > 0 && (
        <>
          <AutoUpdater lotteryId={selectedLottery} onNewDraw={handleNewDraw} latestConcurso={draws[0]?.concurso || 0} />

          <motion.div key={selectedLottery} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Concursos" value={draws.length} icon={BarChart3} color="green" subtitle="Resultados históricos" />
            <StatsCard title="Números Quentes" value={hotNumbers} icon={Flame} color="red" subtitle="Acima da média" />
            <StatsCard title="Números Frios" value={coldNumbers} icon={Snowflake} color="blue" subtitle="Abaixo da média" />
            <StatsCard title="Atraso Médio" value={`${avgDelay}d`} icon={TrendingUp} color="amber" subtitle="Concursos sem aparecer" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <FrequencyChart stats={stats} />
            <HeatmapGrid stats={stats} totalNumbers={config.numbers} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ParityChart draws={draws} />
            <ConsecutiveChart draws={draws} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <RangeDistribution draws={draws} config={config} />
            <DelayChart stats={stats} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <SumChart data={sumData} />
            <RecentDraws draws={draws} />
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
