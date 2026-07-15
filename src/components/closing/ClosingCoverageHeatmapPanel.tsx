/**
 * ClosingCoverageHeatmapPanel
 * Visualiza a cobertura por dezena do fechamento: quantos jogos contêm cada
 * dezena da base, com heatmap colorido e destaque das dezenas sub/super-representadas.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flame, Snowflake, Grid3x3, Info } from "lucide-react";
import type { ClosingResult } from "@/engine/closing";
import { cn } from "@/lib/utils";

interface Props {
  result: ClosingResult;
}

export function ClosingCoverageHeatmapPanel({ result }: Props) {
  const { base, freq, min, max, avg, hot, cold } = useMemo(() => {
    const base = [...result.request.baseNumbers].sort((a, b) => a - b);
    const freq = new Map<number, number>();
    base.forEach(n => freq.set(n, 0));
    result.games.forEach(g => {
      g.forEach(n => {
        if (freq.has(n)) freq.set(n, (freq.get(n) ?? 0) + 1);
      });
    });
    const values = base.map(n => freq.get(n) ?? 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
    const sorted = [...base].sort((a, b) => (freq.get(b) ?? 0) - (freq.get(a) ?? 0));
    const hot = sorted.slice(0, 5);
    const cold = sorted.slice(-5).reverse();
    return { base, freq, min, max, avg, hot, cold };
  }, [result]);

  const range = Math.max(1, max - min);
  const colorFor = (n: number) => {
    const v = freq.get(n) ?? 0;
    const norm = (v - min) / range; // 0..1
    if (norm >= 0.75) return "bg-red-500/80 text-white border-red-600";
    if (norm >= 0.5) return "bg-orange-500/70 text-white border-orange-600";
    if (norm >= 0.25) return "bg-yellow-500/60 text-foreground border-yellow-600";
    return "bg-blue-500/50 text-white border-blue-600";
  };

  const balanced = range <= Math.max(2, Math.round(avg * 0.25));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-primary" />
          Heatmap de Cobertura por Dezena
          <Badge variant={balanced ? "default" : "secondary"} className="ml-2 text-xs">
            {balanced ? "Balanceado" : "Desbalanceado"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Cada célula mostra em quantos dos <strong>{result.gameCount}</strong> jogos a dezena aparece.
            Média: <strong>{avg.toFixed(1)}</strong> · Mín: <strong>{min}</strong> · Máx: <strong>{max}</strong>.
          </AlertDescription>
        </Alert>

        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))" }}>
          {base.map(n => {
            const v = freq.get(n) ?? 0;
            const pct = result.gameCount > 0 ? (v / result.gameCount) * 100 : 0;
            return (
              <div
                key={n}
                className={cn(
                  "rounded-lg border p-2 flex flex-col items-center justify-center transition-transform hover:scale-105",
                  colorFor(n),
                )}
                title={`Dezena ${n.toString().padStart(2, "0")}: ${v}/${result.gameCount} jogos (${pct.toFixed(0)}%)`}
              >
                <span className="font-mono text-lg font-bold">{n.toString().padStart(2, "0")}</span>
                <span className="font-mono text-[10px] opacity-90">{v}× · {pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 bg-red-500/5">
            <p className="text-xs font-medium flex items-center gap-1 mb-2 text-red-500">
              <Flame className="h-3.5 w-3.5" /> Mais frequentes (super-representadas)
            </p>
            <div className="flex flex-wrap gap-1">
              {hot.map(n => (
                <span key={n} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/15 text-xs font-mono">
                  {n.toString().padStart(2, "0")} <Badge variant="outline" className="ml-1 text-[10px] h-4">{freq.get(n)}×</Badge>
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-3 bg-blue-500/5">
            <p className="text-xs font-medium flex items-center gap-1 mb-2 text-blue-500">
              <Snowflake className="h-3.5 w-3.5" /> Menos frequentes (sub-representadas)
            </p>
            <div className="flex flex-wrap gap-1">
              {cold.map(n => (
                <span key={n} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/15 text-xs font-mono">
                  {n.toString().padStart(2, "0")} <Badge variant="outline" className="ml-1 text-[10px] h-4">{freq.get(n)}×</Badge>
                </span>
              ))}
            </div>
          </div>
        </div>

        {!balanced && (
          <Alert variant="default" className="text-xs">
            <Info className="h-4 w-4" />
            <AlertDescription>
              A cobertura está desbalanceada — algumas dezenas aparecem muito mais que outras.
              Em fechamentos garantidos isso é esperado (estratégia gulosa prioriza dezenas de alto ganho),
              mas se você quer distribuição mais uniforme, teste as estratégias <strong>Covering Design</strong> ou <strong>Simulated Annealing</strong>.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
