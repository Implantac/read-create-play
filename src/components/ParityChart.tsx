import { DrawResult } from "@/data/lotteries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

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
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Distribuição Par/Ímpar</h3>
      <p className="text-xs text-muted-foreground mb-4">Últimos 50 concursos</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="concurso" tick={{ fontSize: 8, fill: "hsl(215, 12%, 50%)" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 20%, 92%)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Bar dataKey="pares" stackId="a" fill="hsl(200, 90%, 50%)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="ímpares" stackId="a" fill="hsl(142, 70%, 45%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
