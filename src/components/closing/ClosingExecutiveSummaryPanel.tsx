import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Target,
  Shield,
  Coins,
  Timer,
  Layers,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { ClosingResult, ClosingStrategy } from "@/engine/closing";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const STRATEGY_LABELS: Record<ClosingStrategy, string> = {
  greedy: "Guloso",
  hill_climbing: "Hill Climbing",
  simulated_annealing: "Simulated Annealing",
  genetic: "Genético",
  covering_design: "Covering Design",
  beam_search: "Beam Search",
  backtracking: "Backtracking",
  branch_and_bound: "Branch & Bound",
  monte_carlo: "Monte Carlo",
  hybrid: "Híbrido",
};

interface Props {
  result?: ClosingResult | null;
  comparison?: ClosingResult[] | null;
}

/**
 * Painel Executivo: KPIs de alto nível consolidando o(s) fechamento(s) atuais.
 * Serve como "cockpit" antes dos painéis analíticos detalhados.
 */
export function ClosingExecutiveSummaryPanel({ result, comparison }: Props) {
  const primary = result ?? comparison?.[0] ?? null;

  const stats = useMemo(() => {
    if (!primary) return null;
    const v = primary.validation;
    const s = primary.score;
    const optimality = primary.lowerBound > 0
      ? Math.min(100, Math.round((primary.lowerBound / Math.max(1, primary.gameCount)) * 100))
      : 0;
    return {
      games: primary.gameCount,
      cost: primary.cost,
      guarantee: v.guaranteedHits,
      target: v.targetMinHits,
      meets: v.meetsGuarantee,
      coverage: v.coveragePercent,
      overall: s.overall,
      elapsed: primary.elapsedMs,
      optimality,
      lowerBound: primary.lowerBound,
    };
  }, [primary]);

  const comparisonStats = useMemo(() => {
    if (!comparison || comparison.length < 2) return null;
    const winner = comparison[0];
    const worst = comparison[comparison.length - 1];
    const gain = worst.gameCount > 0
      ? Math.round(((worst.gameCount - winner.gameCount) / worst.gameCount) * 100)
      : 0;
    const savings = Math.max(0, worst.cost - winner.cost);
    return { winner, worst, gain, savings, count: comparison.length };
  }, [comparison]);

  if (!primary || !stats) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Painel Executivo
          <Badge variant="secondary" className="ml-2 font-mono">
            {STRATEGY_LABELS[primary.strategy] ?? primary.strategy}
          </Badge>
          {stats.meets ? (
            <Badge className="ml-auto bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Garantia validada
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-auto text-amber-500 border-amber-500/40 gap-1">
              <AlertTriangle className="h-3 w-3" /> Garantia parcial
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi
            icon={Layers}
            label="Jogos"
            value={formatNumber(stats.games)}
            sub={`min. teórico ${stats.lowerBound}`}
          />
          <Kpi
            icon={Coins}
            label="Custo total"
            value={formatCurrency(stats.cost)}
            sub={`${formatCurrency(stats.cost / Math.max(1, stats.games))}/jogo`}
          />
          <Kpi
            icon={Shield}
            label="Garantia"
            value={`${stats.guarantee} acertos`}
            sub={`meta ${stats.target}`}
            tone={stats.meets ? "success" : "warning"}
          />
          <Kpi
            icon={Target}
            label="Cobertura"
            value={`${stats.coverage.toFixed(1)}%`}
            sub={`nota geral ${stats.overall}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" /> Otimização vs. lower bound
              </span>
              <span className="font-mono font-semibold">{stats.optimality}%</span>
            </div>
            <Progress value={stats.optimality} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              100% = número de jogos igual ao mínimo teórico (Schönheim).
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" /> Tempo de execução
              </span>
              <span className="font-mono font-semibold">{stats.elapsed} ms</span>
            </div>
            <Progress value={Math.max(5, Math.min(100, 100 - Math.log10(Math.max(1, stats.elapsed)) * 20))} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground">
              {stats.elapsed < 500 ? "Instantâneo" : stats.elapsed < 3000 ? "Rápido" : "Análise profunda"}.
            </p>
          </div>
        </div>

        {comparisonStats && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Resultado da comparação ({comparisonStats.count} estratégias)
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Vencedor</p>
                <p className="font-semibold">{STRATEGY_LABELS[comparisonStats.winner.strategy]}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {comparisonStats.winner.gameCount} jogos · nota {comparisonStats.winner.score.overall}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Redução vs. pior</p>
                <p className={cn("font-mono font-semibold", comparisonStats.gain > 0 && "text-emerald-500")}>
                  −{comparisonStats.gain}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {comparisonStats.worst.gameCount} → {comparisonStats.winner.gameCount} jogos
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Economia</p>
                <p className="font-mono font-semibold text-emerald-500">
                  {formatCurrency(comparisonStats.savings)}
                </p>
                <p className="text-[10px] text-muted-foreground">vs. pior estratégia</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-lg border bg-background/60 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p
        className={cn(
          "text-xl font-bold font-mono",
          tone === "success" && "text-emerald-500",
          tone === "warning" && "text-amber-500",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground font-mono">{sub}</p>}
    </div>
  );
}
