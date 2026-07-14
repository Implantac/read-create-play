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
import { Sparkles, Target, Shield, Coins, Play, Loader2, Info } from "lucide-react";
import { generateClosing, calculateGuarantee, type ClosingResult } from "@/engine/closing";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FechamentoUniversalPage = () => {
  const { config } = useLotteryContext();
  const pick = config.pick;
  const total = config.numbers;

  const [baseNumbers, setBaseNumbers] = useState<number[]>([]);
  const [minHits, setMinHits] = useState<number>(Math.max(1, pick - 1));
  const [maxGames, setMaxGames] = useState<number>(0);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ClosingResult | null>(null);

  const toggle = (n: number) => {
    setBaseNumbers(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b));
  };

  const bounds = useMemo(() => {
    if (baseNumbers.length < pick) return null;
    return calculateGuarantee(baseNumbers.length, pick, minHits);
  }, [baseNumbers.length, pick, minHits]);

  const canGenerate = baseNumbers.length >= pick && minHits >= 1 && minHits <= pick;

  const runGenerate = () => {
    if (!canGenerate) {
      toast.error(`Selecione ao menos ${pick} dezenas.`);
      return;
    }
    setGenerating(true);
    setResult(null);
    // desatrela do main thread pra UI atualizar antes do trabalho pesado
    setTimeout(() => {
      try {
        const r = generateClosing({
          lottery: {
            id: config.id, name: config.name,
            totalNumbers: total, pick,
            ticketPrice: 3, // TODO Fase 4: preços por modalidade
          },
          baseNumbers,
          guarantee: { hitsInBase: pick, minHits },
          maxGames: maxGames > 0 ? maxGames : undefined,
          strategy: "greedy",
          kind: "guaranteed",
        });
        setResult(r);
        if (r.games.length === 0) {
          toast.error(r.notes[0] || "Não foi possível gerar o fechamento.");
        } else if (r.validation.meetsGuarantee) {
          toast.success(`Fechamento gerado: ${r.games.length} jogos, garantia ${r.validation.guaranteedHits} acertos.`);
        } else {
          toast.warning(`Gerado com ${r.games.length} jogos, mas garantia real ${r.validation.guaranteedHits} < meta ${minHits}.`);
        }
      } catch (e) {
        console.error(e);
        toast.error("Erro ao gerar fechamento.");
      } finally {
        setGenerating(false);
      }
    }, 60);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Motor Universal de Fechamentos"
        description="Gerador matemático dinâmico — Greedy + Cobertura + Validação"
        icon={Sparkles}
      />
      <LotteryContextBanner />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Seleção de dezenas */}
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
              <Button size="sm" variant="outline" onClick={() => setBaseNumbers([])}>
                Limpar
              </Button>
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

        {/* Parâmetros */}
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
                Se {pick} dezenas caírem na sua base, ao menos um jogo terá ≥ {minHits} acertos.
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

            <Button onClick={runGenerate} disabled={!canGenerate || generating} className="w-full">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</> : <><Play className="h-4 w-4 mr-2" /> Gerar fechamento</>}
            </Button>

            {!canGenerate && (
              <Alert variant="default" className="text-xs">
                <Info className="h-4 w-4" />
                <AlertDescription>Selecione ao menos {pick} dezenas.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resultado */}
      {result && result.games.length > 0 && (
        <ResultPanel result={result} />
      )}
    </div>
  );
};

function ResultPanel({ result }: { result: ClosingResult }) {
  const v = result.validation;
  const s = result.score;

  return (
    <div className="space-y-4">
      {/* Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Fechamento gerado</span>
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

      {/* Distribuição */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição de acertos (pior caso por cenário)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(v.distribution)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([hits, count]) => {
                const pct = (count / v.testedScenarios) * 100;
                return (
                  <div key={hits} className="flex items-center gap-3 text-sm">
                    <span className="w-24 font-mono">{hits} acertos</span>
                    <Progress value={pct} className="flex-1" />
                    <span className="w-20 text-right text-muted-foreground">{count} ({pct.toFixed(1)}%)</span>
                  </div>
                );
              })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Testados {formatNumber(v.testedScenarios)} cenários {v.exhaustive ? "(exaustivo)" : "(amostrado)"}.
          </p>
        </CardContent>
      </Card>

      {/* Jogos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Coins className="h-5 w-5" /> Jogos ({result.gameCount})</span>
            <span className="text-sm text-muted-foreground">{result.elapsedMs}ms</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
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
