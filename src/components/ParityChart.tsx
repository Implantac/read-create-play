import { memo, useMemo } from "react";
import { DrawResult } from "@/data/lotteries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_COLORS } from "@/lib/chart-theme";
import { Split } from "lucide-react";

interface Props {
  draws: DrawResult[];
}

export const ParityChart = memo(function ParityChart({ draws }: Props) {
  const data = useMemo(() => {
    return draws.slice(0, 50).map(d => ({
      concurso: `#${d.concurso}`,
      pares: d.numbers.filter(n => n % 2 === 0).length,
      ímpares: d.numbers.filter(n => n % 2 !== 0).length,
    })).reverse();
  }, [draws]);

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
          <Split className="w-4 h-4 text-neon-blue" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Distribuição Par/Ímpar</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Últimos 50 concursos</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="concurso" tick={{ ...CHART_AXIS_TICK, fontSize: 8 }} interval="preserveStartEnd" />
            <YAxis tick={CHART_AXIS_TICK} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "'Space Grotesk', sans-serif" }} />
            <Bar dataKey="pares" stackId="a" fill={CHART_COLORS.blue} radius={[0, 0, 0, 0]} />
            <Bar dataKey="ímpares" stackId="a" fill={CHART_COLORS.green} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
