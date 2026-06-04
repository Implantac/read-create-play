import { NumberStats } from "@/engine/stats/statistics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_COLORS } from "@/lib/chart-theme";
import { BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  stats: NumberStats[];
  loading?: boolean;
}

export function FrequencyChart({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl glass-card p-5 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted rounded" />
          </div>
        </div>
        <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </div>
    );
  }

  const data = stats.map(s => ({
    name: String(s.number).padStart(2, "0"),
    freq: s.frequency,
    status: s.status,
  }));

  const getColor = (status: string) => {
    switch (status) {
      case "hot": return CHART_COLORS.red;
      case "cold": return CHART_COLORS.blue;
      default: return CHART_COLORS.green;
    }
  };

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Frequência de Números</h3>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-neon-red" /> Quente
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-neon-blue" /> Frio
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-neon-green" /> Normal
            </span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="name" tick={CHART_AXIS_TICK} interval="preserveStartEnd" />
            <YAxis tick={CHART_AXIS_TICK} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="freq" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={getColor(entry.status)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
