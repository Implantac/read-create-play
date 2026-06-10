import { DrawResult } from "@/data/lotteries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_COLORS } from "@/lib/chart-theme";
import { useMemo } from "react";
import { Split } from "lucide-react";

interface Props {
  draws: DrawResult[];
}

export function ParityChart({ draws }: Props) {
  const data = useMemo(() => {
    return draws.slice(0, 50).map(d => ({
      concurso: `#${d.concurso}`,
      pares: d.numbers.filter(n => n % 2 === 0).length,
      ímpares: d.numbers.filter(n => n % 2 !== 0).length,
    })).reverse();
  }, [draws]);

  return (
    <div className="rounded-2xl glass-card p-6 space-y-6 group transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
            <Split className="w-5 h-5 text-neon-blue" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider italic">Distribuição Par/Ímpar</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest opacity-60">Equilíbrio Combinatorial</p>
          </div>
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
}
