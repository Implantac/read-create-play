import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Target, Shield, Coins, Play, Loader2, Info, Trophy, GitCompare, X } from "lucide-react";
import { calculateGuarantee, type ClosingResult, type ClosingStrategy } from "@/engine/closing";
import { useClosingWorker, ClosingCanceledError } from "@/hooks/useClosingWorker";
import { useClosingHistory } from "@/hooks/useClosingHistory";
import { ClosingDashboardPanel } from "@/components/closing/ClosingDashboardPanel";
import { ClosingExportPanel } from "@/components/closing/ClosingExportPanel";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STRATEGY_LABELS: Record<ClosingStrategy, string> = {
  greedy: "Guloso (Chvátal)",
  hill_climbing: "Hill Climbing",
  simulated_annealing: "Simulated Annealing",
  genetic: "Algoritmo Genético",
  covering_design: "Covering Design",
  beam_search: "Beam Search",
  backtracking: "Backtracking",
  branch_and_bound: "Branch & Bound",
  monte_carlo: "Monte Carlo",
  hybrid: "Híbrido",
};

const COMPARE_SET: ClosingStrategy[] = ["greedy", "hill_climbing", "simulated_annealing", "genetic", "covering_design"];

const FechamentoUniversalPage = () => {
  const { config } = useLotteryContext();
  const pick = config.pick;
  const total = config.numbers;
  const { generate, compare, cancel, progress, running } = useClosingWorker();
  const { saveClosing } = useClosingHistory(config.id);

  const [baseNumbers, setBaseNumbers] = useState<number[]>([]);
  const [minHits, setMinHits] = useState<number>(Math.max(1, pick - 1));
  const [maxGames, setMaxGames] = useState<number>(0);
  const [strategy, setStrategy] = useState<ClosingStrategy>("greedy");
  const [generating, setGenerating] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ClosingResult | null>(null);
  const [comparison, setComparison] = useState<ClosingResult[] | null>(null);

  const toggle = (n: number) => {
    setBaseNumbers(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b));
  };

  const bounds = useMemo(() => {
    if (baseNumbers.length < pick) return null;
    return calculateGuarantee(baseNumbers.length, pick, minHits);
  }, [baseNumbers.length, pick, minHits]);

  const canGenerate = baseNumbers.length >= pick && minHits >= 1 && minHits <= pick;

  const buildRequest = () => ({
    lottery: { id: config.id, name: config.name, totalNumbers: total, pick, ticketPrice: 3 },
    baseNumbers,
    guarantee: { hitsInBase: pick, minHits },
    maxGames: maxGames > 0 ? maxGames : undefined,
    strategy,
    kind: "guaranteed" as const,
  });

  const runGenerate = async () => {
    if (!canGenerate) { toast.error(`Selecione ao menos ${pick} dezenas.`); return; }
    setGenerating(true);
    setResult(null);
    setComparison(null);
    try {
      const r = await generate({ ...buildRequest(), strategy });
      setResult(r);
      if (r.games.length === 0) {
        toast.error(r.notes[0] || "Falha ao gerar.");
      } else {
        if (r.validation.meetsGuarantee) toast.success(`${r.games.length} jogos · garantia ${r.validation.guaranteedHits}.`);
        else toast.warning(`${r.games.length} jogos, garantia real ${r.validation.guaranteedHits} < meta ${minHits}.`);
        // Auto-arquiva no histórico
        saveClosing(r).then(ok => {
          if (ok) toast.info("Fechamento salvo em Meus Jogos.", { duration: 2500 });
        });
      }
    } catch (e) {
      if (e instanceof ClosingCanceledError) toast.info("Geração cancelada.");
      else toast.error(e instanceof Error ? e.message : "Erro ao gerar.");
    } finally {
      setGenerating(false);
    }
  };

  const runCompare = async () => {
    if (!canGenerate) { toast.error(`Selecione ao menos ${pick} dezenas.`); return; }
    setComparing(true);
    setComparison(null);
    setResult(null);
    try {
      const rs = await compare(buildRequest(), COMPARE_SET);
      setComparison(rs);
      toast.success(`Comparação concluída: vencedor ${STRATEGY_LABELS[rs[0].strategy]}`);
    } catch (e) {
      if (e instanceof ClosingCanceledError) toast.info("Comparação cancelada.");
      else toast.error(e instanceof Error ? e.message : "Erro na comparação.");
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Motor Universal de Fechamentos"
        description="Greedy · Hill Climbing · SA · Genético · Covering Design — validados matematicamente"
        icon={Sparkles}
      />
      <LotteryContextBanner />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Dezenas-Base ({baseNumbers.length}/{total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${config.id === "lotofacil" ? 5 : 10}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: total }, (_, i) => i + 1).map(n => {
                const active = baseNumbers.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() => toggle(n)}
                    className={cn(
                      "aspect-square rounded-lg border font-mono font-semibold text-sm transition-all",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                        : "bg-muted/40 border-border hover:bg-muted"
                    )}
                  >
                    {n.toString().padStart(2, "0")}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setBaseNumbers([])}>Limpar</Button>
              <Button size="sm" variant="outline" onClick={() => {
                const rand = new Set<number>();
                while (rand.size < Math.min(pick + 3, total)) rand.add(Math.floor(Math.random() * total) + 1);
                setBaseNumbers([...rand].sort((a, b) => a - b));
              }}>
                Aleatório ({Math.min(pick + 3, total)})
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Parâmetros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="minhits">Garantia (acertos mínimos)</Label>
              <Input
                id="minhits" type="number" min={1} max={pick}
                value={minHits}
                onChange={e => setMinHits(Math.max(1, Math.min(pick, Number(e.target.value) || 1)))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Se {pick} dezenas caírem na base, ao menos um jogo terá ≥ {minHits} acertos.
              </p>
            </div>
            <div>
              <Label htmlFor="maxgames">Máx. jogos (0 = ilimitado)</Label>
              <Input
                id="maxgames" type="number" min={0}
                value={maxGames}
                onChange={e => setMaxGames(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>
            <div>
              <Label>Estratégia</Label>
              <Select value={strategy} onValueChange={(v) => setStrategy(v as ClosingStrategy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPARE_SET.map(s => (
                    <SelectItem key={s} value={s}>{STRATEGY_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {bounds && (
              <div className="rounded-lg bg-muted/30 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lower bound (Schönheim)</span>
                  <span className="font-mono font-semibold">{bounds.lowerBound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Candidatos possíveis</span>
                  <span className="font-mono">{formatNumber(bounds.candidatePoolSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Universo M-subsets</span>
                  <span className="font-mono">{formatNumber(bounds.universeSize)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={runGenerate} disabled={!canGenerate || generating || comparing}>
                {generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                Gerar
              </Button>
              <Button variant="secondary" onClick={runCompare} disabled={!canGenerate || generating || comparing}>
                {comparing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <GitCompare className="h-4 w-4 mr-1" />}
                Comparar
              </Button>
            </div>

            {running && (
              <div
                className="rounded-lg border bg-muted/30 p-3 space-y-2"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>{progress.label || "Processando…"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancel}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                  </Button>
                </div>
                <Progress
                  value={
                    progress.total > 0
                      ? Math.min(100, (progress.current / progress.total) * 100)
                      : undefined
                  }
                  className="h-1.5"
                />
                <p className="text-[10px] text-muted-foreground font-mono">
                  {progress.total > 1
                    ? `${progress.current}/${progress.total} · `
                    : ""}
                  {progress.startedAt
                    ? `${((Date.now() - progress.startedAt) / 1000).toFixed(1)}s`
                    : ""}
                </p>
              </div>
            )}

            {!canGenerate && (
              <Alert variant="default" className="text-xs">
                <Info className="h-4 w-4" />
                <AlertDescription>Selecione ao menos {pick} dezenas.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {comparison && <ComparisonPanel results={comparison} onPick={(r) => setResult(r)} />}
      {result && result.games.length > 0 && <ResultPanel result={result} />}
      {result && result.games.length > 0 && <ClosingExportPanel result={result} />}
      {result && result.games.length > 0 && <ClosingDashboardPanel result={result} />}
    </div>
  );
};

function ComparisonPanel({ results, onPick }: { results: ClosingResult[]; onPick: (r: ClosingResult) => void }) {
  const winner = results[0];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Comparação de Estratégias
          <Badge variant="secondary" className="ml-2">
            Vencedor: {STRATEGY_LABEL(winner.strategy)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 px-2">Estratégia</th>
                <th className="text-right py-2 px-2">Nota</th>
                <th className="text-right py-2 px-2">Jogos</th>
                <th className="text-right py-2 px-2">Garantia</th>
                <th className="text-right py-2 px-2">Cobertura</th>
                <th className="text-right py-2 px-2">Custo</th>
                <th className="text-right py-2 px-2">Tempo</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.strategy} className={cn("border-b hover:bg-muted/30", i === 0 && "bg-amber-500/5")}>
                  <td className="py-2 px-2 font-medium">
                    {i === 0 && <Trophy className="inline h-3 w-3 mr-1 text-amber-500" />}
                    {STRATEGY_LABEL(r.strategy)}
                  </td>
                  <td className="text-right py-2 px-2 font-mono font-semibold">{r.score.overall}</td>
                  <td className="text-right py-2 px-2 font-mono">{r.gameCount}</td>
                  <td className={cn("text-right py-2 px-2 font-mono", r.validation.meetsGuarantee ? "text-green-500" : "text-amber-500")}>
                    {r.validation.guaranteedHits}
                  </td>
                  <td className="text-right py-2 px-2 font-mono">{r.validation.coveragePercent.toFixed(1)}%</td>
                  <td className="text-right py-2 px-2 font-mono">{formatCurrency(r.cost)}</td>
                  <td className="text-right py-2 px-2 font-mono text-muted-foreground">{r.elapsedMs}ms</td>
                  <td className="text-right py-2 px-2">
                    <Button size="sm" variant="ghost" onClick={() => onPick(r)}>Ver</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function STRATEGY_LABEL(s: ClosingStrategy): string {
  return STRATEGY_LABELS[s] ?? s;
}

function ResultPanel({ result }: { result: ClosingResult }) {
  const v = result.validation;
  const s = result.score;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> {STRATEGY_LABEL(result.strategy)}
            </span>
            <Badge className="text-lg" variant={s.overall >= 80 ? "default" : "secondary"}>
              Nota {s.overall}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Jogos" value={result.gameCount.toString()} sub={`min. teórico: ${result.lowerBound}`} />
            <Stat label="Custo" value={formatCurrency(result.cost)} sub={`${result.request.lottery.ticketPrice.toFixed(2)}/jogo`} />
            <Stat label="Garantia real" value={`${v.guaranteedHits} acertos`} sub={`meta: ${v.targetMinHits}`} ok={v.meetsGuarantee} />
            <Stat label="Cobertura" value={`${v.coveragePercent.toFixed(1)}%`} sub={v.exhaustive ? "exaustiva" : "amostrada"} />
          </div>
          <Separator className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <ScoreBar label="Cobertura" value={s.coverage} />
            <ScoreBar label="Eficiência" value={s.efficiency} />
            <ScoreBar label="Diversidade" value={s.diversity} />
            <ScoreBar label="Não-redundância" value={s.redundancy} />
            <ScoreBar label="Tempo" value={s.time} />
          </div>
          {result.notes.length > 0 && (
            <div className="mt-4 space-y-1">
              {result.notes.map((n, i) => (
                <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <Info className="h-3 w-3 mt-0.5 flex-shrink-0" /> {n}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="games">
        <TabsList>
          <TabsTrigger value="games">Jogos ({result.gameCount})</TabsTrigger>
          <TabsTrigger value="dist">Distribuição de acertos</TabsTrigger>
        </TabsList>
        <TabsContent value="games">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 max-h-[500px] overflow-auto">
                {result.games.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="text-xs font-mono text-muted-foreground w-8">#{i + 1}</span>
                    <div className="flex flex-wrap gap-1">
                      {g.map(n => (
                        <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-mono font-semibold">
                          {n.toString().padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
                <Coins className="h-3 w-3" /> Gerado em {result.elapsedMs}ms · {result.gameCount} jogos · {formatCurrency(result.cost)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="dist">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {Object.entries(v.distribution)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([hits, count]) => {
                    const pct = (count / v.testedScenarios) * 100;
                    return (
                      <div key={hits} className="flex items-center gap-3 text-sm">
                        <span className="w-24 font-mono">{hits} acertos</span>
                        <Progress value={pct} className="flex-1" />
                        <span className="w-24 text-right text-muted-foreground">{count} ({pct.toFixed(1)}%)</span>
                      </div>
                    );
                  })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Testados {formatNumber(v.testedScenarios)} cenários {v.exhaustive ? "(exaustivo)" : "(amostrado)"}.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, sub, ok }: { label: string; value: string; sub?: string; ok?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-bold font-mono", ok === true && "text-green-500", ok === false && "text-amber-500")}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}

export default FechamentoUniversalPage;
