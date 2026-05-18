import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK, CHART_COLORS } from "@/lib/chart-theme";
import { useMemo } from "react";
import { Layers } from "lucide-react";

interface Props {
  draws: DrawResult[];
  config: LotteryConfig;
}

export function RangeDistribution({ draws, config }: Props) {
  const data = useMemo(() => {
    const rangeSize = Math.ceil(config.numbers / 5);
    const ranges = Array.from({ length: 5 }, (_, i) => ({
      label: `${i * rangeSize + 1}-${Math.min((i + 1) * rangeSize, config.numbers)}`,
      min: i * rangeSize + 1,
      max: Math.min((i + 1) * rangeSize, config.numbers),
      count: 0,
    }));
    draws.forEach(d => {
      d.numbers.forEach(n => {
        const range = ranges.find(r => n >= r.min && n <= r.max);
        if (range) range.count++;
      });
    });
    const total = draws.length * draws[0]?.numbers.length || 1;
    return ranges.map(r => ({
      faixa: r.label,
      frequência: r.count,
      percentual: Math.round((r.count / total) * 100),
    }));
  }, [draws, config]);

  const colors = [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.purple, CHART_COLORS.red];

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Layers className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Distribuição por Faixa</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Frequência por intervalo numérico</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="faixa" tick={CHART_AXIS_TICK} />
            <YAxis tick={CHART_AXIS_TICK} />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: number, _name: string, props: any) => [
                `${value} (${props.payload.percentual}%)`,
                "Aparições",
              ]}
            />
            <Bar dataKey="frequência" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
