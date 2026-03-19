import { ExtremeBet } from "@/engine/extreme-generator";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { Flame, Snowflake, Trophy, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  bets: ExtremeBet[];
  stats: NumberStats[];
  config: LotteryConfig;
  onClose: () => void;
}

export function ExtremeComparisonPanel({ bets, stats, config, onClose }: Props) {
  const getCombined = (b: ExtremeBet) =>
    Math.round(b.score * 0.7 + b.backtest.winRate * 0.2 + b.backtest.consistency * 0.1);

  const metrics = [
    { label: "Nota Combinada", get: (b: ExtremeBet) => getCombined(b), best: "max" },
    { label: "Score", get: (b: ExtremeBet) => b.score, best: "max" },
    { label: "Win Rate", get: (b: ExtremeBet) => b.backtest.winRate, suffix: "%", best: "max" },
    { label: "Consistência", get: (b: ExtremeBet) => b.backtest.consistency, best: "max" },
    { label: "Média Acertos", get: (b: ExtremeBet) => b.backtest.avgHits, best: "max" },
    { label: "Melhor Acerto", get: (b: ExtremeBet) => b.backtest.bestHit, best: "max" },
    { label: "Soma", get: (b: ExtremeBet) => b.sum, best: "neutral" },
    { label: "Paridade", get: (b: ExtremeBet) => b.parityLabel, best: "neutral" },
    { label: "Quentes", get: (b: ExtremeBet) => b.hotNumbers, best: "neutral" },
    { label: "Frias", get: (b: ExtremeBet) => b.coldNumbers, best: "neutral" },
    { label: "Repet. Ant.", get: (b: ExtremeBet) => b.repeatFromLast, best: "neutral" },
  ] as const;

  return (
    <div className="rounded-xl bg-card border border-primary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          📊 Comparação de {bets.length} Jogos
        </h4>
        <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Numbers display */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `auto repeat(${bets.length}, 1fr)` }}>
        <div className="text-[10px] text-muted-foreground font-semibold p-1">Dezenas</div>
        {bets.map((bet, i) => (
          <div key={i} className="flex flex-wrap gap-0.5 p-1">
            <span className="text-[10px] font-bold text-primary mr-1">#{bet.rank}</span>
            {bet.numbers.map(n => {
              const stat = stats.find(s => s.number === n);
              const cls = stat?.status === "hot" ? "text-red-400" : stat?.status === "cold" ? "text-cyan-400" : "text-foreground";
              return <span key={n} className={`text-[10px] font-mono ${cls}`}>{String(n).padStart(2, "0")} </span>;
            })}
          </div>
        ))}
      </div>

      {/* Metrics comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-1.5 text-[10px] text-muted-foreground font-semibold">Métrica</th>
              {bets.map((bet, i) => (
                <th key={i} className="text-center p-1.5 text-[10px] text-muted-foreground font-semibold">
                  #{bet.rank} <span className={`font-bold ${
                    bet.quality.grade === "S" ? "text-yellow-400" :
                    bet.quality.grade === "A" ? "text-emerald-400" : "text-foreground"
                  }`}>[{bet.quality.grade}]</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, mi) => {
              const values = bets.map(b => metric.get(b));
              const numValues = values.map(v => typeof v === "number" ? v : 0);
              const bestVal = metric.best === "max" ? Math.max(...numValues) : null;

              return (
                <tr key={mi} className="border-b border-border/50">
                  <td className="p-1.5 text-[10px] text-muted-foreground font-medium">{metric.label}</td>
                  {values.map((val, vi) => {
                    const isBest = metric.best === "max" && typeof val === "number" && val === bestVal;
                    return (
                      <td key={vi} className={`p-1.5 text-center text-[11px] font-mono ${
                        isBest ? "text-primary font-bold" : "text-foreground"
                      }`}>
                        {typeof val === "number" ? val : val}
                        {metric.suffix || ""}
                        {isBest && " ⭐"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
