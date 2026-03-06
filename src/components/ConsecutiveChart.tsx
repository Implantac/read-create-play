import { DrawResult } from "@/data/lotteries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

interface Props {
  draws: DrawResult[];
}

export function ConsecutiveChart({ draws }: Props) {
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
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Pares Consecutivos</h3>
      <p className="text-xs text-muted-foreground mb-4">Frequência de números consecutivos nos sorteios</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="pares" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
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
                `${value} (${props.payload.percentage}%)`,
                "Sorteios",
              ]}
            />
            <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={`hsl(270, 70%, ${45 + i * 5}%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
