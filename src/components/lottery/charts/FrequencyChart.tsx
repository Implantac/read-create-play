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
    <div className="rounded-2xl glass-card p-6 space-y-6 group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider italic">Frequência de Números</h3>
            <div className="flex items-center gap-3 mt-1 opacity-70">
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-neon-red shadow-[0_0_8px_rgba(255,0,0,0.5)]" /> Quente
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,180,255,0.5)]" /> Frio
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_rgba(0,255,100,0.5)]" /> Normal
              </span>
            </div>
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
