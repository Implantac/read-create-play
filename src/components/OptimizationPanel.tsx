import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberStats } from "@/engine/stats/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { runGeneticAlgorithm, GeneticResult, RiskLevel } from "@/engine/ai/genetic-algorithm";
import { runSimulatedAnnealing, AnnealingResult } from "@/engine/simulated-annealing";
import { exportToPdf } from "@/engine/pdf-export";
import { motion, AnimatePresence } from "framer-motion";
import { Dna, Flame, Shield, Zap, Target, Cpu, Download, CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { toast } from "sonner";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const RISK_LABELS: Record<RiskLevel, { label: string; desc: string; icon: typeof Shield }> = {
  conservative: { label: "Conservador", desc: "Padrões consistentes, menor variância", icon: Shield },
  moderate: { label: "Moderado", desc: "Equilíbrio entre consistência e exploração", icon: Target },
  aggressive: { label: "Agressivo", desc: "Alta exploração, maior variância e potencial", icon: Flame },
};

const GRADE_COLORS: Record<string, string> = {
  S: "text-yellow-400", A: "text-primary", B: "text-blue-400",
  C: "text-orange-400", D: "text-destructive", F: "text-destructive",
};

export function OptimizationPanel({ stats, config, draws }: Props) {
  const [risk, setRisk] = useState<RiskLevel>("moderate");
  const [gaResult, setGaResult] = useState<GeneticResult | null>(null);
  const [saResult, setSaResult] = useState<AnnealingResult | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [generations, setGenerations] = useState(500);
  const [saIterations, setSaIterations] = useState(5000);

  const handleRunGA = () => {
    setRunning("ga");
    setGaResult(null);
    setTimeout(() => {
      const result = runGeneticAlgorithm(stats, config, draws, {
        generations,
        riskLevel: risk,
        populationSize: 50,
      });
      setGaResult(result);
      setRunning(null);
      toast.success(`Algoritmo Genético: ${result.generations} gerações em ${result.elapsedMs}ms`);
    }, 50);
  };

  const handleRunSA = () => {
    setRunning("sa");
    setSaResult(null);
    setTimeout(() => {
      const result = runSimulatedAnnealing(stats, config, draws, {
        iterations: saIterations,
        riskLevel: risk,
      });
      setSaResult(result);
      setRunning(null);
      toast.success(`Simulated Annealing: ${result.iterations} iterações em ${result.elapsedMs}ms`);
    }, 50);
  };

  const handleExport = (type: "ga" | "sa") => {
    const data = type === "ga" ? gaResult : saResult;
    if (!data) return;
    const bets = type === "ga"
      ? gaResult!.top10.map(b => ({ numbers: b.numbers, score: b.fitness, grade: b.quality.grade }))
      : saResult!.top5.map(b => ({ numbers: b.numbers, score: b.energy, grade: b.quality.grade }));

    exportToPdf({
      title: type === "ga" ? "Algoritmo Genético - Top Apostas" : "Simulated Annealing - Top Apostas",
      subtitle: `Nível de risco: ${RISK_LABELS[risk].label}`,
      config,
      bets,
      type: "apostas",
    });
  };

  const copyBet = (numbers: number[]) => {
    navigator.clipboard.writeText(numbers.join(" - "));
    toast.success("Aposta copiada!");
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Dna className="w-5 h-5 text-primary" />
          Algoritmos de Otimização Avançada
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Algoritmo Genético + Simulated Annealing com nível de risco configurável
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Level Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Nível de Risco</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(RISK_LABELS) as [RiskLevel, typeof RISK_LABELS[RiskLevel]][]).map(([key, val]) => {
              const Icon = val.icon;
              return (
                <button
                  key={key}
                  onClick={() => setRisk(key)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    risk === key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${risk === key ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-semibold ${risk === key ? "text-primary" : "text-foreground"}`}>
                      {val.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{val.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Tabs defaultValue="genetic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="genetic" className="text-xs gap-1">
              <Dna className="w-3 h-3" /> Algoritmo Genético
            </TabsTrigger>
            <TabsTrigger value="annealing" className="text-xs gap-1">
              <Flame className="w-3 h-3" /> Simulated Annealing
            </TabsTrigger>
          </TabsList>

          {/* ═══ ALGORITMO GENÉTICO ═══ */}
          <TabsContent value="genetic" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Gerações:</span>
              {[200, 500, 1000, 2000].map(n => (
                <button
                  key={n}
                  onClick={() => setGenerations(n)}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                    generations === n
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
              <Button size="sm" onClick={handleRunGA} disabled={running === "ga"} className="ml-auto gap-1">
                <Cpu className="w-3 h-3" />
                {running === "ga" ? "Evoluindo..." : "Executar AG"}
              </Button>
            </div>

            <AnimatePresence>
              {gaResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{gaResult.generations} gerações · {gaResult.elapsedMs}ms · Diversidade: {gaResult.diversity}%</span>
                    <Button size="sm" variant="outline" onClick={() => handleExport("ga")} className="text-xs gap-1">
                      <Download className="w-3 h-3" /> Exportar PDF
                    </Button>
                  </div>

                  {/* Best */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-xs">Melhor</Badge>
                      <span className={`text-lg font-black font-mono ${GRADE_COLORS[gaResult.best.quality.grade]}`}>
                        {gaResult.best.quality.grade}
                      </span>
                      <span className="text-sm font-mono text-foreground">{gaResult.best.fitness}/100</span>
                      <button onClick={() => copyBet(gaResult.best.numbers)} className="ml-auto text-muted-foreground hover:text-primary">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {gaResult.best.numbers.map(n => (
                        <span key={n} className="lottery-ball text-xs w-8 h-8">{String(n).padStart(2, "0")}</span>
                      ))}
                    </div>
                    {gaResult.best.quality.strengths.slice(0, 3).map((s, i) => (
                      <p key={i} className="text-[10px] text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> {s}
                      </p>
                    ))}
                  </div>

                  {/* Top 10 */}
                  <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                    {gaResult.top10.slice(1).map((bet, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-border">
                        <span className="text-xs font-mono text-muted-foreground w-5">#{idx + 2}</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {bet.numbers.map(n => (
                            <span key={n} className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5 text-foreground">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                        <Badge variant="outline" className="text-[10px]">{bet.quality.grade} {bet.fitness}</Badge>
                        <button onClick={() => copyBet(bet.numbers)} className="text-muted-foreground hover:text-primary">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Convergence */}
                  {gaResult.convergence.length > 0 && (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={gaResult.convergence}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="gen" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12 }} />
                          <Area type="monotone" dataKey="avgFitness" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.1)" name="Média" />
                          <Line type="monotone" dataKey="bestFitness" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Melhor" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* ═══ SIMULATED ANNEALING ═══ */}
          <TabsContent value="annealing" className="space-y-4 mt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Iterações:</span>
              {[2000, 5000, 10000, 20000].map(n => (
                <button
                  key={n}
                  onClick={() => setSaIterations(n)}
                  className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                    saIterations === n
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n >= 1000 ? `${n / 1000}K` : n}
                </button>
              ))}
              <Button size="sm" onClick={handleRunSA} disabled={running === "sa"} className="ml-auto gap-1">
                <Flame className="w-3 h-3" />
                {running === "sa" ? "Recozendo..." : "Executar SA"}
              </Button>
            </div>

            <AnimatePresence>
              {saResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{saResult.iterations.toLocaleString()} iterações · {saResult.elapsedMs}ms · Aceitação: {saResult.acceptanceRate}%</span>
                    <Button size="sm" variant="outline" onClick={() => handleExport("sa")} className="text-xs gap-1">
                      <Download className="w-3 h-3" /> Exportar PDF
                    </Button>
                  </div>

                  {/* Best */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-xs">Melhor</Badge>
                      <span className={`text-lg font-black font-mono ${GRADE_COLORS[saResult.best.quality.grade]}`}>
                        {saResult.best.quality.grade}
                      </span>
                      <span className="text-sm font-mono text-foreground">{saResult.best.energy}/100</span>
                      <button onClick={() => copyBet(saResult.best.numbers)} className="ml-auto text-muted-foreground hover:text-primary">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {saResult.best.numbers.map(n => (
                        <span key={n} className="lottery-ball text-xs w-8 h-8">{String(n).padStart(2, "0")}</span>
                      ))}
                    </div>
                    {saResult.best.quality.strengths.slice(0, 3).map((s, i) => (
                      <p key={i} className="text-[10px] text-primary flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> {s}
                      </p>
                    ))}
                  </div>

                  {/* Top 5 */}
                  <div className="space-y-1.5">
                    {saResult.top5.slice(1).map((bet, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-border">
                        <span className="text-xs font-mono text-muted-foreground w-5">#{idx + 2}</span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {bet.numbers.map(n => (
                            <span key={n} className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5 text-foreground">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                        <Badge variant="outline" className="text-[10px]">{bet.quality.grade} {bet.energy}</Badge>
                        <button onClick={() => copyBet(bet.numbers)} className="text-muted-foreground hover:text-primary">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Temperature curve */}
                  {saResult.temperatureHistory.length > 0 && (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={saResult.temperatureHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="step" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <YAxis yAxisId="energy" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <YAxis yAxisId="temp" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12 }} />
                          <Line yAxisId="energy" type="monotone" dataKey="energy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Energia" />
                          <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="hsl(var(--destructive))" strokeWidth={1} dot={false} name="Temperatura" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
