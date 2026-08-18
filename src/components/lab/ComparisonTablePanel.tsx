import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RankingEntry } from "@/engine/strategy-evolution";

export function ComparisonTablePanel({ rankings, pick }: { rankings: RankingEntry[]; pick: number }) {
  const [sortBy, setSortBy] = useState<string>("globalScore");
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const sortedRankings = useMemo(() => {
    return [...rankings].sort((a, b) => {
      const am = a.metrics;
      const bm = b.metrics;
      switch (sortBy) {
        case "avgHits": return bm.avgHits - am.avgHits;
        case "consistency": return bm.consistency - am.consistency;
        case "diversity": return bm.diversityScore - am.diversityScore;
        case "coverage": return bm.coverageScore - am.coverageScore;
        case "prizes": return bm.totalPrizes - am.totalPrizes;
        default: return bm.globalScore - am.globalScore;
      }
    });
  }, [rankings, sortBy]);

  const compareList = useMemo(() => {
    if (compareIds.size < 2) return [];
    return rankings.filter(r => compareIds.has(r.strategyId));
  }, [rankings, compareIds]);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else if (n.size < 4) { n.add(id); }
      return n;
    });
  };

  const metrics = [
    { key: "globalScore", label: "Score", format: (v: number) => v.toFixed(1), max: 100 },
    { key: "avgHits", label: "Média Acertos", format: (v: number) => v.toFixed(2), max: pick },
    { key: "consistency", label: "Consistência", format: (v: number) => `${(v * 100).toFixed(0)}%`, max: 1 },
    { key: "diversityScore", label: "Diversidade", format: (v: number) => `${v.toFixed(0)}%`, max: 100 },
    { key: "coverageScore", label: "Cobertura", format: (v: number) => `${v.toFixed(0)}%`, max: 100 },
    { key: "lift", label: "Lift", format: (v: number) => `${v.toFixed(2)}x`, max: 2 },
    { key: "totalPrizes", label: "Prêmios", format: (v: number) => v.toString(), max: Math.max(1, ...rankings.map(r => r.metrics.totalPrizes)) },

    { key: "redundancyIndex", label: "Redundância", format: (v: number) => `${(v * 100).toFixed(0)}%`, max: 1 },
  ];

  return (
    <div className="space-y-4">
      {/* Sort controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-medium">Ordenar por:</span>
          {[
            { key: "globalScore", label: "Score" },
            { key: "avgHits", label: "Média" },
            { key: "consistency", label: "Consist." },
            { key: "coverage", label: "Cobert." },
            { key: "prizes", label: "Prêmios" },
          ].map(opt => (
            <Badge
              key={opt.key}
              variant={sortBy === opt.key ? "default" : "outline"}
              className="text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setSortBy(opt.key)}
            >
              {opt.label}
            </Badge>
          ))}
        </div>
        {compareIds.size > 0 && (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Eye className="w-3 h-3" />
            {compareIds.size} selecionadas para comparar
          </Badge>
        )}
      </div>

      {/* Main Table */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/5">
                  <th className="py-3 px-3 text-left text-muted-foreground font-medium w-8">⚡</th>
                  <th className="py-3 px-2 text-left text-muted-foreground font-medium">#</th>
                  <th className="py-3 px-2 text-left text-muted-foreground font-medium">Estratégia</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium">Score</th>
                  <th className="py-3 px-2 text-muted-foreground font-medium hidden sm:table-cell min-w-[120px]">Visual</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium">Média</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium hidden sm:table-cell">Melhor</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium hidden sm:table-cell">Consist.</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium hidden md:table-cell">Divers.</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium hidden md:table-cell">Cobert.</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium">Lift</th>
                  <th className="py-3 px-2 text-center text-muted-foreground font-medium">Prêmios</th>

                </tr>
              </thead>
              <tbody>
                {sortedRankings.map((r, idx) => {
                  const isComparing = compareIds.has(r.strategyId);
                  const scoreColor = r.metrics.globalScore >= 70 ? "text-green-500" :
                    r.metrics.globalScore >= 40 ? "text-amber-500" : "text-destructive";
                  const barColor = r.metrics.globalScore >= 70 ? "bg-green-500" :
                    r.metrics.globalScore >= 40 ? "bg-amber-500" : "bg-destructive";
                  return (
                    <tr key={r.strategyId} className={`border-b border-border/50 transition-colors hover:bg-muted/5 ${
                      isComparing ? "bg-primary/[0.05] ring-1 ring-inset ring-primary/20" :
                      idx === 0 ? "bg-primary/[0.02]" : ""
                    }`}>
                      <td className="py-2.5 px-3">
                        <Checkbox
                          checked={isComparing}
                          onCheckedChange={() => toggleCompare(r.strategyId)}
                          className="w-3.5 h-3.5"
                        />
                      </td>
                      <td className="py-2.5 px-2 font-bold text-muted-foreground">
                        {r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{r.strategyName}</span>
                          {r.metrics.consistency > 0.7 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" title="Alta consistência" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`font-mono font-black text-sm ${scoreColor}`}>
                          {r.metrics.globalScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, r.metrics.globalScore)}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.05 }}
                              className={`h-full rounded-full ${barColor}`}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-foreground">{r.metrics.avgHits.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-foreground hidden sm:table-cell">{r.metrics.bestHits}/{pick}</td>
                      <td className="py-2.5 px-2 text-center font-mono text-foreground hidden sm:table-cell">{(r.metrics.consistency * 100).toFixed(0)}%</td>
                      <td className="py-2.5 px-2 text-center font-mono text-foreground hidden md:table-cell">{r.metrics.diversityScore.toFixed(0)}%</td>
                      <td className="py-2.5 px-2 text-center font-mono text-foreground hidden md:table-cell">{r.metrics.coverageScore.toFixed(0)}%</td>
                      <td className="py-2.5 px-2 text-center font-mono text-foreground">
                        {r.metrics.lift.toFixed(2)}x
                        {r.metrics.confidenceInterval && (
                          <div className="text-[8px] opacity-50">
                            [{r.metrics.confidenceInterval[0].toFixed(2)}-{r.metrics.confidenceInterval[1].toFixed(2)}]
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">

                        <span className={`font-mono font-bold ${r.metrics.totalPrizes > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {r.metrics.totalPrizes}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side Comparison */}
      <AnimatePresence>
        {compareList.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Eye className="w-4 h-4 text-primary" />
                    Comparação Lado a Lado
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2" onClick={() => setCompareIds(new Set())}>
                    Limpar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.map(metric => {
                  const values = compareList.map(r => {
                    const v = (r.metrics as unknown as Record<string, number>)[metric.key];
                    return { name: r.strategyName, value: v, pct: (v / metric.max) * 100 };
                  });
                  const maxVal = Math.max(...values.map(v => v.value));
                  return (
                    <div key={metric.key} className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground font-medium">{metric.label}</span>
                      <div className="space-y-1">
                        {values.map((v, i) => {
                          const isMax = v.value === maxVal;
                          return (
                            <div key={i} className="flex items-center gap-2">
                              <span className={`text-[10px] w-24 truncate shrink-0 ${isMax ? "text-primary font-bold" : "text-muted-foreground"}`}>
                                {v.name}
                              </span>
                              <div className="flex-1 h-2 rounded-full bg-muted/20 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, v.pct)}%` }}
                                  transition={{ duration: 0.5 }}
                                  className={`h-full rounded-full ${isMax ? "bg-primary" : "bg-muted-foreground/40"}`}
                                />
                              </div>
                              <span className={`text-[10px] font-mono w-12 text-right shrink-0 ${isMax ? "text-primary font-black" : "text-foreground font-medium"}`}>
                                {metric.format(v.value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Winner summary */}
                {compareList.length >= 2 && (() => {
                  const scores = compareList.map(r => ({ name: r.strategyName, score: r.metrics.globalScore }));
                  const winner = scores.reduce((a, b) => a.score > b.score ? a : b);
                  const diff = winner.score - Math.min(...scores.map(s => s.score));
                  return (
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 mt-2">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-primary" />
                        <span className="text-xs text-foreground">
                          <span className="font-bold text-primary">{winner.name}</span> lidera com{" "}
                          <span className="font-mono font-bold">{diff.toFixed(1)} pts</span> de vantagem
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
