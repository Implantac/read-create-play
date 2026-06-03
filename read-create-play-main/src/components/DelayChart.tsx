import { NumberStats } from "@/engine/statistics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_COLORS } from "@/lib/chart-theme";
import { useMemo } from "react";
import { Clock } from "lucide-react";

interface Props {
  stats: NumberStats[];
}

export function DelayChart({ stats }: Props) {
  const data = useMemo(() => {
    return [...stats]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 25)
      .map(s => ({
        número: String(s.number).padStart(2, "0"),
        atraso: s.lastSeen,
        status: s.status,
      }));
  }, [stats]);

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-red/10 border border-neon-red/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-neon-red" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Maiores Atrasos</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Top 25 números com mais concursos sem aparecer</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="número" tick={CHART_AXIS_TICK} />
            <YAxis tick={CHART_AXIS_TICK} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: number) => [`${value} concursos`, "Atraso"]}
            />
            <Bar dataKey="atraso" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.status === "cold" ? CHART_COLORS.blue
                      : entry.status === "hot" ? CHART_COLORS.red
                      : CHART_COLORS.amber
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
