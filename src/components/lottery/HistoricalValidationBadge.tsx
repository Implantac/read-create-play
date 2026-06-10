import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Trophy, TrendingUp } from "lucide-react";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { validateAgainstHistory, HistoricalValidation } from "@/engine/generation-filters";

interface Props {
  bet: number[];
  draws: DrawResult[];
  config: LotteryConfig;
  maxDraws?: number;
}

export function HistoricalValidationBadge({ bet, draws, config, maxDraws = 100 }: Props) {
  const validation = useMemo(
    () => validateAgainstHistory(bet, draws, config, maxDraws),
    [bet, draws, config, maxDraws]
  );

  if (validation.totalDraws === 0) return null;

  const color =
    validation.wouldWin > 0
      ? "text-green-400 bg-green-400/10 border-green-400/30"
      : "text-muted-foreground bg-muted/30 border-border/30";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${color}`}>
            <Trophy className="w-3 h-3" />
            <span>{validation.avgHits.toFixed(1)} média</span>
            <span className="text-muted-foreground">|</span>
            <span>{validation.maxHits} máx</span>
            {validation.wouldWin > 0 && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="text-green-400">{validation.winRate} prêmio</span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold">Validação vs {validation.totalDraws} concursos</p>
            <p>Média de acertos: <strong>{validation.avgHits.toFixed(1)}</strong></p>
            <p>Máximo: <strong>{validation.maxHits}</strong> acertos (concurso #{validation.bestMatch?.concurso})</p>
            {validation.wouldWin > 0 && (
              <p className="text-green-400">
                Teria premiação em {validation.wouldWin}x ({validation.winRate})
              </p>
            )}
            <div className="pt-1 border-t border-border/50">
              <p className="text-muted-foreground font-medium mb-1">Distribuição de acertos:</p>
              {validation.hitDistribution.slice(0, 5).map(h => (
                <p key={h.hits}>
                  {h.hits} acertos: {h.count}x ({h.percentage}%)
                </p>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
