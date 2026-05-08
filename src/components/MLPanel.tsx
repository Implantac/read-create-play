import { useState, useMemo } from "react";
import { NumberStats, computeFrequencyStats } from "@/engine/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { runAllModels, getConsensusRanking, ModelResult, MLPrediction, ScoreBreakdown } from "@/engine/ml-models";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Play, Trophy, Target, Percent, Info, BarChart2, Beaker, Zap, Users, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws?: DrawResult[];
}

function BreakdownBar({ breakdown }: { breakdown?: ScoreBreakdown }) {
  if (!breakdown) return null;
  const factors = [
    { key: "Frequência", value: breakdown.frequency, color: "bg-emerald-500" },
    { key: "Recência", value: breakdown.recency, color: "bg-blue-500" },
    { key: "Tendência", value: breakdown.trend, color: "bg-amber-500" },
    { key: "Ciclo", value: breakdown.cycle, color: "bg-purple-500" },
    { key: "Momentum", value: breakdown.momentum, color: "bg-rose-500" },
    { key: "Consistência", value: breakdown.consistency, color: "bg-cyan-500" },
  ].filter(f => f.value > 3);

  return (
    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden w-full">
      {factors.map(f => (
        <div key={f.key} className={`${f.color} opacity-80`} style={{ width: `${f.value}%` }} title={`${f.key}: ${f.value}%`} />
      ))}
    </div>
  );
}

function BacktestBadge({ model }: { model: ModelResult }) {
  if (!model.backtestDetails || model.backtestDetails.totalDrawsTested === 0) {
    return <span className="text-[10px] text-muted-foreground/60 italic">sem backtesting</span>;
  }
  const bt = model.backtestDetails;
  const liftColor = bt.liftOverChance >= 1.3 ? "text-emerald-500" : bt.liftOverChance >= 1.1 ? "text-amber-500" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
        <Beaker className="w-2.5 h-2.5 text-primary/60" />
        {bt.totalDrawsTested} testes
      </span>
      <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${liftColor}`}>
        <Zap className="w-2.5 h-2.5" />
        lift {bt.liftOverChance.toFixed(2)}x
      </span>
    </div>
  );
}

function AgreementBadge({ agreement, total }: { agreement: number; total: number }) {
  if (agreement <= 0) return null;
  const pct = agreement / total;
  const color = pct >= 0.83 ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
    : pct >= 0.5 ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border ${color}`}>
      <Users className="w-2.5 h-2.5" />
      {agreement}/{total}
    </span>
  );
}

