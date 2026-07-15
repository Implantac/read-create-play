/**
 * ClosingDominatedGamesPanel — detecta e remove jogos dominados sem reduzir cobertura.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scissors, Play, Info, TrendingDown } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { findDominatedGames } from "@/engine/closing/analysis/dominatedGames";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
  onApplyReduction?: (games: number[][]) => void;
}

export function ClosingDominatedGamesPanel({ result, onApplyReduction }: Props) {
  const [ran, setRan] = useState(false);

  const analysis = useMemo(() => {
    if (!ran) return null;
    return findDominatedGames({
      games: result.games,
      minHits: result.request.guarantee.minHits,
      pick: result.request.lottery.pick,
      maxRemove: Math.floor(result.gameCount * 0.4),
    });
  }, [ran, result]);

  const canRun = result.gameCount <= 500; // combinatorial safety

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Scissors className="h-5 w-5 text-primary" />
          Otimizador de Custo — Jogos Dominados
          {analysis && (
            <Badge variant={analysis.savings > 0 ? "default" : "outline"} className="ml-auto">
              {analysis.savings > 0
                ? `-${analysis.savings} jogos removíveis`
                : "Sem redundância detectada"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="text-xs">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Identifica jogos cuja cobertura de M-subsets é totalmente coberta por outros jogos —
            podem ser removidos sem afetar a garantia.
          </AlertDescription>
        </Alert>

        {!canRun ? (
          <Alert variant="destructive" className="text-xs">
            <AlertDescription>
              Muitos jogos ({result.gameCount}) para análise combinatória em tempo real. Limite: 500.
            </AlertDescription>
          </Alert>
        ) : (
          <Button onClick={() => setRan(true)}>
            <Play className="h-4 w-4 mr-1" /> Analisar jogos dominados
          </Button>
        )}

        {analysis && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Metric
                label="Jogos originais"
                value={String(analysis.originalCount)}
              />
              <Metric
                label="Jogos finais"
                value={String(analysis.finalCount)}
                highlight={analysis.savings > 0}
              />
              <Metric
                label="Economia"
                value={formatCurrency(analysis.savings * result.request.lottery.ticketPrice)}
                highlight={analysis.savings > 0}
                icon={TrendingDown}
              />
              <Metric
                label="Redução"
                value={`${((analysis.savings / analysis.originalCount) * 100).toFixed(1)}%`}
                highlight={analysis.savings > 0}
              />
            </div>

            {analysis.candidates.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Jogos removíveis ({analysis.candidates.length})
                </p>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {analysis.candidates.map(c => (
                    <div key={c.index} className="flex items-center gap-2 rounded p-1.5 bg-red-500/5 border border-red-500/20 text-xs">
                      <span className="font-mono text-muted-foreground w-10">#{c.index + 1}</span>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {c.numbers.map(n => (
                          <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground font-mono text-[10px]">
                            {n.toString().padStart(2, "0")}
                          </span>
                        ))}
                      </div>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {c.redundancyPct}% redund.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.savings > 0 && onApplyReduction && (
              <Button
                variant="secondary"
                onClick={() => onApplyReduction(analysis.keptGames)}
              >
                Aplicar redução ({analysis.finalCount} jogos)
              </Button>
            )}

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ver análise completa por jogo
              </summary>
              <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
                {analysis.analysis
                  .sort((a, b) => b.redundancyPct - a.redundancyPct)
                  .map(a => (
                    <div key={a.index} className="flex items-center justify-between rounded p-1.5 bg-muted/20 text-xs">
                      <span className="font-mono">#{a.index + 1}</span>
                      <div className="flex gap-3">
                        <span className="text-muted-foreground">única: {a.uniqueCoverage}</span>
                        <span className="text-muted-foreground">total: {a.totalCoverage}</span>
                        <span className={cn(
                          "font-semibold w-16 text-right",
                          a.safeToRemove ? "text-red-400" : "text-emerald-400",
                        )}>{a.redundancyPct}%</span>
                      </div>
                    </div>
                  ))}
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, highlight, icon: Icon }: {
  label: string; value: string; highlight?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={cn(
      "rounded-lg border p-3",
      highlight ? "border-emerald-500/50 bg-emerald-500/5" : "bg-muted/20",
    )}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <p className={cn("font-mono font-bold text-lg mt-1", highlight && "text-emerald-400")}>{value}</p>
    </div>
  );
}
