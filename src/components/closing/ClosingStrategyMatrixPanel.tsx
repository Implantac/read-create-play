/**
 * ClosingStrategyMatrixPanel — quando o usuário roda "Comparar", exibe uma matriz
 * com custo × cobertura × ROI estimado lado a lado para escolher a melhor.
 */
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCompare, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import type { ClosingResult, ClosingStrategy } from "@/engine/closing";
import { simulateRoi } from "@/engine/closing/analysis/roiSimulator";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const STRATEGY_LABELS: Record<ClosingStrategy, string> = {
  greedy: "Guloso",
  hill_climbing: "Hill Climbing",
  simulated_annealing: "Sim. Annealing",
  genetic: "Genético",
  covering_design: "Covering Design",
  beam_search: "Beam Search",
  backtracking: "Backtracking",
  branch_and_bound: "Branch & Bound",
  monte_carlo: "Monte Carlo",
  hybrid: "Híbrido",
};

interface Props {
  results: ClosingResult[];
  windowSize?: number;
  onPick?: (r: ClosingResult) => void;
}

export function ClosingStrategyMatrixPanel({ results, windowSize = 20, onPick }: Props) {
  const { draws, config } = useLotteryContext();

  const rows = useMemo(() => {
    const win = draws.slice(0, windowSize).map(d => ({
      concurso: d.concurso, numbers: d.numbers, date: d.date,
    }));
    return results.map(r => {
      const sim = simulateRoi({
        lotteryId: config.id,
        ticketPrice: r.request.lottery.ticketPrice,
        games: r.games,
        recentDraws: win,
        window: windowSize,
      });
      return {
        result: r,
        roi: sim.roiPercent,
        prize: sim.totalPrize,
        winRate: sim.hitRatePercent,
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [results, draws, windowSize, config.id]);

  const winnerByRoi = rows[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <GitCompare className="h-5 w-5 text-primary" />
          Matriz de Estratégias — Custo × Cobertura × ROI
          <Badge variant="outline" className="ml-auto text-[10px]">
            ROI simulado sobre {windowSize} sorteios
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2 px-2">Estratégia</th>
                <th className="text-right py-2 px-2">Jogos</th>
                <th className="text-right py-2 px-2">Custo</th>
                <th className="text-right py-2 px-2">Cobertura</th>
                <th className="text-right py-2 px-2">Garantia</th>
                <th className="text-right py-2 px-2">Prêmio est.</th>
                <th className="text-right py-2 px-2">Win rate</th>
                <th className="text-right py-2 px-2">ROI</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const r = row.result;
                const positive = row.roi >= 0;
                const isWinner = winnerByRoi && r.strategy === winnerByRoi.result.strategy;
                return (
                  <tr key={r.strategy} className={cn("border-b hover:bg-muted/30", isWinner && "bg-emerald-500/5")}>
                    <td className="py-2 px-2 font-medium">
                      {isWinner && <Trophy className="inline h-3 w-3 mr-1 text-emerald-500" />}
                      {STRATEGY_LABELS[r.strategy] ?? r.strategy}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">{r.gameCount}</td>
                    <td className="text-right py-2 px-2 font-mono">{formatCurrency(r.cost)}</td>
                    <td className="text-right py-2 px-2 font-mono">{r.validation.coveragePercent.toFixed(1)}%</td>
                    <td className={cn(
                      "text-right py-2 px-2 font-mono",
                      r.validation.meetsGuarantee ? "text-emerald-400" : "text-amber-500",
                    )}>
                      {r.validation.guaranteedHits}
                    </td>
                    <td className="text-right py-2 px-2 font-mono">{formatCurrency(row.prize)}</td>
                    <td className="text-right py-2 px-2 font-mono">{row.winRate.toFixed(0)}%</td>
                    <td className={cn(
                      "text-right py-2 px-2 font-mono font-semibold",
                      positive ? "text-emerald-400" : "text-red-400",
                    )}>
                      {positive
                        ? <TrendingUp className="inline h-3 w-3 mr-0.5" />
                        : <TrendingDown className="inline h-3 w-3 mr-0.5" />}
                      {positive ? "+" : ""}{row.roi.toFixed(1)}%
                    </td>
                    <td className="text-right py-2 px-2">
                      {onPick && (
                        <Button size="sm" variant="ghost" onClick={() => onPick(r)}>Ver</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">
          ROI é estimativa baseada em prêmios médios históricos. Vencedor destacado prioriza retorno esperado, não apenas cobertura teórica.
        </p>
      </CardContent>
    </Card>
  );
}
