/**
 * ClosingROISimulatorPanel — estima ROI do fechamento contra os últimos N sorteios.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, TrendingDown, Coins, Play, Info } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import type { ClosingResult } from "@/engine/closing";
import { simulateRoi, getAvgPrizeTable } from "@/engine/closing/analysis/roiSimulator";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

export function ClosingROISimulatorPanel({ result }: Props) {
  const { draws, config } = useLotteryContext();
  const [windowSize, setWindowSize] = useState(30);
  const [ran, setRan] = useState(false);

  const prizeTable = getAvgPrizeTable(config.id);
  const hasPrizeData = Object.keys(prizeTable).length > 0;

  const sim = useMemo(() => {
    if (!ran) return null;
    return simulateRoi({
      lotteryId: config.id,
      ticketPrice: result.request.lottery.ticketPrice,
      games: result.games,
      recentDraws: draws.slice(0, windowSize).map(d => ({
        concurso: d.concurso, numbers: d.numbers, date: d.date,
      })),
      window: windowSize,
    });
  }, [ran, config.id, result, draws, windowSize]);

  const positive = sim && sim.roiPercent >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Coins className="h-5 w-5 text-amber-500" />
          Simulador de ROI
          <Badge variant="outline" className="ml-auto text-[10px]">
            {draws.length} sorteios carregados
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPrizeData ? (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tabela de prêmios médios não disponível para {config.name}. Estimativa não pode ser calculada.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div>
              <Label className="text-xs flex items-center justify-between">
                <span>Janela de simulação</span>
                <span className="font-mono">{windowSize} sorteios</span>
              </Label>
              <Slider
                value={[windowSize]}
                onValueChange={(v) => { setWindowSize(v[0]); setRan(false); }}
                min={5}
                max={Math.min(100, Math.max(10, draws.length))}
                step={5}
                className="mt-2"
              />
            </div>

            <Button onClick={() => setRan(true)} disabled={draws.length === 0}>
              <Play className="h-4 w-4 mr-1" /> Simular ROI
            </Button>

            {sim && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <RoiStat
                    label="ROI médio"
                    value={`${sim.roiPercent >= 0 ? "+" : ""}${sim.roiPercent.toFixed(1)}%`}
                    highlight={positive}
                    negative={!positive}
                    icon={positive ? TrendingUp : TrendingDown}
                  />
                  <RoiStat
                    label="Resultado líquido"
                    value={formatCurrency(sim.netResult)}
                    highlight={positive}
                    negative={!positive}
                  />
                  <RoiStat label="Custo total" value={formatCurrency(sim.totalCost)} />
                  <RoiStat label="Prêmio estimado" value={formatCurrency(sim.totalPrize)} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <SmallStat label="Sorteios premiados" value={`${sim.winningDraws}/${sim.drawsConsidered}`} />
                  <SmallStat label="Hit rate" value={`${sim.hitRatePercent.toFixed(1)}%`} />
                  <SmallStat label="Break-even" value={sim.breakEvenGames ? `${sim.breakEvenGames} jogos/mês` : "—"} />
                </div>

                {sim.bestDraw && sim.bestDraw.prizeTotal > 0 && (
                  <div className="rounded-lg border bg-amber-500/5 border-amber-500/30 p-3">
                    <p className="text-xs text-muted-foreground">Melhor concurso na janela</p>
                    <p className="text-sm font-semibold mt-1">
                      #{sim.bestDraw.concurso} — {formatCurrency(sim.bestDraw.prizeTotal)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(sim.bestDraw.winners).map(([hits, count]) => (
                        <Badge key={hits} variant="outline" className="text-[10px]">
                          {count}× {hits} acertos
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Ver curva concurso a concurso ({sim.perDraw.length})
                  </summary>
                  <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
                    {sim.perDraw.map(d => {
                      const net = d.prizeTotal - result.gameCount * result.request.lottery.ticketPrice;
                      return (
                        <div key={d.concurso} className={cn(
                          "flex justify-between items-center rounded p-1.5",
                          net > 0 ? "bg-emerald-500/10" : "bg-muted/20",
                        )}>
                          <span className="font-mono">#{d.concurso}</span>
                          <span className={cn("font-mono", net > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                            {net >= 0 ? "+" : ""}{formatCurrency(net)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>

                <Alert variant="default" className="text-[11px]">
                  <Info className="h-3 w-3" />
                  <AlertDescription>
                    Estimativa baseada em prêmios médios históricos. Faixas de jackpot usam piso conservador — resultado real depende do rateio de cada concurso.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RoiStat({ label, value, highlight, negative, icon: Icon }: {
  label: string; value: string; highlight?: boolean; negative?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={cn(
      "rounded-lg border p-3",
      highlight && "border-emerald-500/50 bg-emerald-500/5",
      negative && "border-red-500/40 bg-red-500/5",
      !highlight && !negative && "bg-muted/20",
    )}>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <p className={cn(
        "font-mono font-bold text-lg mt-1",
        highlight && "text-emerald-400",
        negative && "text-red-400",
      )}>{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-muted/10 p-2">
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
      <p className="font-mono font-semibold">{value}</p>
    </div>
  );
}
