/**
 * ClosingGuaranteeBacktestPanel — testa a garantia do fechamento contra os
 * últimos N concursos históricos.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, XCircle, Target, Flame, Play } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import type { ClosingResult } from "@/engine/closing";
import { backtestGuarantee } from "@/engine/closing/analysis/guaranteeBacktest";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

export function ClosingGuaranteeBacktestPanel({ result }: Props) {
  const { draws } = useLotteryContext();
  const [windowSize, setWindowSize] = useState(50);
  const [ran, setRan] = useState(false);

  const backtest = useMemo(() => {
    if (!ran) return null;
    return backtestGuarantee({
      games: result.games,
      minHits: result.request.guarantee.minHits,
      recentDraws: draws.slice(0, windowSize).map(d => ({
        concurso: d.concurso, numbers: d.numbers, date: d.date,
      })),
      window: windowSize,
    });
  }, [ran, windowSize, result, draws]);

  const targetGuarantee = result.request.guarantee.minHits;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Target className="h-5 w-5 text-primary" />
          Backtest Histórico da Garantia
          <Badge variant="outline" className="ml-auto text-[10px]">
            Meta: ≥ {targetGuarantee} acertos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs flex justify-between">
            <span>Janela</span><span className="font-mono">{windowSize} concursos</span>
          </Label>
          <Slider value={[windowSize]} onValueChange={(v) => { setWindowSize(v[0]); setRan(false); }}
            min={10} max={Math.min(200, draws.length)} step={10} className="mt-2" />
        </div>

        <Button onClick={() => setRan(true)} disabled={draws.length < 10}>
          <Play className="h-4 w-4 mr-1" /> Rodar backtest
        </Button>

        {backtest && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <BigStat
                label="Hit rate garantia"
                value={`${backtest.hitRatePercent.toFixed(1)}%`}
                sub={`${backtest.drawsMet}/${backtest.drawsConsidered} concursos`}
                highlight={backtest.hitRatePercent >= 50}
              />
              <BigStat
                label="Melhor média por concurso"
                value={backtest.avgBestHits.toFixed(2)}
                sub="acertos por concurso"
              />
              <BigStat
                label="Jogos c/ garantia em média"
                value={backtest.avgGamesAtGuarantee.toFixed(2)}
                sub={`de ${result.gameCount} jogos`}
              />
              <BigStat
                label={backtest.currentStreakMet > 0 ? "Streak atual (met)" : "Maior streak met"}
                value={backtest.currentStreakMet > 0
                  ? `${backtest.currentStreakMet}× seguidos`
                  : `${backtest.longestStreakMet} concursos`}
                icon={backtest.currentStreakMet >= 3 ? Flame : undefined}
                highlight={backtest.currentStreakMet >= 3}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Distribuição do melhor acerto por concurso
              </p>
              <div className="space-y-1">
                {Object.entries(backtest.histogram)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([hits, count]) => {
                    const pct = (count / backtest.drawsConsidered) * 100;
                    const met = Number(hits) >= targetGuarantee;
                    return (
                      <div key={hits} className="flex items-center gap-2 text-xs">
                        <span className={cn("w-20 font-mono", met && "text-emerald-400 font-bold")}>
                          {hits} acertos
                        </span>
                        <div className="flex-1 h-4 rounded bg-muted/40 overflow-hidden">
                          <div
                            className={cn("h-full", met ? "bg-emerald-500" : "bg-primary/60")}
                            style={{ width: `${Math.max(2, pct)}%` }}
                          />
                        </div>
                        <span className="w-24 text-right font-mono">
                          {count} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ver concurso a concurso ({backtest.perDraw.length})
              </summary>
              <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
                {backtest.perDraw.map(d => (
                  <div key={d.concurso} className={cn(
                    "flex justify-between items-center rounded p-1.5",
                    d.metGuarantee ? "bg-emerald-500/10" : "bg-muted/20",
                  )}>
                    <div className="flex items-center gap-2">
                      {d.metGuarantee
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="font-mono">#{d.concurso}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-muted-foreground">melhor {d.bestHits}</span>
                      {d.gamesAtGuarantee > 0 && (
                        <span className="text-emerald-400 font-semibold">
                          {d.gamesAtGuarantee} jogos ≥ {targetGuarantee}
                        </span>
                      )}
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

function BigStat({ label, value, sub, highlight, icon: Icon }: {
  label: string; value: string; sub?: string; highlight?: boolean;
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
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
