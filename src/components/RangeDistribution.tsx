import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

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

  const colors = [
    "hsl(142, 70%, 45%)",
    "hsl(200, 90%, 50%)",
    "hsl(45, 95%, 55%)",
    "hsl(270, 70%, 60%)",
    "hsl(0, 72%, 55%)",
  ];

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Distribuição por Faixa</h3>
      <p className="text-xs text-muted-foreground mb-4">Frequência de números por intervalo</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="faixa" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 20%, 92%)",
              }}
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
