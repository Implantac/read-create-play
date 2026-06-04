import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { STRATEGIES, Strategy } from "@/engine/strategies";
import type { MassiveSimResult } from "@/engine/simulators/massive-simulator";
import MonteCarloWorker from "@/workers/monte-carlo.worker?worker";
import { isWorkerMessage, isWorkerProgress, isWorkerResult, isWorkerSimulationResult } from "@/core/workerContracts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Play, Trophy, TrendingUp, BarChart3,
  Calendar, Zap, CheckCircle2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const ITERATION_OPTIONS = [
  { label: "10K", value: 10_000 },
  { label: "50K", value: 50_000 },
  { label: "100K", value: 100_000 },
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
];

const STRATEGY_COLORS = [
  "hsl(142, 70%, 45%)",
  "hsl(200, 90%, 50%)",
  "hsl(280, 70%, 55%)",
  "hsl(45, 95%, 55%)",
  "hsl(0, 80%, 55%)",
  "hsl(170, 70%, 45%)",
];

export function MassiveSimulatorPanel({ stats, config, draws }: Props) {
  const [iterations, setIterations] = useState(50_000);
  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>(["smart", "hot", "cycle", "hybrid"]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<MassiveSimResult | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Reset state when lottery changes
  const prevLotteryId = useRef(config.id);
  useEffect(() => {
    if (prevLotteryId.current !== config.id) {
      prevLotteryId.current = config.id;
      setResult(null);
      setProgress(0);
    }
  }, [config.id]);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => { workerRef.current?.terminate(); };
  }, []);

  const toggleStrategy = (s: Strategy) => {
    setSelectedStrategies(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const runSim = () => {
    if (selectedStrategies.length === 0) return;
    setRunning(true);
    setProgress(0);
    setResult(null);

    workerRef.current?.terminate();

    const worker = new MonteCarloWorker();
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as unknown;

      if (isWorkerMessage(msg)) {
        if (isWorkerProgress(msg) && msg.type === "progress") {
          const d = msg.data as { completed?: unknown; total?: unknown };
          const completed = typeof d.completed === "number" ? d.completed : 0;
          const total = typeof d.total === "number" && d.total > 0 ? d.total : 0;
          if (total > 0) setProgress(Math.round((completed / total) * 100));
          return;
        }

        if (isWorkerResult(msg) && msg.type === "result") {
          // Massive simulator panel uses Monte Carlo worker whose result typing differs.
          // Keep runtime behavior intact; only tighten the check.
          if (isWorkerSimulationResult(msg.data)) {
            setResult(msg.data as MassiveSimResult);
          }
          setProgress(100);
          setRunning(false);
          worker.terminate();
          workerRef.current = null;
          return;
        }
      }

      // Fallback: ignore unknown worker payloads
    };

    worker.onerror = () => {
      setRunning(false);
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({
      type: "run_monte_carlo",
      job: {
        stats: stats.map(s => ({
          number: s.number, frequency: s.frequency, percentage: s.percentage,
          lastSeen: s.lastSeen, trend: s.trend, status: s.status,
          recentFreq: s.recentFreq, stdDevIntervals: s.stdDev,
          momentum: s.momentum, cycleScore: s.cycleScore,
        })),
        config,
        draws,
        simConfig: {
          iterations,
          strategies: selectedStrategies,
          config,
          compareWithRandom: true,
        },
      },
    });
  };

  // Build chart data for hit distribution comparison
  const hitDistChart = result
    ? (() => {
        const allHits = new Set<number>();
        result.performances.forEach(p => {
          Object.keys(p.hitDistribution).forEach(h => allHits.add(Number(h)));
        });
        const sorted = [...allHits].sort((a, b) => a - b).filter(h => h >= Math.max(0, config.pick - 5));

        return sorted.map(hits => {
          const row: any = { hits: `${hits} acertos` };
          result.performances.forEach(p => {
            row[p.label] = Math.round((p.hitDistribution[hits] || 0) / p.totalGames * 10000) / 100;
          });
          return row;
        });
      })()
    : [];

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Rocket className="w-5 h-5 text-primary" />
          Simulador Massivo Monte Carlo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Laboratório estatístico — teste estratégias com centenas de milhares de simulações e projete resultados anuais
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Iteration selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Iterações</label>
          <div className="flex gap-2">
            {ITERATION_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setIterations(opt.value)}
                className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-all ${
                  iterations === opt.value
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Estratégias para testar</label>
          <div className="flex flex-wrap gap-1.5">
            {STRATEGIES.map(s => (
              <button
                key={s.id}
                onClick={() => toggleStrategy(s.id)}
                className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                  selectedStrategies.includes(s.id)
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Run button */}
        <Button
          onClick={runSim}
          disabled={running || selectedStrategies.length === 0}
          className="w-full gap-2"
        >
          {running ? (
            <>
              <Zap className="w-4 h-4 animate-pulse" />
              Simulando {iterations.toLocaleString()} iterações...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Executar {iterations.toLocaleString()} Simulações
            </>
          )}
        </Button>

        {/* Progress */}
        {running && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Summary bar */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground p-2 rounded-lg bg-muted/30 border border-border">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>{result.totalIterations.toLocaleString()} simulações em {result.elapsedMs}ms</span>
                <span>•</span>
                <span>{result.performances.length} estratégias comparadas</span>
              </div>

              {/* Strategy ranking */}
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-primary" /> Ranking de Estratégias
                </h4>
                <div className="space-y-2">
                  {result.performances.map((p, idx) => (
                    <div
                      key={p.strategy}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border"
                    >
                      <span className="text-lg font-bold font-mono text-primary w-7 text-right">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{p.label}</span>
                          {idx === 0 && <Badge variant="default" className="text-[10px]">Melhor</Badge>}
                        </div>
                        <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span>Média: <strong className="text-foreground">{p.avgHits}</strong></span>
                          <span>Melhor: <strong className="text-foreground">{p.bestHit}</strong></span>
                          <span>4+: <strong className="text-foreground">{p.hitRate4Plus}%</strong></span>
                          <span>EV: <strong className="text-primary">{p.expectedValue}x</strong></span>
                        </div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-muted-foreground">Consistência</p>
                        <p className="text-sm font-mono font-bold text-foreground">
                          {(p.consistency * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hit distribution chart */}
              {hitDistChart.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" /> Distribuição de Acertos (%)
                  </h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hitDistChart}>
                        <XAxis dataKey="hits" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} unit="%" />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                            color: "hsl(var(--foreground))",
                            fontSize: 12,
                          }}
                        />
                        <Legend />
                        {result.performances.map((p, i) => (
                          <Bar
                            key={p.strategy}
                            dataKey={p.label}
                            fill={STRATEGY_COLORS[i % STRATEGY_COLORS.length]}
                            fillOpacity={0.8}
                            radius={[2, 2, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Convergence chart */}
              {result.convergenceData.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" /> Convergência da Média
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(() => {
                        // Pivot convergence data by iteration
                        const byIter = new Map<number, any>();
                        result.convergenceData.forEach(d => {
                          if (!byIter.has(d.iteration)) byIter.set(d.iteration, { iteration: d.iteration });
                          byIter.get(d.iteration)![d.strategy] = d.avgHits;
                        });
                        return [...byIter.values()].sort((a, b) => a.iteration - b.iteration);
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="iteration" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
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
                        <Legend />
                        {result.performances.map((p, i) => (
                          <Line
                            key={p.strategy}
                            type="monotone"
                            dataKey={p.label}
                            stroke={STRATEGY_COLORS[i % STRATEGY_COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Yearly projection */}
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Projeção Anual (156 jogos/ano)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left p-2">Estratégia</th>
                        <th className="text-right p-2">4+ acertos</th>
                        <th className="text-right p-2">5+ acertos</th>
                        <th className="text-right p-2">Acerto Total</th>
                        <th className="text-right p-2">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyProjection.map(y => (
                        <tr key={y.strategy} className="border-b border-border/50">
                          <td className="p-2 font-medium text-foreground">{y.strategy}</td>
                          <td className="p-2 text-right font-mono text-foreground">{y.expectedHits4Plus}</td>
                          <td className="p-2 text-right font-mono text-foreground">{y.expectedHits5Plus}</td>
                          <td className="p-2 text-right font-mono text-muted-foreground">{y.expectedFullHits}</td>
                          <td className="p-2 text-right font-mono text-primary font-bold">{y.roi}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
