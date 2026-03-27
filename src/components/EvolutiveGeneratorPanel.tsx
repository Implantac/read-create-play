import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dna, Play, Loader2, Trophy, Star, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { runGeneticAlgorithm, GeneticResult, RiskLevel } from "@/engine/genetic-algorithm";
import { useSavedBets } from "@/hooks/useSavedBets";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { GameAnalysisBlock } from "@/components/GameAnalysisBlock";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
  lotteryId: string;
}

const RISK_OPTIONS: { value: RiskLevel; label: string; desc: string }[] = [
  { value: "conservative", label: "Conservador", desc: "Maior estabilidade" },
  { value: "moderate", label: "Moderado", desc: "Equilíbrio risco/retorno" },
  { value: "aggressive", label: "Agressivo", desc: "Máxima diversidade" },
];

const POP_OPTIONS = [
  { value: "30", label: "30 jogos" },
  { value: "50", label: "50 jogos" },
  { value: "100", label: "100 jogos" },
];

const GEN_OPTIONS = [
  { value: "200", label: "200 gerações" },
  { value: "500", label: "500 gerações" },
  { value: "1000", label: "1000 gerações" },
];

export function EvolutiveGeneratorPanel({ stats, config, draws, lotteryId }: Props) {
  const [risk, setRisk] = useState<RiskLevel>("moderate");
  const [popSize, setPopSize] = useState("50");
  const [genCount, setGenCount] = useState("500");
  const [result, setResult] = useState<GeneticResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const { saveBet } = useSavedBets(lotteryId);

  // Reset when lottery changes
  const prevId = useRef(lotteryId);
  useEffect(() => {
    if (prevId.current !== lotteryId) {
      prevId.current = lotteryId;
      setResult(null);
      setSaved(new Set());
    }
  }, [lotteryId]);

  const handleRun = () => {
    setRunning(true);
    setProgress(0);
    setResult(null);
    setSaved(new Set());

    // Animate progress
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 2, 95));
    }, 100);

    setTimeout(() => {
      try {
        const res = runGeneticAlgorithm(stats, config, draws, {
          populationSize: parseInt(popSize),
          generations: parseInt(genCount),
          riskLevel: risk,
        });
        setResult(res);
        setProgress(100);
        toast.success(`Evolução concluída em ${res.elapsedMs}ms — Melhor nota: ${res.best.quality.grade}`);
      } catch (e) {
        toast.error("Erro na evolução genética");
        console.error(e);
      } finally {
        clearInterval(interval);
        setRunning(false);
      }
    }, 50);
  };

  const handleCopy = (numbers: number[], idx: number) => {
    navigator.clipboard.writeText(numbers.join(" - "));
    setCopied(idx);
    toast.success("Jogo copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = (numbers: number[], idx: number, quality: { overall: number; grade: string }) => {
    saveBet({ numbers, strategy: `Evolutivo ${risk}`, score: quality.overall, grade: quality.grade });
    setSaved(prev => new Set([...prev, idx]));
  };

  const gradeColor = (grade: string) => {
    const map: Record<string, string> = {
      S: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
      A: "text-green-400 bg-green-400/10 border-green-400/30",
      B: "text-blue-400 bg-blue-400/10 border-blue-400/30",
      C: "text-orange-400 bg-orange-400/10 border-orange-400/30",
      D: "text-red-400 bg-red-400/10 border-red-400/30",
      F: "text-red-600 bg-red-600/10 border-red-600/30",
    };
    return map[grade] || "text-muted-foreground";
  };

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Dna className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl text-foreground">Gerador Evolutivo de Jogos</CardTitle>
            <CardDescription>
              Algoritmo genético evolui jogos por seleção natural contra o histórico de {config.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Controls */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Perfil de risco</label>
            <Select value={risk} onValueChange={(v) => setRisk(v as RiskLevel)}>
              <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RISK_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label} — {o.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">População</label>
            <Select value={popSize} onValueChange={setPopSize}>
              <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {POP_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Gerações</label>
            <Select value={genCount} onValueChange={setGenCount}>
              <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GEN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleRun}
          disabled={running || draws.length === 0}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {running ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Evoluindo jogos...</>
          ) : (
            <><Dna className="h-4 w-4 mr-2" /> Iniciar Evolução Genética</>
          )}
        </Button>

        {running && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">Evoluindo população... {Math.round(progress)}%</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5">
            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Gerações</p>
                <p className="text-lg font-bold text-foreground">{result.generations}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Tempo</p>
                <p className="text-lg font-bold text-foreground">{result.elapsedMs}ms</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Melhor nota</p>
                <p className={`text-lg font-bold ${result.best.quality.grade === "S" || result.best.quality.grade === "A" ? "text-primary" : "text-foreground"}`}>
                  {result.best.quality.grade} ({result.best.fitness}pts)
                </p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Diversidade</p>
                <p className="text-lg font-bold text-foreground">{result.diversity}%</p>
              </div>
            </div>

            {/* Convergence chart */}
            {result.convergence.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Curva de Convergência</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.convergence}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="gen" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Line type="monotone" dataKey="bestFitness" name="Melhor" stroke="hsl(145, 72%, 42%)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="avgFitness" name="Média" stroke="hsl(195, 95%, 48%)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top 10 evolved bets */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Top 10 Jogos Evoluídos
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.top10.map((bet, i) => (
                  <div key={i} className={`flex items-center gap-2 p-3 rounded-lg border transition-colors group ${
                    i === 0 ? "bg-primary/5 border-primary/30" : "bg-muted/20 border-border/30 hover:border-border/60"
                  }`}>
                    <Badge variant={i === 0 ? "default" : "outline"} className="text-xs shrink-0">
                      {i === 0 ? "🏆" : `${i + 1}º`}
                    </Badge>
                    <Badge className={`text-xs shrink-0 border ${gradeColor(bet.quality.grade)}`}>
                      {bet.quality.grade}
                    </Badge>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {bet.numbers.map(n => {
                        const stat = stats.find(s => s.number === n);
                        const cls = stat?.status === "hot" ? "bg-red-500/20 text-red-400" :
                                    stat?.status === "cold" ? "bg-blue-500/20 text-blue-400" :
                                    "bg-primary/15 text-primary";
                        return (
                          <span key={n} className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold ${cls}`}>
                            {String(n).padStart(2, "0")}
                          </span>
                        );
                      })}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">{bet.fitness}pts</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleSave(bet.numbers, i, bet.quality)}
                        className={`p-1 rounded-md transition-colors ${
                          saved.has(i) ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/5 opacity-0 group-hover:opacity-100"
                        }`}
                        disabled={saved.has(i)}
                      >
                        <Star className={`w-4 h-4 ${saved.has(i) ? "fill-yellow-400" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleCopy(bet.numbers, i)}
                        className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
                      >
                        {copied === i ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <GameAnalysisBlock numbers={bet.numbers} stats={stats} config={config} draws={draws} />
                ))}
              </div>
            </div>

            {/* Best bet details */}
            {result.best.quality.strengths.length > 0 && (
              <div className="bg-muted/20 rounded-lg p-4 border border-border/30 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Análise do Melhor Jogo</h4>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  {result.best.quality.dimensions.map(d => (
                    <div key={d.name} className="flex items-center justify-between bg-muted/30 rounded p-2">
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className={`font-bold ${d.score >= 70 ? "text-primary" : d.score >= 40 ? "text-accent" : "text-destructive"}`}>
                        {d.score}/100
                      </span>
                    </div>
                  ))}
                </div>
                {result.best.quality.strengths.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground font-medium">Pontos fortes:</p>
                    {result.best.quality.strengths.map((s, i) => (
                      <p key={i} className="text-green-400 ml-2">✓ {s}</p>
                    ))}
                  </div>
                )}
                {result.best.quality.warnings.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="text-muted-foreground font-medium">Atenção:</p>
                    {result.best.quality.warnings.map((w, i) => (
                      <p key={i} className="text-yellow-400 ml-2">⚠ {w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
