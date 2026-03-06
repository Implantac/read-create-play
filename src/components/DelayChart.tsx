import { NumberStats } from "@/engine/statistics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

interface Props {
  stats: NumberStats[];
}

export function DelayChart({ stats }: Props) {
  const data = useMemo(() => {
    return [...stats]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, 25)
      .map(s => ({
        número: String(s.number).padStart(2, "0"),
        atraso: s.lastSeen,
        status: s.status,
      }));
  }, [stats]);

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Maiores Atrasos</h3>
      <p className="text-xs text-muted-foreground mb-4">Top 25 números com mais concursos sem aparecer</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="número" tick={{ fontSize: 9, fill: "hsl(215, 12%, 50%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 20%, 92%)",
              }}
              formatter={(value: number) => [`${value} concursos`, "Atraso"]}
            />
            <Bar dataKey="atraso" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.status === "cold"
                      ? "hsl(200, 90%, 50%)"
                      : entry.status === "hot"
                      ? "hsl(0, 72%, 55%)"
                      : "hsl(45, 95%, 55%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
