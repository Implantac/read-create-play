import { memo, useMemo } from "react";
import { DrawResult } from "@/data/lotteries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK } from "@/lib/chart-theme";
import { Link2 } from "lucide-react";

interface Props {
  draws: DrawResult[];
}

export const ConsecutiveChart = memo(function ConsecutiveChart({ draws }: Props) {
  const data = useMemo(() => {
    const countMap: Record<number, number> = {};
    draws.forEach(d => {
      let consecutive = 0;
      const sorted = [...d.numbers].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) consecutive++;
      }
      countMap[consecutive] = (countMap[consecutive] || 0) + 1;
    });
    return Object.entries(countMap)
      .map(([pairs, count]) => ({
        pares: `${pairs} par${parseInt(pairs) !== 1 ? "es" : ""}`,
        quantidade: count,
        percentage: Math.round((count / draws.length) * 100),
      }))
      .sort((a, b) => parseInt(a.pares) - parseInt(b.pares));
  }, [draws]);

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-neon-purple" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pares Consecutivos</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Frequência de números consecutivos</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="pares" tick={CHART_AXIS_TICK} />
            <YAxis tick={CHART_AXIS_TICK} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: number, _name: string, props: any) => [
                `${value} (${props.payload.percentage}%)`,
                "Sorteios",
              ]}
            />
            <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={`hsl(265, 75%, ${45 + i * 8}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
