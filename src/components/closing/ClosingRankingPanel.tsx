/**
 * ClosingRankingPanel — ordena os jogos do fechamento por score IA
 * (frequência recente + atraso + balanceamento) e destaca os Top N.
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Trophy, Flame, Snowflake, Clock } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { rankGames, type RankedGame } from "@/engine/closing/analysis/rankGames";
import { useLotteryDraws } from "@/hooks/useLotteryDraws";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

const TIER_STYLES: Record<RankedGame["tier"], string> = {
  S: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  B: "bg-sky-500/20 text-sky-400 border-sky-500/40",
  C: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  D: "bg-rose-500/20 text-rose-400 border-rose-500/40",
};

export function ClosingRankingPanel({ result }: Props) {
  const lotteryId = result.request.lottery.id;
  const { draws } = useLotteryDraws(lotteryId);
  const [topN, setTopN] = useState<number>(Math.min(10, result.games.length));

  const ranked = useMemo(() => {
    const recent = draws.slice(0, 80).map(d => d.dezenas);
    return rankGames({
      games: result.games,
      totalNumbers: result.request.lottery.totalNumbers,
      pick: result.request.lottery.pick,
      recentDraws: recent,
    });
  }, [draws, result]);

  const topSet = new Set(ranked.slice(0, topN).map(r => r.index));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Ranking Inteligente dos Jogos
          <Badge variant="secondary" className="ml-auto">{ranked.length} jogos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Destacar Top</span>
              <span className="font-mono font-semibold">{topN}</span>
            </div>
            <Slider
              value={[topN]}
              onValueChange={([v]) => setTopN(v)}
              min={1}
              max={Math.max(1, ranked.length)}
              step={1}
            />
          </div>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-orange-400" /> quentes</span>
            <span className="flex items-center gap-1"><Snowflake className="h-3.5 w-3.5 text-sky-400" /> frias</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-purple-400" /> atrasadas</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const top = ranked.slice(0, topN).map(r => r.numbers);
              const text = top.map((g, i) => `Top ${i + 1}: ${g.map(n => String(n).padStart(2, "0")).join(" ")}`).join("\n");
              navigator.clipboard.writeText(text);
            }}
          >
            Copiar Top {topN}
          </Button>
        </div>

        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {ranked.map((r, pos) => {
            const isTop = topSet.has(r.index);
            return (
              <div
                key={r.index}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-lg border p-2.5 transition-all",
                  isTop ? "bg-amber-500/5 border-amber-500/30 shadow-sm" : "bg-muted/10 border-border",
                )}
              >
                <div className="flex items-center gap-2 min-w-[80px]">
                  <span className="font-mono font-bold text-sm text-muted-foreground w-6 text-right">
                    #{pos + 1}
                  </span>
                  <Badge className={cn("text-[10px] font-bold", TIER_STYLES[r.tier])} variant="outline">
                    {r.tier}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {r.numbers.map(n => (
                    <span
                      key={n}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-mono font-bold border border-primary/30"
                    >
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-orange-400" title="Dezenas quentes">
                    <Flame className="h-3 w-3" /> {r.hotHits}
                  </span>
                  <span className="flex items-center gap-1 text-purple-400" title="Dezenas atrasadas">
                    <Clock className="h-3 w-3" /> {r.overdueHits}
                  </span>
                  <span className="flex items-center gap-1 text-sky-400" title="Dezenas frias">
                    <Snowflake className="h-3 w-3" /> {r.coldHits}
                  </span>
                  <span className="font-bold text-primary min-w-[38px] text-right">{r.score}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Score baseado em: frequência recente (últimos 80 sorteios), atraso, distribuição par/ímpar
          e proximidade da soma ideal. Marcar Top N destaca os jogos com maior potencial estatístico.
        </p>
      </CardContent>
    </Card>
  );
}
