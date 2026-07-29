/**
 * ShapExplanationCard
 * -----------------------------------------------------------------------------
 * Renders an additive (SHAP-style) breakdown of *why* a bet scored well or
 * poorly against the Titan feature set. Uses lottery-agnostic features so it
 * works across all modalities:
 *   - parity balance
 *   - sum inside expected range
 *   - decade coverage
 *   - consecutive discipline
 *   - dispersion (unique tens)
 *   - repetition against previous draw
 *
 * The math is intentionally the exact linear decomposition from
 * `shapExplainer.ts`, so every contribution is auditable.
 */
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { explainScore } from "@/ai/explainability/shapExplainer";
import type { LotteryConfig } from "@/data/lotteries";
import type { DrawResult } from "@/data/lotteries";
import { cn } from "@/lib/utils";

interface Props {
  numbers: number[];
  config: LotteryConfig;
  draws: DrawResult[];
  title?: string;
}

function computeFeatures(numbers: number[], config: LotteryConfig, draws: DrawResult[]) {
  const max = config.numbers ?? 25;
  const pick = numbers.length || 1;
  const set = new Set(numbers);
  const sorted = [...numbers].sort((a, b) => a - b);

  // Parity balance: 1 when odd/even is closest to 50/50.
  const odd = numbers.filter((n) => n % 2 === 1).length;
  const parity = 1 - Math.abs(odd / pick - 0.5) * 2;

  // Sum inside expected mean band (±20%).
  const expectedMean = ((1 + max) / 2) * pick;
  const sum = numbers.reduce((a, b) => a + b, 0);
  const sumDelta = Math.abs(sum - expectedMean) / expectedMean;
  const sumFit = Math.max(0, 1 - sumDelta / 0.2);

  // Decade coverage: how many decades (1-10, 11-20, …) are touched vs available.
  const decadesAvailable = Math.ceil(max / 10);
  const decadesTouched = new Set(numbers.map((n) => Math.floor((n - 1) / 10))).size;
  const decadeCoverage = decadesTouched / decadesAvailable;

  // Consecutive count (adjacent pairs). Ideal ≈ pick * 0.15.
  let consec = 0;
  for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] === 1) consec++;
  const consecTarget = Math.max(1, pick * 0.15);
  const consecFit = Math.max(0, 1 - Math.abs(consec - consecTarget) / consecTarget);

  // Repetition vs last draw (percentage of numbers matching prior draw).
  const last = draws[0]?.numbers ?? [];
  const reps = last.filter((n) => set.has(n)).length;
  const repFit = last.length ? Math.min(1, reps / Math.max(1, last.length * 0.5)) : 0.5;

  // Dispersion: unique tens groups relative to what's possible.
  const groups = new Set(numbers.map((n) => Math.floor((n - 1) / 5))).size;
  const groupsMax = Math.min(pick, Math.ceil(max / 5));
  const dispersion = groups / groupsMax;

  return {
    parity,
    soma: sumFit,
    "cobertura de décadas": decadeCoverage,
    consecutivos: consecFit,
    repetição: repFit,
    dispersão: dispersion,
  };
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  parity: 0.12,
  soma: 0.18,
  "cobertura de décadas": 0.2,
  consecutivos: 0.1,
  repetição: 0.2,
  dispersão: 0.2,
};

export function ShapExplanationCard({ numbers, config, draws, title }: Props) {
  const explanation = useMemo(() => {
    if (!numbers || numbers.length === 0) return null;
    const features = computeFeatures(numbers, config, draws);
    return explainScore({ features, weights: DEFAULT_WEIGHTS });
  }, [numbers, config, draws]);

  if (!explanation) return null;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {title ?? "Por que este jogo pontuou assim?"}
          <Badge variant="outline" className="ml-auto font-mono text-xs">
            {(explanation.finalScore * 100).toFixed(0)} / 100
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="text-xs text-muted-foreground">
          Baseline (jogo aleatório): {(explanation.baseScore * 100).toFixed(1)} · Δ{" "}
          <span
            className={cn(
              "font-mono font-semibold",
              explanation.delta >= 0 ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {explanation.delta >= 0 ? "+" : ""}
            {(explanation.delta * 100).toFixed(1)} pts
          </span>
        </div>

        <div className="grid gap-1.5">
          {explanation.contributions.map((c) => {
            const width = Math.min(100, c.pctOfTotal * 100);
            const positive = c.direction === "positive";
            return (
              <div key={c.feature} className="text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  {positive ? (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-rose-400" />
                  )}
                  <span className="capitalize">{c.feature}</span>
                  <span
                    className={cn(
                      "ml-auto font-mono tabular-nums",
                      positive ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {c.contribution >= 0 ? "+" : ""}
                    {(c.contribution * 100).toFixed(1)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      positive ? "bg-emerald-500/60" : "bg-rose-500/60",
                    )}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ShapExplanationCard;