function ModelLeaderboard({ models }: { models: ModelResult[] }) {
  const sorted = [...models].sort((a, b) => {
    const la = a.backtestDetails?.liftOverChance ?? 0;
    const lb = b.backtestDetails?.liftOverChance ?? 0;
    return lb - la;
  });
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 mb-4">
      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <Trophy className="w-3 h-3 text-amber-500" />
        Leaderboard de Backtesting (ordenado por lift sobre o acaso)
      </p>
      <div className="space-y-1.5">
        {sorted.map((m, i) => {
          const bt = m.backtestDetails;
          const lift = bt?.liftOverChance ?? 0;
          const liftPct = Math.min(100, (lift / 2) * 100); // 2x lift = 100% bar
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
          return (
            <div key={m.name} className="flex items-center gap-2 text-[11px]">
              <span className="w-6 shrink-0 text-center">{medal}</span>
              <span className="w-32 truncate text-foreground font-medium">{m.name}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${lift >= 1.3 ? "bg-emerald-500" : lift >= 1.1 ? "bg-amber-500" : "bg-muted-foreground/40"}`}
                  style={{ width: `${liftPct}%` }}
                />
              </div>
              <span className="w-12 text-right font-mono text-foreground">{lift.toFixed(2)}x</span>
              <span className="w-16 text-right font-mono text-muted-foreground">{m.accuracy}% acc</span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 italic">
        Lift = avg hits no top15 ÷ esperado por chance. Acima de 1.0x indica edge real sobre o aleatório.
      </p>
    </div>
  );
}

function ModelRadar({ models }: { models: ModelResult[] }) {
  const data = [
    { metric: "Acurácia", ...Object.fromEntries(models.map(m => [m.name, m.accuracy])) },
    { metric: "Confiança", ...Object.fromEntries(models.map(m => [m.name, m.confidence])) },
    { metric: "Hit Rate", ...Object.fromEntries(models.map(m => [m.name, m.backtestDetails?.top15HitRate ?? 0])) },
    { metric: "Top5 Prec.", ...Object.fromEntries(models.map(m => [m.name, m.backtestDetails?.top5Precision ?? 0])) },
    { metric: "Consistência", ...Object.fromEntries(models.map(m => [m.name, m.backtestDetails?.consistency ?? 0])) },
    { metric: "Lift x50", ...Object.fromEntries(models.map(m => [m.name, (m.backtestDetails?.liftOverChance ?? 0) * 50])) },
  ];
  const colors = ["hsl(142,70%,50%)", "hsl(200,90%,55%)", "hsl(0,72%,55%)", "hsl(45,80%,55%)", "hsl(180,60%,55%)", "hsl(300,70%,60%)"];
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 mb-4">
      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
        <TrendingUp className="w-3 h-3 text-primary" />
        Comparativo Multidimensional (radar)
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
            {models.map((m, i) => (
              <Radar key={m.name} name={m.name} dataKey={m.name} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.12} strokeWidth={1.5} />
            ))}
            <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MLPanel({ stats, config, draws }: Props) {
  const [models, setModels] = useState<ModelResult[] | null>(null);
  const [consensus, setConsensus] = useState<MLPrediction[] | null>(null);
  const [running, setRunning] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<MLPrediction | null>(null);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const results = runAllModels(stats, config, draws, computeFrequencyStats);
      setModels(results);
      setConsensus(getConsensusRanking(results));
      setSelectedNumber(null);
      setRunning(false);
    }, 800);
  };

  const renderChart = (predictions: MLPrediction[], color: string) => {
    const top20 = predictions.slice(0, 20);
    return (
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top20} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [`${value}%`, "Score"]}
            />
            <Bar dataKey="score" radius={[3, 3, 0, 0]} cursor="pointer"
              onClick={(data: any) => data && setSelectedNumber(data)}>
              {top20.map((_, i) => (
                <Cell key={i} fill={`hsl(${color}, ${80 - i * 2}%)`} fillOpacity={1 - i * 0.02} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBreakdownDetail = () => {
    if (!selectedNumber?.breakdown) return null;
    const bd = selectedNumber.breakdown;
    const factors = [
      { label: "Frequência", value: bd.frequency, color: "bg-emerald-500", desc: "Peso da frequência histórica" },
      { label: "Recência", value: bd.recency, color: "bg-blue-500", desc: "Aparições nos últimos sorteios" },
      { label: "Tendência", value: bd.trend, color: "bg-amber-500", desc: "Direção da frequência recente" },
      { label: "Ciclo", value: bd.cycle, color: "bg-purple-500", desc: "Padrão cíclico de aparição" },
      { label: "Momentum", value: bd.momentum, color: "bg-rose-500", desc: "Aceleração/desaceleração" },
      { label: "Consistência", value: bd.consistency, color: "bg-cyan-500", desc: "Regularidade dos gaps" },
    ].filter(f => f.value > 0);

    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-secondary/50 border border-border p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Info className="w-3 h-3 text-primary" />
            Nº {String(selectedNumber.number).padStart(2, '0')} — Score: {selectedNumber.score}%
          </p>
          <button onClick={() => setSelectedNumber(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
        </div>
        {selectedNumber.reason && (
          <div className="mb-2 p-2 rounded bg-primary/5 border border-primary/20 text-[11px] text-foreground/90 flex gap-1.5">
            <Sparkles className="w-3 h-3 shrink-0 text-primary mt-0.5" />
            <span>{selectedNumber.reason}</span>
          </div>
        )}
        <div className="space-y-1.5">
          {factors.map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-20 shrink-0">{f.label}</span>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div className={`${f.color} h-full rounded-full opacity-80`} style={{ width: `${f.value}%` }} />
              </div>
              <span className="text-[10px] font-mono text-foreground w-8 text-right">{f.value}%</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          Clique em qualquer barra do gráfico para ver o breakdown de fatores
        </p>
      </motion.div>
    );
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-neon-purple" />
            Modelos de Machine Learning
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            6 modelos com backtesting real e breakdown de fatores
          </p>
        </div>
        <Button
          size="sm"
          onClick={run}
          disabled={running}
          className="bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30"
        >
          <Play className="w-3 h-3 mr-1" />
          {running ? "Processando..." : "Executar Modelos"}
        </Button>
      </div>

      {running && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Backtesting e calibração dos 6 modelos...</p>
        </div>
      )}

      {models && !running && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Model stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {models.map((model) => (
                <div key={model.name} className="rounded-lg bg-secondary/50 border border-border p-3">
                  <p className="text-xs font-semibold text-foreground mb-2 truncate">{model.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Target className="w-3 h-3 shrink-0" />
                    Acurácia: <span className="text-foreground font-mono">{model.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Percent className="w-3 h-3 shrink-0" />
                    Confiança: <span className="text-foreground font-mono">{model.confidence.toFixed(1)}%</span>
                  </div>
                  <BacktestBadge model={model} />
                </div>
              ))}
            </div>

            {/* Breakdown detail panel */}
            {renderBreakdownDetail()}

            <Tabs defaultValue="consensus" className="w-full">
              <TabsList className="w-full bg-secondary/50 border border-border flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="consensus" className="text-xs">
                  <Trophy className="w-3 h-3 mr-1" /> Consenso
                </TabsTrigger>
                {models.map(m => (
                  <TabsTrigger key={m.name} value={m.name} className="text-xs">
                    {m.name.length > 12 ? m.name.slice(0, 12) + "…" : m.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="consensus" className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Top 20 — média ponderada pela acurácia dos 6 modelos (clique em uma barra para ver detalhes):
                </p>
                {consensus && (
                  <>
                    {renderChart(consensus, "270, 70%")}
                    <div className="mt-3 space-y-1">
                      {consensus.slice(0, 5).map(p => (
                        <div key={p.number} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-foreground w-8">Nº{String(p.number).padStart(2, '0')}</span>
                          <BreakdownBar breakdown={p.breakdown} />
                          <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{p.score}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              {models.map((model, mi) => {
                const colors = ["142, 70%", "200, 90%", "0, 72%", "45, 80%", "180, 60%", "300, 70%"];
                return (
                  <TabsContent key={model.name} value={model.name} className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1">{model.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">Top 20 números — clique para ver breakdown:</p>
                    {renderChart(model.predictions, colors[mi])}
                    {/* Top 5 breakdown bars */}
                    <div className="mt-3 space-y-1">
                      {model.predictions.slice(0, 5).map(p => (
                        <div key={p.number} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-foreground w-8">Nº{String(p.number).padStart(2, '0')}</span>
                          <BreakdownBar breakdown={p.breakdown} />
                          <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{p.score}%</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}

      {!models && !running && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Clique em "Executar Modelos" para rodar os 6 algoritmos de ML com backtesting real
        </div>
      )}
    </div>
  );
}
