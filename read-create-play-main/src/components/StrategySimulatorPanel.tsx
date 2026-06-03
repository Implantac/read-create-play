import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NumberStats } from "@/engine/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import {
  runIntelligentPipeline,
  IntelligentPipelineResult,
} from "@/ai/knowledge/strategiesLibrary";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair, Play, Trophy, TrendingUp, Zap, Target, BarChart3,
  CheckCircle2, XCircle, Minus, FileDown,
} from "lucide-react";
import { exportToPdf } from "@/engine/pdf-export";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const STRATEGIES = [
  { id: "frequency", name: "Frequência", icon: "🔥", color: "hsl(var(--chart-1))" },
  { id: "delay", name: "Atraso", icon: "⏳", color: "hsl(var(--chart-2))" },
  { id: "balance", name: "Equilíbrio", icon: "⚖️", color: "hsl(var(--chart-3))" },
  { id: "dispersion", name: "Dispersão", icon: "🎯", color: "hsl(var(--chart-4))" },
  { id: "anti_pattern", name: "Anti-Padrões", icon: "🛡️", color: "hsl(var(--chart-5))" },
  { id: "coverage", name: "Cobertura", icon: "🌐", color: "hsl(var(--primary))" },
];

const GAME_COUNTS = [5, 10, 20, 50];

interface SimulationResult {
  strategyId: string;
  strategyName: string;
  games: number[][];
  scores: number[];
  // Performance against historical draws
  performance: {
    totalDrawsTested: number;
    hitDistribution: Record<number, number>;
    avgHits: number;
    maxHits: number;
    winCount: number;
    winRate: number;
    avgScore: number;
    bestGame: { numbers: number[]; avgHits: number };
    worstGame: { numbers: number[]; avgHits: number };
    consistency: number; // 0-1
  };
  pipeline: { step: string; detail: string; count: number }[];
}

function simulateAgainstHistory(
  games: number[][],
  draws: DrawResult[],
  config: LotteryConfig,
  scores: number[]
): SimulationResult["performance"] {
  const testDraws = draws.slice(0, Math.min(100, draws.length));
  const hitDistribution: Record<number, number> = {};
  const gamePerf = games.map((game, gi) => {
    const gameSet = new Set(game);
    let totalHits = 0;
    let maxH = 0;

    for (const draw of testDraws) {
      const hits = draw.numbers.filter((n) => gameSet.has(n)).length;
      totalHits += hits;
      maxH = Math.max(maxH, hits);
      hitDistribution[hits] = (hitDistribution[hits] || 0) + 1;
    }

    return {
      numbers: game,
      avgHits: totalHits / testDraws.length,
      maxHits: maxH,
      score: scores[gi] || 0,
    };
  });

  const minPrizeMap: Record<string, number> = {
    megasena: 4, lotofacil: 11, quina: 2, lotomania: 15,
    duplasena: 3, timemania: 3, diadesorte: 4, supersete: 3,
  };
  const minPrize = minPrizeMap[config.id] || (config.pick <= 6 ? 4 : config.pick <= 10 ? 5 : config.pick - 4);

  let winCount = 0;
  for (const [hits, count] of Object.entries(hitDistribution)) {
    if (Number(hits) >= minPrize) winCount += count;
  }

  const totalTests = testDraws.length * games.length;
  const avgHits = gamePerf.reduce((s, g) => s + g.avgHits, 0) / gamePerf.length;

  // Consistency via std dev
  const mean = avgHits;
  const variance = gamePerf.reduce((s, g) => s + (g.avgHits - mean) ** 2, 0) / gamePerf.length;
  const consistency = Math.max(0, Math.min(1, 1 - Math.sqrt(variance) / (config.pick * 0.3)));

  const best = gamePerf.reduce((b, g) => (g.avgHits > b.avgHits ? g : b));
  const worst = gamePerf.reduce((w, g) => (g.avgHits < w.avgHits ? g : w));

  return {
    totalDrawsTested: testDraws.length,
    hitDistribution,
    avgHits,
    maxHits: Math.max(...gamePerf.map((g) => g.maxHits)),
    winCount,
    winRate: totalTests > 0 ? Math.round((winCount / totalTests) * 10000) / 100 : 0,
    avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    bestGame: { numbers: best.numbers, avgHits: best.avgHits },
    worstGame: { numbers: worst.numbers, avgHits: worst.avgHits },
    consistency,
  };
}

