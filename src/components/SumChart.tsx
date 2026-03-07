import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_COLORS } from "@/lib/chart-theme";
import { TrendingUp } from "lucide-react";

interface Props {
  data: { concurso: number; sum: number }[];
}

export function SumChart({ data }: Props) {
  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-neon-amber" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Soma das Dezenas</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Últimos 50 concursos</p>
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
