/**
 * Winner Profile & Similarity Panel
 * -----------------------------------------------------------------------------
 * Shows the "centroid" of recent winning draws (mean ± std per dimension) and
 * lets the user test any bet against that profile via alignment + pair/triplet
 * lift bonuses. Purely presentational — reuses the existing winnerProfileEngine.
 */

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, Trophy, Sparkles, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrawResult } from "@/data/lotteries";
import {
  computeWinnerProfile,
  alignmentScore,
  computePairLift,
  pairLiftBonus,
  computeTripletLift,
  tripletLiftBonus,
} from "@/ai/engines/winnerProfileEngine";

interface Props {
  draws: DrawResult[];
  lotteryId: string;
  totalNumbers: number;
  pick: number;
}

interface Dim {
  key: string;
  label: string;
  mean: number;
  std: number;
  show?: boolean;
}

function parseNumbers(raw: string, max: number): number[] {
  const nums = raw
    .split(/[\s,;\-\.\/|]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= max);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

export function WinnerProfilePanel({ draws, lotteryId, totalNumbers, pick }: Props) {
  const [raw, setRaw] = useState("");

  const profile = useMemo(
    () => computeWinnerProfile(draws, lotteryId, 200),
    [draws, lotteryId],
  );
  const pairLift = useMemo(
    () => computePairLift(draws, totalNumbers, pick, 200),
    [draws, totalNumbers, pick],
  );
  const tripletLift = useMemo(
    () => computeTripletLift(draws, totalNumbers, pick, 200),
    [draws, totalNumbers, pick],
  );

  const numbers = useMemo(() => parseNumbers(raw, totalNumbers), [raw, totalNumbers]);
  const validCount = numbers.length === pick;

  const prev = draws[0]?.numbers;
  const evaluation = useMemo(() => {
    if (!validCount) return null;
    const align = alignmentScore(numbers, profile, lotteryId, prev);
    const pair = pairLiftBonus(numbers, pairLift);
    const trip = tripletLiftBonus(numbers, tripletLift);
    // Weighted composite: alignment dominates, lifts are boosters.
    const composite = Math.max(0, Math.min(1, align * 0.65 + pair * 0.2 + trip * 0.15));
    return { align, pair, trip, composite };
  }, [validCount, numbers, profile, lotteryId, prev, pairLift, tripletLift]);

  const dims: Dim[] = [
    { key: "sum", label: "Soma", mean: profile.sum.mean, std: profile.sum.std },
    { key: "even", label: "Pares", mean: profile.even.mean, std: profile.even.std },
    { key: "repeat", label: "Repetição do anterior", mean: profile.repeat.mean, std: profile.repeat.std },
    { key: "maxSeq", label: "Máx. sequência", mean: profile.maxSeq.mean, std: profile.maxSeq.std },
    { key: "decadeUsed", label: "Dezenas usadas", mean: profile.decadeUsed.mean, std: profile.decadeUsed.std },
    { key: "high", label: "Dezenas altas", mean: profile.high.mean, std: profile.high.std },
    { key: "primes", label: "Primos", mean: profile.primes.mean, std: profile.primes.std },
    { key: "fibo", label: "Fibonacci", mean: profile.fibo.mean, std: profile.fibo.std },
    { key: "frame", label: "Moldura (Lotofácil)", mean: profile.frame.mean, std: profile.frame.std, show: lotteryId === "lotofacil" },
  ];

  const verdict = (score: number) => {
    if (score >= 0.8) return { label: "Excelente", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
    if (score >= 0.65) return { label: "Bom", tone: "bg-lime-500/15 text-lime-400 border-lime-500/30" };
    if (score >= 0.5) return { label: "Aceitável", tone: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
    return { label: "Fraco", tone: "bg-red-500/15 text-red-400 border-red-500/30" };
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Perfil Vencedor & Similaridade
          <Badge variant="outline" className="ml-auto font-mono text-xs">
            {profile.sample} sorteios
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Info className="h-3 w-3" />
          Centroide estatístico dos sorteios recentes. Compare qualquer aposta abaixo.
        </p>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Centroid grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {dims
            .filter((d) => d.show !== false)
            .map((d) => (
              <div
                key={d.key}
                className="rounded-lg border border-border/50 bg-card/40 backdrop-blur px-3 py-2"
              >
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {d.label}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold font-mono tabular-nums">
                    {d.mean.toFixed(d.key === "sum" ? 0 : 1)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ± {d.std.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Bet tester */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Testar aposta</span>
            <span className="ml-auto text-[11px] text-muted-foreground">
              cole {pick} dezenas separadas por espaço, vírgula ou hífen
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder={`Ex.: ${Array.from({ length: pick }, (_, i) => (i + 1).toString().padStart(2, "0")).join(" ")}`}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              className="font-mono"
            />
            <Button
              variant="outline"
              onClick={() => setRaw("")}
              disabled={!raw}
              type="button"
            >
              Limpar
            </Button>
          </div>

          {raw && !validCount && (
            <p className="text-xs text-amber-500">
              {numbers.length} de {pick} dezenas válidas.
            </p>
          )}

          {evaluation && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                {numbers.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/15 text-primary font-mono font-semibold text-sm border border-primary/30"
                  >
                    {n.toString().padStart(2, "0")}
                  </span>
                ))}
              </div>

              <Row label="Alinhamento ao perfil" value={evaluation.align} />
              <Row label="Bônus de duplas (pair lift)" value={evaluation.pair} />
              <Row label="Bônus de trincas (triplet lift)" value={evaluation.trip} />

              <div className="pt-2 mt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Score de similaridade</span>
                  <span
                    className={cn(
                      "ml-auto text-xs px-2 py-0.5 rounded-full border",
                      verdict(evaluation.composite).tone,
                    )}
                  >
                    {verdict(evaluation.composite).label} · {(evaluation.composite * 100).toFixed(0)}%
                  </span>
                </div>
                <Progress value={evaluation.composite * 100} className="h-2 mt-2" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{(value * 100).toFixed(0)}%</span>
      </div>
      <Progress value={value * 100} className="h-1.5" />
    </div>
  );
}

export default WinnerProfilePanel;
