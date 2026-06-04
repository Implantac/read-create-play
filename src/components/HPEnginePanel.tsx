import { useState } from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NumberStats } from "@/engine/stats/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import {
  runHPMonteCarlo,
  runHPOptimization,
  runBenchmark,
  HPSimResult,
  HPOptResult,
  BenchmarkResult,
} from "@/engine/math/hp-math-engine";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu, Play, Zap, Gauge, Trophy, BarChart3, Rocket, Timer,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid,
} from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const ITER_OPTIONS = [
  { label: "100K", value: 100_000 },
  { label: "500K", value: 500_000 },
  { label: "1M", value: 1_000_000 },
  { label: "5M", value: 5_000_000 },
  { label: "10M", value: 10_000_000 },
];

export function HPEnginePanel({ stats, config, draws }: Props) {
  const [iterations, setIterations] = useState(1_000_000);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simResult, setSimResult] = useState<HPSimResult | null>(null);
  const [optResult, setOptResult] = useState<HPOptResult | null>(null);
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [mode, setMode] = useState<"montecarlo" | "optimize" | "benchmark">("montecarlo");

  const buildWeights = (): Float32Array => {
    const w = new Float32Array(config.numbers);
    stats.forEach(s => {
      w[s.number - 1] = Math.max(0.1,
        s.recentFreq * 2 +
        (s.trend > 0 ? s.trend * 3 : 0.5) +
        s.cycleScore * 4 +
        (s.momentum > 0 ? s.momentum : 0) +
        (s.status === "hot" ? 3 : s.status === "cold" && s.cycleScore > 1.2 ? 2 : 1)
      );
    });
    return w;
  };

  const runSim = () => {
    setRunning(true);
    setProgress(10);

    // Animate progress then run
    let step = 0;
    const progressTimer = setInterval(() => {
      step++;
      setProgress(Math.min(85, step * 5));
    }, 100);

    setTimeout(() => {
      if (mode === "montecarlo") {
        const weights = buildWeights();
        const result = runHPMonteCarlo({
          maxNumber: config.numbers,
          pick: config.pick,
          iterations,
          lotteryId: config.id,
          weights,
        });
        setSimResult(result);
        setOptResult(null);
        setBenchmark(null);
      } else if (mode === "optimize") {
        const weights = buildWeights();
        const historicalDraws = draws.slice(0, 50).map(d => {
          const arr = new Uint8Array(d.numbers.length);
          d.numbers.forEach((n, i) => arr[i] = n);
          arr.sort();
          return arr;
        });
        const result = runHPOptimization({
          maxNumber: config.numbers,
          pick: config.pick,
          generations: Math.min(iterations, 10000),
          populationSize: 30,
          weights,
          historicalDraws,
        });
        setOptResult(result);
        setSimResult(null);
        setBenchmark(null);
      } else {
        const result = runBenchmark(config.numbers, config.pick);
        setBenchmark(result);
        setSimResult(null);
        setOptResult(null);
      }

      clearInterval(progressTimer);
      setProgress(100);
      setRunning(false);
    }, 200);
  };

  // Chart data for hit distribution
  const hitChartData = simResult
    ? Array.from(simResult.hitDistribution).map((count, hits) => ({
        hits: `${hits}`,
        count,
        pct: Math.round((count / simResult.iterationsCompleted) * 10000) / 100,
      })).filter(d => d.count > 0)
    : [];

  // Convergence chart for optimizer
  const convData = optResult
    ? Array.from(optResult.convergence).filter(v => v > 0).map((score, i) => ({
        gen: i * Math.max(1, Math.floor(10000 / 200)),
        score: Math.round(score * 100) / 100,
      }))
    : [];

  const fmtN = (n: number) => {
    return formatNumber(n);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Rocket className="w-5 h-5 text-primary" />
          Motor Matemático de Alta Performance
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          TypedArrays + LCG PRNG + Fisher-Yates + Merge Intersection — milhões de operações por segundo
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode selector */}
        <div className="flex gap-2">
          {([
            { id: "montecarlo", label: "Monte Carlo HP", icon: Cpu },
            { id: "optimize", label: "Otimização HP", icon: Zap },
            { id: "benchmark", label: "Benchmark", icon: Gauge },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all ${
                mode === m.id
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <m.icon className="w-3 h-3" />
              {m.label}
            </button>
          ))}
        </div>

        {/* Iteration selector */}
        {mode !== "benchmark" && (
          <div className="flex gap-2">
            {(mode === "montecarlo" ? ITER_OPTIONS : ITER_OPTIONS.slice(0, 3).map(o => ({ label: o.label, value: Math.min(o.value, 10000) }))).map(opt => (
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
        )}

        <Button onClick={runSim} disabled={running} className="w-full gap-2">
          {running ? <Zap className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
          {running
            ? "Processando..."
            : mode === "benchmark"
            ? "Executar Benchmark"
            : `Executar ${fmtN(iterations)} iterações`}
        </Button>

        {running && <Progress value={progress} className="h-2" />}

        <AnimatePresence>
          {/* Monte Carlo Results */}
          {simResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Performance metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Iterações", value: formatNumber(simResult.iterationsCompleted), icon: Cpu },
                  { label: "Tempo", value: `${simResult.elapsedMs}ms`, icon: Timer },
                  { label: "Ops/seg", value: formatNumber(simResult.opsPerSecond), icon: Gauge },
                  { label: "Melhor", value: `${simResult.bestHit} acertos`, icon: Trophy },
                ].map(m => (
                  <div key={m.label} className="p-2.5 rounded-lg bg-muted/20 border border-border text-center">
                    <m.icon className="w-3.5 h-3.5 mx-auto mb-1 text-primary" />
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-bold font-mono text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="p-2 rounded bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground">Média de acertos</p>
                <p className="text-2xl font-black font-mono text-primary">{simResult.avgHits}</p>
              </div>

              {/* Hit distribution chart */}
              {hitChartData.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-primary" /> Distribuição de Acertos
                  </h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hitChartData}>
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
                          formatter={(val: number, name: string) => {
                            if (name === "pct") return [`${val}%`, "Percentual"];
                            return [val.toLocaleString(), "Contagem"];
                          }}
                        />
                        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                          {hitChartData.map((_, i) => (
                            <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (i / hitChartData.length) * 0.6})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Optimization Results */}
          {optResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Timer className="w-3.5 h-3.5" />
                {optResult.elapsedMs}ms • Score: {optResult.bestScore}/100
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">Aposta Ótima</Badge>
                  <span className="text-sm font-mono font-bold text-primary">{optResult.bestScore}/100</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(optResult.bestBet).map(n => (
                    <span key={n} className="lottery-ball text-xs w-8 h-8">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>

              {convData.length > 0 && (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={convData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="gen" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                      />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          )}

          {/* Benchmark Results */}
          {benchmark && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Geração de Sorteios", value: `${formatNumber(benchmark.drawGenOpsPerSec)} ops/s` },
                  { label: "Verificação de Acertos", value: `${formatNumber(benchmark.hitCheckOpsPerSec)} ops/s` },
                  { label: "Monte Carlo Completo", value: `${formatNumber(benchmark.monteCarloOpsPerSec)} ops/s` },
                  { label: "Tempo Total", value: `${benchmark.totalMs}ms` },
                ].map(m => (
                  <div key={m.label} className="p-3 rounded-lg bg-muted/20 border border-border">
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold font-mono text-primary">{m.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Motor otimizado: TypedArrays, LCG PRNG, Fisher-Yates, Merge Intersection O(n)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
