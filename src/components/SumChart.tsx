import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_COLORS } from "@/lib/chart-theme";
import { TrendingUp } from "lucide-react";

interface Props {
  data: { concurso: number; sum: number }[];
}

export function SumChart({ data }: Props) {
  return (
    <div className="rounded-2xl glass-card p-6 space-y-6 group transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
            <TrendingUp className="w-5 h-5 text-neon-amber" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider italic">Soma das Dezenas</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest opacity-60">Histórico de Variação</p>
          </div>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...data].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="concurso" tick={CHART_AXIS_TICK} interval="preserveStartEnd" />
            <YAxis tick={CHART_AXIS_TICK} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="sum" stroke={CHART_COLORS.amber} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
