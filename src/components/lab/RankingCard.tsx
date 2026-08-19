import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ShieldCheck, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RankingEntry } from "@/engine/strategy-evolution";
import { MetricPill, MiniMetric } from "./LabShared";

export function RankingCard({ entry: r, pick, isExpanded, onToggle, trendIcon }: {
  entry: RankingEntry; pick: number; isExpanded: boolean;
  onToggle: () => void; trendIcon: (t: string) => JSX.Element;
}) {
  const scorePercent = Math.min(100, r.metrics.globalScore);
  const gradeColor = r.metrics.globalScore >= 70 ? "text-green-500" :
                     r.metrics.globalScore >= 40 ? "text-amber-500" : "text-destructive";
  const performanceText = r.metrics.performanceScore !== null ? `${r.metrics.performanceScore.toFixed(0)}` : "N/A";

  return (
    <Card className={`bg-card/80 backdrop-blur border-border transition-all hover:shadow-md ${
      r.rank === 1 ? "ring-1 ring-primary/30 bg-primary/[0.03] shadow-sm shadow-primary/5" : ""
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
            r.rank === 1 ? "bg-primary/15 text-primary ring-2 ring-primary/20" :
            r.rank === 2 ? "bg-yellow-500/15 text-yellow-500" :
            r.rank === 3 ? "bg-orange-500/15 text-orange-500" :
            "bg-muted/20 text-muted-foreground"
          }`}>
            {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">{r.strategyName}</span>
              {trendIcon(r.trend)}
              {r.rank === 1 && (
                <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 font-bold">CAMPEÃ</Badge>
              )}
              {r.metrics.consistency > 0.7 && (
                <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-500 bg-green-500/5">
                  ✓ Confiável
                </Badge>
              )}
              {r.stressResult && (
                <Badge variant="outline" className={`text-[9px] gap-1 ${
                  r.stressResult.robustnessScore > 60 ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'
                }`}>
                  {r.stressResult.robustnessScore > 60 ? <ShieldCheck className="w-2.5 h-2.5" /> : <ShieldAlert className="w-2.5 h-2.5" />}
                  {r.stressResult.verdict.toUpperCase()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden max-w-[140px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scorePercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary"
                />
              </div>
              <span className={`text-xs font-mono font-black ${gradeColor}`}>{r.metrics.globalScore.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <MetricPill label="Média" value={r.metrics.avgHits.toFixed(2)} />
              <MetricPill label="Melhor" value={`${r.metrics.bestHits}/${pick}`} />
              <MetricPill label="Consist." value={`${(r.metrics.consistency * 100).toFixed(0)}%`} />
              <MetricPill label="Prêmios" value={r.metrics.totalPrizes.toString()} highlight={r.metrics.totalPrizes > 0} />
              {r.metrics.lift !== undefined && (
                <MetricPill label="Lift" value={`${r.metrics.lift.toFixed(2)}x`} highlight={r.metrics.lift > 1.05} />
              )}
              {r.metrics.performanceScore !== null && (
                <MetricPill label="Score" value={performanceText} highlight={r.metrics.performanceScore > 70} />
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 shrink-0 rounded-lg" onClick={onToggle}>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-border space-y-3 overflow-hidden"
            >
              <p className="text-xs text-muted-foreground leading-relaxed">{r.explanation}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniMetric label="Diversidade" value={`${r.metrics.diversityScore.toFixed(0)}%`} />
                <MiniMetric label="Cobertura" value={`${r.metrics.coverageScore.toFixed(0)}%`} />
                <MiniMetric label="Redundância" value={`${(r.metrics.redundancyIndex * 100).toFixed(0)}%`} />
                <MiniMetric label="Premiações" value={r.metrics.totalPrizes.toString()} />
              </div>
              <div className="text-[10px] text-muted-foreground bg-muted/10 p-3 rounded-xl border border-border/50">
                <span className="font-semibold text-foreground">Distribuição de acertos: </span>
                {Object.entries(r.metrics.hitDistribution)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .slice(0, 8)
                  .map(([hits, count]) => (
                    <span key={hits} className="inline-flex items-center gap-0.5 mr-2.5">
                      <span className="font-mono text-foreground font-medium">{hits}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono text-primary font-bold">{count}×</span>
                    </span>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
