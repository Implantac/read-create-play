/**
 * ClosingConferencePanel — confere todos os jogos do fechamento contra o
 * último concurso oficial e resume acertos, faixas de premio e melhores jogos.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Trophy, Target, Loader2 } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

export function ClosingConferencePanel({ result }: Props) {
  const { draws, loading } = useLotteryContext();
  const [concursoIdx, setConcursoIdx] = useState<number>(0);
  const [checked, setChecked] = useState(false);

  const selectableDraws = useMemo(() => draws.slice(0, 20), [draws]);
  const draw = selectableDraws[concursoIdx];

  const stats = useMemo(() => {
    if (!draw) return null;
    const winSet = new Set(draw.numbers);
    const pick = result.request.lottery.pick;
    const perGame = result.games.map((g) => g.filter((n) => winSet.has(n)).length);
    const histogram = new Array(pick + 1).fill(0);
    perGame.forEach((h) => histogram[h]++);
    const best = Math.max(...perGame, 0);
    const bestIdx = perGame.indexOf(best);
    const prizeThreshold = Math.max(4, pick - 2);
    const winners = perGame.filter((h) => h >= prizeThreshold).length;
    return { perGame, histogram, best, bestIdx, winners, prizeThreshold, pick };
  }, [draw, result]);

  const winSet = useMemo(() => new Set(draw?.numbers ?? []), [draw]);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Conferencia contra Sorteio Oficial
          {draw && (
            <Badge variant="outline" className="ml-auto">
              Concurso #{draw.concurso}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando sorteios...
          </div>
        ) : selectableDraws.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum sorteio disponivel.</p>
        ) : (
          <>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <label className="text-xs text-muted-foreground">Concurso a conferir</label>
                <Select value={String(concursoIdx)} onValueChange={(v) => { setConcursoIdx(Number(v)); setChecked(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selectableDraws.map((d, i) => (
                      <SelectItem key={d.concurso} value={String(i)}>
                        #{d.concurso} — {d.data}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setChecked(true)}>
                <Target className="h-4 w-4 mr-1" /> Conferir {result.gameCount} jogos
              </Button>
            </div>

            {draw && (
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground mb-2">Dezenas sorteadas</p>
                <div className="flex flex-wrap gap-1.5">
                  {[...draw.numbers].sort((a, b) => a - b).map((n) => (
                    <span key={n} className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-semibold text-sm">
                      {pad(n)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {checked && stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <StatBox label="Melhor jogo" value={`${stats.best} acertos`} highlight={stats.best >= stats.prizeThreshold} />
                  <StatBox label="Jogos premiados" value={`${stats.winners}/${result.gameCount}`} highlight={stats.winners > 0} />
                  <StatBox label="Faixa minima" value={`${stats.prizeThreshold}+ acertos`} />
                  <StatBox label="Media" value={(stats.perGame.reduce((a, b) => a + b, 0) / stats.perGame.length).toFixed(2)} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Distribuicao de acertos</p>
                  <div className="grid gap-1">
                    {stats.histogram.map((count, hits) => {
                      if (count === 0) return null;
                      const pct = (count / result.gameCount) * 100;
                      const winTier = hits >= stats.prizeThreshold;
                      return (
                        <div key={hits} className="flex items-center gap-2 text-xs">
                          <span className={cn("w-16 font-mono", winTier && "text-emerald-400 font-bold")}>
                            {hits} acerto{hits !== 1 ? "s" : ""}
                          </span>
                          <div className="flex-1 h-4 rounded bg-muted/40 overflow-hidden">
                            <div
                              className={cn("h-full", winTier ? "bg-emerald-500" : "bg-primary/60")}
                              style={{ width: `${Math.max(2, pct)}%` }}
                            />
                          </div>
                          <span className="w-16 text-right font-mono">{count} ({pct.toFixed(1)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    <Trophy className="h-3 w-3 inline mr-1 text-amber-500" />
                    Melhores jogos
                  </p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {stats.perGame
                      .map((h, i) => ({ hits: h, idx: i, game: result.games[i] }))
                      .sort((a, b) => b.hits - a.hits)
                      .slice(0, 10)
                      .map(({ hits, idx, game }) => (
                        <div key={idx} className={cn(
                          "flex items-center gap-2 rounded p-1.5 text-xs",
                          hits >= stats.prizeThreshold ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-muted/20",
                        )}>
                          <span className="font-mono text-muted-foreground w-8">#{idx + 1}</span>
                          <div className="flex flex-wrap gap-1 flex-1">
                            {game.map((n) => (
                              <span key={n} className={cn(
                                "inline-flex items-center justify-center h-6 w-6 rounded-full font-mono font-semibold text-[10px]",
                                winSet.has(n)
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted text-muted-foreground",
                              )}>
                                {pad(n)}
                              </span>
                            ))}
                          </div>
                          <span className={cn("font-mono font-bold w-16 text-right", hits >= stats.prizeThreshold && "text-emerald-400")}>
                            {hits} pts
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3", highlight ? "border-emerald-500/50 bg-emerald-500/5" : "bg-muted/20")}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-mono font-bold text-lg mt-1", highlight && "text-emerald-400")}>{value}</p>
    </div>
  );
}
