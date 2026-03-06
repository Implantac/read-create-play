import { NumberStats } from "@/engine/statistics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  stats: NumberStats[];
}

export function FrequencyChart({ stats }: Props) {
  const data = stats.map(s => ({
    name: String(s.number).padStart(2, "0"),
    freq: s.frequency,
    status: s.status,
  }));

  const getColor = (status: string) => {
    switch (status) {
      case "hot": return "hsl(0, 72%, 55%)";
      case "cold": return "hsl(200, 90%, 50%)";
      default: return "hsl(142, 70%, 45%)";
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Frequência de Números</h3>
      <p className="text-xs text-muted-foreground mb-4">
        <span className="inline-block w-2 h-2 rounded-full bg-neon-red mr-1" /> Quente
        <span className="inline-block w-2 h-2 rounded-full bg-neon-blue ml-3 mr-1" /> Frio
        <span className="inline-block w-2 h-2 rounded-full bg-neon-green ml-3 mr-1" /> Normal
      </p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(215, 12%, 50%)" }} interval="preserveStartEnd" />
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
            <Bar dataKey="freq" radius={[2, 2, 0, 0]}>
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
