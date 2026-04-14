import { useMemo } from "react";
import { useSavedBets } from "@/hooks/useSavedBets";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, Zap, Star } from "lucide-react";

interface PerformanceMetrics {
  totalBets: number;
  avgScore: number;
  bestScore: number;
  topStrategy: string | null;
  strategyCounts: Record<string, number>;
  gradeDistribution: Record<string, number>;
  recentTrend: "up" | "down" | "stable";
}

export function PersonalPerformanceCard() {
  const { selectedLottery, draws, config } = useLotteryContext();
  const { savedBets } = useSavedBets(selectedLottery);

  const metrics = useMemo<PerformanceMetrics>(() => {
    if (!savedBets.length) {
      return {
        totalBets: 0,
        avgScore: 0,
        bestScore: 0,
        topStrategy: null,
        strategyCounts: {},
        gradeDistribution: {},
        recentTrend: "stable",
      };
    }

    const scores = savedBets
      .map((b) => b.score ?? 0)
      .filter((s) => s > 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const bestScore = scores.length ? Math.max(...scores) : 0;

    const strategyCounts: Record<string, number> = {};
    for (const bet of savedBets) {
      const s = bet.strategy || "Manual";
      strategyCounts[s] = (strategyCounts[s] || 0) + 1;
    }
    const topStrategy = Object.entries(strategyCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] ?? null;

    const gradeDistribution: Record<string, number> = {};
    for (const bet of savedBets) {
      const g = bet.grade || "—";
      gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
    }

    // Check recent trend: compare last 5 vs previous 5 avg scores
    const sorted = [...savedBets].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const recent5 = sorted.slice(0, 5).map((b) => b.score ?? 0);
    const prev5 = sorted.slice(5, 10).map((b) => b.score ?? 0);
    const recentAvg = recent5.length
      ? recent5.reduce((a, b) => a + b, 0) / recent5.length
      : 0;
    const prevAvg = prev5.length
      ? prev5.reduce((a, b) => a + b, 0) / prev5.length
      : 0;
    const recentTrend: "up" | "down" | "stable" =
      prev5.length === 0
        ? "stable"
        : recentAvg > prevAvg + 3
        ? "up"
        : recentAvg < prevAvg - 3
        ? "down"
        : "stable";

    return {
      totalBets: savedBets.length,
      avgScore,
      bestScore,
      topStrategy,
      strategyCounts,
      gradeDistribution,
      recentTrend,
    };
  }, [savedBets]);

  // Check hits against latest draw
  const hitsAnalysis = useMemo(() => {
    if (!draws.length || !savedBets.length) return null;
    const latest = draws[0];
    if (!latest?.numbers) return null;
    const drawSet = new Set(latest.numbers);

    let totalHits = 0;
    let bestHits = 0;
    let bestBetIndex = -1;

    savedBets.forEach((bet, i) => {
      const hits = bet.numbers.filter((n) => drawSet.has(n)).length;
      totalHits += hits;
      if (hits > bestHits) {
        bestHits = hits;
        bestBetIndex = i;
      }
    });

    return {
      avgHits: (totalHits / savedBets.length).toFixed(1),
      bestHits,
      latestConcurso: latest.concurso,
    };
  }, [draws, savedBets]);

  if (!savedBets.length) return null;

  const trendIcon =
    metrics.recentTrend === "up"
      ? "📈"
      : metrics.recentTrend === "down"
      ? "📉"
      : "➡️";

  const gradeColors: Record<string, string> = {
    S: "bg-primary/20 text-primary border-primary/30",
    A: "bg-neon-blue/20 text-neon-blue border-neon-blue/30",
    B: "bg-accent/20 text-accent border-accent/30",
    C: "bg-muted/40 text-muted-foreground border-border/30",
    D: "bg-neon-red/15 text-neon-red border-neon-red/30",
    F: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="glass-card border border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-accent" />
            </div>
            Seu Desempenho — {config.name}
            <Badge variant="outline" className="ml-auto text-[10px] font-mono">
              {metrics.totalBets} jogos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key metrics row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                {metrics.avgScore}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Score médio
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                {metrics.bestScore}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Melhor score
              </div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border border-border/20">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-neon-blue" />
              </div>
              <div className="text-xl font-bold font-mono text-foreground">
                {trendIcon}
              </div>
              <div className="text-[10px] text-muted-foreground">Tendência</div>
            </div>
          </div>

          {/* Hits against latest draw */}
          {hitsAnalysis && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <div className="text-xs text-foreground">
                <span className="font-semibold">Concurso #{hitsAnalysis.latestConcurso}:</span>{" "}
                média de{" "}
                <span className="font-bold text-primary">
                  {hitsAnalysis.avgHits}
                </span>{" "}
                acertos • melhor:{" "}
                <span className="font-bold text-accent">
                  {hitsAnalysis.bestHits}/{config.pick}
                </span>
              </div>
            </div>
          )}

          {/* Strategy and grade badges */}
          <div className="space-y-2">
            {metrics.topStrategy && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Estratégia favorita:</span>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                  {metrics.topStrategy}
                </Badge>
              </div>
            )}
            {Object.keys(metrics.gradeDistribution).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground mr-1">Notas:</span>
                {Object.entries(metrics.gradeDistribution)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([grade, count]) => (
                    <span
                      key={grade}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                        gradeColors[grade] || "bg-muted/30 text-muted-foreground border-border/30"
                      }`}
                    >
                      {grade}
                      <span className="font-normal opacity-70">×{count}</span>
                    </span>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
