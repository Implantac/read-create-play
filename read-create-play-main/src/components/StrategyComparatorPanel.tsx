import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { Strategy, STRATEGIES } from "@/engine/strategies";
import { compareStrategies, StrategyComparison } from "@/engine/robustness-score";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { GitCompareArrows, Trophy, BarChart3, Loader2, FileDown } from "lucide-react";
import { CHART_TOOLTIP_STYLE } from "@/lib/chart-theme";
import { exportToPdf } from "@/engine/pdf-export";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const RADAR_COLORS = [
  "hsl(145, 72%, 42%)", // green
  "hsl(195, 95%, 48%)", // blue
  "hsl(48, 100%, 52%)", // amber
  "hsl(265, 75%, 58%)", // purple
  "hsl(0, 72%, 55%)",   // red
  "hsl(180, 85%, 48%)", // cyan
];

export function StrategyComparatorPanel({ stats, config, draws }: Props) {
  const [selected, setSelected] = useState<Strategy[]>(["smart", "balanced", "ml"]);
  const [results, setResults] = useState<StrategyComparison[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = (id: Strategy) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const run = () => {
    setLoading(true);
    setTimeout(() => {
      const res = compareStrategies(selected, stats, config, draws, 12);
      setResults(res);
      setLoading(false);
    }, 50);
  };

  // Build radar data
  const radarData = useMemo(() => {
    if (!results) return [];
    const axes = results[0]?.avgAxes ?? [];
    return axes.map((ax, i) => {
      const point: Record<string, string | number> = { axis: ax.axis };
      results.forEach(r => {
        point[r.label] = r.avgAxes[i]?.value ?? 0;
      });
      return point;
    });
  }, [results]);

  const winner = results ? results.reduce((best, r) => r.avgScore > best.avgScore ? r : best, results[0]) : null;

  const handleExportPdf = () => {
    if (!results || !winner) return;
    const bets = winner.sampleBets.map(b => ({
      numbers: b.bet,
      strategy: winner.label,
      score: winner.avgScore,
      grade: b.grade,
    }));
    exportToPdf({
      title: "Comparativo de Estratégias",
      subtitle: `Melhor: ${winner.label} — Score ${winner.avgScore} | ${results.length} estratégias comparadas`,
      config,
      bets,
      type: "apostas",
    });
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          Comparativo de Estratégias
          <Badge variant="outline" className="ml-auto text-xs">Nível 4</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Strategy selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {STRATEGIES.map(s => (
            <label
              key={s.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ${
                selected.includes(s.id)
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Checkbox
                checked={selected.includes(s.id)}
                onCheckedChange={() => toggle(s.id)}
                className="h-3.5 w-3.5"
              />
              <span className="truncate">{s.label}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                {s.category === "ai" ? "IA" : s.category === "math" ? "Mat" : "Bas"}
              </Badge>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={run} disabled={loading || selected.length < 2} className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
            Comparar {selected.length} Estratégias
          </Button>
          {results && (
            <Button onClick={handleExportPdf} variant="outline" size="icon" title="Exportar PDF">
              <FileDown className="h-4 w-4" />
            </Button>
          )}
        </div>

        {results && (
          <div className="space-y-6">
            {/* Radar chart */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="hsl(225, 16%, 18%)" />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fontSize: 11, fill: "hsl(215, 12%, 48%)" }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 9, fill: "hsl(215, 12%, 38%)" }}
                  />
                  {results.map((r, i) => (
                    <Radar
                      key={r.strategy}
                      name={r.label}
                      dataKey={r.label}
                      stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "hsl(210, 20%, 75%)" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Rankings table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Estratégia</th>
                    <th className="text-center py-2 px-2">Score</th>
                    <th className="text-center py-2 px-2">Consistência</th>
                    <th className="text-center py-2 px-2">Hit Rate</th>
                    <th className="text-center py-2 px-2">Categoria</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={r.strategy}
                      className={`border-b border-border/20 ${
                        r.strategy === winner?.strategy ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="py-2.5 px-2">
                        {i === 0 ? (
                          <Trophy className="h-4 w-4 text-accent" />
                        ) : (
                          <span className="text-muted-foreground">{i + 1}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 font-medium text-foreground">{r.label}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`font-mono font-bold ${
                          r.avgScore >= 70 ? "text-primary" : r.avgScore >= 50 ? "text-accent" : "text-destructive"
                        }`}>
                          {r.avgScore}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/70"
                              style={{ width: `${r.consistency}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{r.consistency}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-xs text-muted-foreground">
                        {r.backtestHitRate}%
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <Badge variant="secondary" className="text-[10px]">
                          {r.category === "ai" ? "IA" : r.category === "math" ? "Matemático" : "Básico"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sample bets from winner */}
            {winner && (
              <div className="bg-muted/20 rounded-lg p-4 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2">
                  <Trophy className="inline h-3.5 w-3.5 text-accent mr-1" />
                  Melhor estratégia: <span className="text-primary font-semibold">{winner.label}</span> — Score médio {winner.avgScore}
                </p>
                <div className="flex flex-wrap gap-2">
                  {winner.sampleBets.map((b, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted/40 rounded-md px-2 py-1">
                      <Badge variant="outline" className="text-[10px] mr-1">{b.grade}</Badge>
                      {b.bet.map(n => (
                        <span key={n} className="text-xs font-mono text-foreground bg-muted/60 rounded px-1.5 py-0.5">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
