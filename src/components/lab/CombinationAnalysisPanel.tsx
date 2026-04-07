import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Crosshair, BarChart3, TrendingUp, TrendingDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { CombinationAnalysis } from "@/engine/strategy-evolution/game-quality";
import { NumberBall } from "./LabShared";

export function CombinationAnalysisPanel({ analysis, maxNum }: { analysis: CombinationAnalysis | null; maxNum: number }) {
  const heatmapData = useMemo(() => {
    if (!analysis) return [];
    const data: { num: number; count: number; pct: number }[] = [];
    const maxCount = Math.max(...analysis.numberFrequency.values(), 1);
    for (let n = 1; n <= maxNum; n++) {
      const count = analysis.numberFrequency.get(n) || 0;
      data.push({ num: n, count, pct: (count / maxCount) * 100 });
    }
    return data;
  }, [analysis, maxNum]);

  const barChartData = useMemo(() => {
    if (!analysis) return [];
    return [...analysis.numberFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([num, count]) => ({ num: num.toString().padStart(2, "0"), count }));
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
          <Crosshair className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Execute o laboratório para ver a análise combinatória.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-primary font-mono">{analysis.coveragePercent.toFixed(0)}%</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Cobertura Numérica</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{analysis.avgOverlap.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Sobreposição Média</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{analysis.numberFrequency.size}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Números Únicos</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-black text-foreground font-mono">{analysis.pairFrequency.size}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Pares Únicos</div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-primary" />
            Mapa de Calor — Frequência dos Números nos Jogos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {heatmapData.map(d => {
              const intensity = d.pct;
              const bg = intensity === 0
                ? "bg-muted/20 text-muted-foreground/40"
                : intensity >= 80
                  ? "bg-primary/80 text-primary-foreground"
                  : intensity >= 60
                    ? "bg-primary/50 text-primary-foreground"
                    : intensity >= 40
                      ? "bg-primary/30 text-foreground"
                      : intensity >= 20
                        ? "bg-primary/15 text-foreground"
                        : "bg-primary/5 text-muted-foreground";
              return (
                <div
                  key={d.num}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${bg}`}
                  title={`${d.num}: ${d.count} aparições`}
                >
                  {d.num.toString().padStart(2, "0")}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-[9px] text-muted-foreground">
            <span>Frio</span>
            <div className="flex gap-0.5">
              <div className="w-5 h-2.5 rounded bg-primary/5" />
              <div className="w-5 h-2.5 rounded bg-primary/15" />
              <div className="w-5 h-2.5 rounded bg-primary/30" />
              <div className="w-5 h-2.5 rounded bg-primary/50" />
              <div className="w-5 h-2.5 rounded bg-primary/80" />
            </div>
            <span>Quente</span>
          </div>
        </CardContent>
      </Card>

      {/* Top 20 bar chart */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Top 20 — Números Mais Utilizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barChartData}>
              <XAxis dataKey="num" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
              <RechartsTooltip
                content={({ payload }) => {
                  if (!payload || payload.length === 0) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2 text-xs shadow-lg">
                      <p className="font-semibold text-foreground">Número {d.num}</p>
                      <p className="text-muted-foreground">{d.count} aparições</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barChartData.map((_, i) => (
                  <Cell key={i} fill={i < 5 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} fillOpacity={i < 5 ? 0.8 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hot / Cold numbers */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-primary">
              <TrendingUp className="w-3.5 h-3.5" />
              Números Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {analysis.hotNumbers.map(n => (
                <NumberBall key={n} num={n} maxNum={maxNum} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-blue-500">
              <TrendingDown className="w-3.5 h-3.5" />
              Números Menos Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {analysis.coldNumbers.map(n => (
                <NumberBall key={n} num={n} maxNum={maxNum} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