export function StrategySimulatorPanel({ stats, config, draws }: Props) {
  const [selectedStrategy, setSelectedStrategy] = useState(STRATEGIES[0].id);
  const [gameCount, setGameCount] = useState(10);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<SimulationResult[]>([]);

  const prevLotteryId = useRef(config.id);
  useEffect(() => {
    if (prevLotteryId.current !== config.id) {
      prevLotteryId.current = config.id;
      setResult(null);
      setCompareResults([]);
    }
  }, [config.id]);

  const runSimulation = () => {
    setRunning(true);
    setTimeout(() => {
      if (compareMode) {
        const results: SimulationResult[] = STRATEGIES.map((s) => {
          const pipeline = runIntelligentPipeline(stats, draws, config.id, s.id, gameCount);
          const perf = simulateAgainstHistory(pipeline.games, draws, config, pipeline.scores);
          return {
            strategyId: s.id,
            strategyName: s.name,
            games: pipeline.games,
            scores: pipeline.scores,
            performance: perf,
            pipeline: pipeline.pipeline,
          };
        });
        results.sort((a, b) => b.performance.avgHits - a.performance.avgHits);
        setCompareResults(results);
        setResult(null);
      } else {
        const pipeline = runIntelligentPipeline(stats, draws, config.id, selectedStrategy, gameCount);
        const perf = simulateAgainstHistory(pipeline.games, draws, config, pipeline.scores);
        setResult({
          strategyId: selectedStrategy,
          strategyName: STRATEGIES.find((s) => s.id === selectedStrategy)!.name,
          games: pipeline.games,
          scores: pipeline.scores,
          performance: perf,
          pipeline: pipeline.pipeline,
        });
        setCompareResults([]);
      }
      setRunning(false);
    }, 80);
  };

  const radarData = compareResults.length > 0
    ? [
        { metric: "Média Acertos", ...Object.fromEntries(compareResults.map((r) => [r.strategyName, Math.round(r.performance.avgHits * 100) / 100])) },
        { metric: "Taxa Vitória", ...Object.fromEntries(compareResults.map((r) => [r.strategyName, r.performance.winRate])) },
        { metric: "Consistência", ...Object.fromEntries(compareResults.map((r) => [r.strategyName, Math.round(r.performance.consistency * 100)])) },
        { metric: "Score Médio", ...Object.fromEntries(compareResults.map((r) => [r.strategyName, Math.round(r.performance.avgScore)])) },
        { metric: "Melhor Acerto", ...Object.fromEntries(compareResults.map((r) => [r.strategyName, r.performance.maxHits])) },
      ]
    : [];

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Crosshair className="w-5 h-5 text-primary" />
          Simulador de Estratégias Profissionais
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Escolha uma estratégia, defina a quantidade de jogos e simule o desempenho contra {draws.length} concursos reais
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode toggle */}
        <div className="flex gap-2">
          <Button
            variant={!compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareMode(false)}
            className="text-xs"
          >
            <Target className="w-3.5 h-3.5 mr-1" /> Individual
          </Button>
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            onClick={() => setCompareMode(true)}
            className="text-xs"
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1" /> Comparar Todas
          </Button>
        </div>

        {/* Strategy selector (individual mode) */}
        {!compareMode && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStrategy(s.id)}
                className={`flex items-center gap-2 text-xs px-3 py-2.5 rounded-lg border transition-all ${
                  selectedStrategy === s.id
                    ? "border-primary text-primary bg-primary/10 shadow-sm"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <span className="font-medium">{s.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Game count */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted-foreground whitespace-nowrap">Jogos por estratégia:</span>
          <div className="flex gap-1.5">
            {GAME_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => setGameCount(n)}
                className={`font-mono px-2.5 py-1 rounded-md border transition-all ${
                  gameCount === n
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Run & Export buttons */}
        <div className="flex gap-2">
          <Button onClick={runSimulation} disabled={running || draws.length === 0} className="flex-1 gap-2">
            {running ? <Zap className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
            {running
              ? "Simulando..."
              : compareMode
              ? `Comparar 6 estratégias × ${gameCount} jogos`
              : `Simular ${gameCount} jogos com ${STRATEGIES.find((s) => s.id === selectedStrategy)?.name}`}
          </Button>
          {(result || compareResults.length > 0) && (
            <Button
              variant="outline"
              size="icon"
              title="Exportar PDF"
              onClick={() => {
                const source = compareMode ? compareResults : result ? [result] : [];
                if (source.length === 0) return;
                const bets = source.flatMap((r) =>
                  r.games.map((g, i) => ({
                    numbers: g,
                    strategy: r.strategyName,
                    score: Math.round(r.scores[i] || 0),
                    grade: r.scores[i] >= 80 ? "S" : r.scores[i] >= 60 ? "A" : r.scores[i] >= 40 ? "B" : "C",
                  }))
                );
                const best = source[0];
                exportToPdf({
                  title: compareMode
                    ? "Comparativo de Estratégias"
                    : `Simulação — ${best.strategyName}`,
                  subtitle: compareMode
                    ? `${source.length} estratégias · Melhor: ${best.strategyName} (Média ${best.performance.avgHits.toFixed(2)} acertos, Win ${best.performance.winRate}%)`
                    : `${best.games.length} jogos · Média ${best.performance.avgHits.toFixed(2)} acertos · Win Rate ${best.performance.winRate}% · Consistência ${Math.round(best.performance.consistency * 100)}%`,
                  config,
                  bets,
                  type: "apostas",
                });
              }}
            >
              <FileDown className="w-4 h-4" />
            </Button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {/* Individual result */}
          {result && !compareMode && (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Pipeline */}
              <div className="flex flex-wrap gap-1.5">
                {result.pipeline.map((p, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                    {p.step}: {p.detail}
                  </Badge>
                ))}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Média Acertos" value={result.performance.avgHits.toFixed(2)} icon={<TrendingUp className="w-4 h-4" />} />
                <MetricCard label="Melhor Acerto" value={String(result.performance.maxHits)} icon={<Trophy className="w-4 h-4" />} />
                <MetricCard label="Taxa Vitória" value={`${result.performance.winRate}%`} icon={<Target className="w-4 h-4" />} />
                <MetricCard label="Score Médio" value={result.performance.avgScore.toFixed(0)} icon={<Crosshair className="w-4 h-4" />} />
              </div>

              {/* Consistency */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                <span className="text-xs text-muted-foreground">Consistência:</span>
                <Progress value={result.performance.consistency * 100} className="flex-1 h-2" />
                <span className="text-sm font-mono font-bold text-primary">
                  {Math.round(result.performance.consistency * 100)}%
                </span>
              </div>

              {/* Hit distribution chart */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={Object.entries(result.performance.hitDistribution)
                      .map(([hits, count]) => ({ hits: `${hits} acertos`, count }))
                      .sort((a, b) => parseInt(a.hits) - parseInt(b.hits))}
                  >
                    <XAxis dataKey="hits" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        color: "hsl(var(--foreground))",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="Ocorrências" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 5 games */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Top 5 Jogos Gerados</p>
                {result.games.slice(0, 5).map((game, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/10 border border-border">
                    <span className="text-xs font-mono font-bold text-primary w-5">#{idx + 1}</span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {game.map((n) => (
                        <span key={n} className="text-[11px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Score: {result.scores[idx]?.toFixed(0) || "–"}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Compare results */}
          {compareResults.length > 0 && compareMode && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Ranking */}
              <div className="space-y-2">
                {compareResults.map((r, idx) => {
                  const strat = STRATEGIES.find((s) => s.id === r.strategyId);
                  return (
                    <div key={r.strategyId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                      <span className="text-lg font-bold font-mono text-primary w-7 text-right">#{idx + 1}</span>
                      <span className="text-base">{strat?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{r.strategyName}</span>
                          {idx === 0 && (
                            <Badge variant="default" className="text-[10px]">
                              <Trophy className="w-2.5 h-2.5 mr-0.5" />Melhor
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span>Média: <strong className="text-foreground">{r.performance.avgHits.toFixed(2)}</strong></span>
                          <span>Melhor: <strong className="text-foreground">{r.performance.maxHits}</strong></span>
                          <span>Win: <strong className="text-primary">{r.performance.winRate}%</strong></span>
                          <span>Score: <strong className="text-foreground">{r.performance.avgScore.toFixed(0)}</strong></span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-muted-foreground">Consistência</p>
                        <div className="flex items-center gap-1">
                          <Progress value={r.performance.consistency * 100} className="w-16 h-1.5" />
                          <span className="text-xs font-mono text-foreground">{Math.round(r.performance.consistency * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Radar chart */}
              {radarData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <PolarRadiusAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                      {compareResults.slice(0, 6).map((r, i) => (
                        <Radar
                          key={r.strategyId}
                          name={r.strategyName}
                          dataKey={r.strategyName}
                          stroke={STRATEGIES[i]?.color || "hsl(var(--primary))"}
                          fill={STRATEGIES[i]?.color || "hsl(var(--primary))"}
                          fillOpacity={0.1}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
      <div className="flex justify-center text-primary mb-1">{icon}</div>
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
