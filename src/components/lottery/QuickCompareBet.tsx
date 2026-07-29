/**
 * QuickCompareBet
 * -----------------------------------------------------------------------------
 * Componente enxuto que permite ao apostador colar uma aposta manual e
 * ver instantaneamente:
 *   - Alinhamento ao perfil vencedor recente (centroide estatístico)
 *   - Similaridade ao Consenso Titan (dezenas mais votadas pelo motor)
 *   - Verdito qualitativo (Excelente / Bom / Aceitável / Fraco)
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Scale, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DrawResult } from "@/data/lotteries";
import {
  computeWinnerProfile,
  alignmentScore,
} from "@/ai/engines/winnerProfileEngine";

interface Props {
  draws: DrawResult[];
  lotteryId: string;
  pick: number;
  totalNumbers: number;
  /** Consenso Titan opcional: dezenas âncoras do motor. */
  consensusNumbers?: number[];
}

function parseNums(raw: string, max: number): number[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;\-\.\/|]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= max),
    ),
  ).sort((a, b) => a - b);
}

function verdict(score: number) {
  if (score >= 0.8) return { label: "Excelente", tone: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  if (score >= 0.65) return { label: "Bom", tone: "bg-lime-500/15 text-lime-400 border-lime-500/30" };
  if (score >= 0.5) return { label: "Aceitável", tone: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
  return { label: "Fraco", tone: "bg-red-500/15 text-red-400 border-red-500/30" };
}

export function QuickCompareBet({ draws, lotteryId, pick, totalNumbers, consensusNumbers = [] }: Props) {
  const [raw, setRaw] = useState("");

  const profile = useMemo(
    () => computeWinnerProfile(draws, lotteryId, 200),
    [draws, lotteryId],
  );

  const nums = useMemo(() => parseNums(raw, totalNumbers), [raw, totalNumbers]);
  const valid = nums.length === pick;
  const prev = draws[0]?.numbers;

  const evaluation = useMemo(() => {
    if (!valid) return null;
    const align = alignmentScore(nums, profile, lotteryId, prev);
    const consensusSet = new Set(consensusNumbers);
    const overlap = nums.filter((n) => consensusSet.has(n)).length;
    const consensusScore = consensusNumbers.length
      ? overlap / Math.min(nums.length, consensusNumbers.length)
      : 0;
    const composite = consensusNumbers.length
      ? align * 0.6 + consensusScore * 0.4
      : align;
    return { align, consensusScore, overlap, composite };
  }, [valid, nums, profile, lotteryId, prev, consensusNumbers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Scale className="h-4 w-4 text-primary" />
          Comparador Rápido
          <Badge variant="outline" className="ml-auto text-[10px]">
            {consensusNumbers.length > 0 ? "vs Perfil + Consenso" : "vs Perfil vencedor"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder={`Cole ${pick} dezenas (ex: 01 05 10 15 ...)`}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="font-mono"
        />
        {raw && !valid && (
          <p className="text-xs text-amber-500">
            {nums.length} de {pick} dezenas válidas.
          </p>
        )}
        {evaluation && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {nums.map((n) => {
                const isConsensus = consensusNumbers.includes(n);
                return (
                  <span
                    key={n}
                    className={cn(
                      "inline-flex items-center justify-center h-7 w-7 rounded-full font-mono font-semibold text-xs border",
                      isConsensus
                        ? "bg-primary/20 text-primary border-primary/40"
                        : "bg-muted/40 border-border/60",
                    )}
                    title={isConsensus ? "Presente no Consenso Titan" : undefined}
                  >
                    {n.toString().padStart(2, "0")}
                  </span>
                );
              })}
            </div>
            <Row label="Alinhamento ao perfil vencedor" value={evaluation.align} />
            {consensusNumbers.length > 0 && (
              <Row
                label={`Sobreposição com Consenso (${evaluation.overlap}/${nums.length})`}
                value={evaluation.consensusScore}
              />
            )}
            <div className="pt-2 border-t border-border/40 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Verdito Titan</span>
              <span
                className={cn(
                  "ml-auto text-xs px-2 py-0.5 rounded-full border",
                  verdict(evaluation.composite).tone,
                )}
              >
                {verdict(evaluation.composite).label} · {(evaluation.composite * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={evaluation.composite * 100} className="h-2" />
          </div>
        )}
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

export default QuickCompareBet;
