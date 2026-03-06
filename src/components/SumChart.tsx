import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { concurso: number; sum: number }[];
}

export function SumChart({ data }: Props) {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Soma das Dezenas</h3>
      <p className="text-xs text-muted-foreground mb-4">Últimos 50 concursos</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...data].reverse()} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="concurso" tick={{ fontSize: 9, fill: "hsl(215, 12%, 50%)" }} interval="preserveStartEnd" />
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
            <Line type="monotone" dataKey="sum" stroke="hsl(45, 95%, 55%)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
