/**
 * ClosingProgressivePanel — simula fechamento em múltiplas rodadas ajustando a base
 * automaticamente a cada concurso.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Layers, Play, ArrowRightLeft, Info } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import type { ClosingResult } from "@/engine/closing";
import { simulateProgressive } from "@/engine/closing/analysis/progressiveClosing";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
  onAdoptFinalBase?: (base: number[]) => void;
}

export function ClosingProgressivePanel({ result, onAdoptFinalBase }: Props) {
  const { draws, config } = useLotteryContext();
  const [rounds, setRounds] = useState(5);
  const [swapRate, setSwapRate] = useState(15);
  const [ran, setRan] = useState(false);

  const sim = useMemo(() => {
    if (!ran) return null;
    return simulateProgressive({
      totalNumbers: config.numbers,
      baseNumbers: result.request.baseNumbers,
      games: result.games,
      recentDraws: draws.slice(0, rounds).map(d => ({
        concurso: d.concurso, numbers: d.numbers, date: d.date,
      })),
      rounds,
      swapRate: swapRate / 100,
      ticketPrice: result.request.lottery.ticketPrice,
    });
  }, [ran, rounds, swapRate, result, draws, config.numbers]);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const pick = result.request.lottery.pick;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Layers className="h-5 w-5 text-primary" />
          Fechamento Progressivo
          <Badge variant="outline" className="ml-auto text-[10px]">Multi-etapas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="default" className="text-xs">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Simula rodada a rodada: ajusta a base substituindo dezenas frias por dezenas quentes recentes, mantendo os jogos originais como referência.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-xs flex items-center justify-between">
              <span>Rodadas</span><span className="font-mono">{rounds}</span>
            </Label>
            <Slider value={[rounds]} onValueChange={(v) => { setRounds(v[0]); setRan(false); }}
              min={2} max={Math.min(20, draws.length)} step={1} className="mt-2" />
          </div>
          <div>
            <Label className="text-xs flex items-center justify-between">
              <span>Taxa máx. de troca por rodada</span><span className="font-mono">{swapRate}%</span>
            </Label>
            <Slider value={[swapRate]} onValueChange={(v) => { setSwapRate(v[0]); setRan(false); }}
              min={5} max={40} step={5} className="mt-2" />
          </div>
        </div>

        <Button onClick={() => setRan(true)} disabled={draws.length < 2}>
          <Play className="h-4 w-4 mr-1" /> Simular {rounds} rodadas
        </Button>

        {sim && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <MiniStat label="Melhor rodada" value={`${Math.max(...sim.cumulativeBest, 0)} acertos`} />
              <MiniStat label="Média melhor/rodada"
                value={(sim.cumulativeBest.reduce((a, b) => a + b, 0) / Math.max(1, sim.cumulativeBest.length)).toFixed(1)} />
              <MiniStat label="Churn médio da base" value={`${sim.avgBaseChurn} dezenas`} />
              <MiniStat label="Base final" value={`${sim.finalBase.length} dezenas`} />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sim.rounds.map(r => (
                <div key={r.round} className="rounded-lg border bg-muted/10 p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-semibold">Rodada {r.round} — #{r.concurso}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant={r.bestHits >= pick - 1 ? "default" : "secondary"} className="font-mono">
                        {r.bestHits} acertos
                      </Badge>
                      <span className="text-muted-foreground">média {r.avgHits}</span>
                    </div>
                  </div>
                  {(r.removed.length > 0 || r.added.length > 0) && (
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                      {r.removed.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Fora:</span>
                          {r.removed.map(n => (
                            <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-[10px] font-mono">
                              {pad(n)}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.added.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Entra:</span>
                          {r.added.map(n => (
                            <span key={n} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">
                              {pad(n)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-lg border bg-primary/5 border-primary/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">Base sugerida após {sim.rounds.length} rodadas</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {sim.finalBase.map(n => (
                  <span key={n} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-xs font-mono font-bold border border-primary/40">
                    {pad(n)}
                  </span>
                ))}
              </div>
              {onAdoptFinalBase && (
                <Button size="sm" variant="secondary" onClick={() => onAdoptFinalBase(sim.finalBase)}>
                  Adotar como nova base
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-mono font-bold text-sm mt-0.5")}>{value}</p>
    </div>
  );
}
