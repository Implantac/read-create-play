import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { CHART_TOOLTIP_STYLE, CHART_AXIS_TICK } from "@/lib/chart-theme";

interface HitResult {
  concurso: number;
  hits: number;
  prize: string;
}

interface Props {
  results: HitResult[];
  avgHits: number;
  pick: number;
}

export function BetHitsChart({ results, avgHits, pick }: Props) {
  const data = useMemo(() => {
    return [...results]
      .reverse()
      .map((r) => ({
        concurso: `#${r.concurso}`,
        acertos: r.hits,
        premio: r.prize || null,
      }));
  }, [results]);

  if (data.length < 2) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium">
        Acertos ao longo do tempo
      </span>
      <div className="h-[120px] sm:h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="hitsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="concurso"
              tick={{ ...CHART_AXIS_TICK, fontSize: 7 }}
              interval={Math.max(0, Math.floor(data.length / 6) - 1)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
              domain={[0, Math.min(pick, Math.max(...data.map((d) => d.acertos)) + 2)]}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value: number, _name: string) => [`${value} acertos`, "Acertos"]}
              labelFormatter={(label) => `Concurso ${label}`}
            />
            <ReferenceLine
              y={avgHits}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `Média: ${avgHits.toFixed(1)}`,
                position: "right",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 8,
              }}
            />
            <Area
              type="monotone"
              dataKey="acertos"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              fill="url(#hitsGradient)"
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.premio) {
                  return (
                    <circle
                      key={`dot-${payload.concurso}`}
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="hsl(var(--accent))"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2}
                    />
                  );
                }
                return <circle key={`dot-${payload.concurso}`} cx={cx} cy={cy} r={0} />;
              }}
              activeDot={{
                r: 4,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Acertos
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent inline-block" /> Com prêmio
        </span>
        <span className="flex items-center gap-1">
          <span className="w-6 h-px border-t border-dashed border-muted-foreground inline-block" /> Média
        </span>
      </div>
    </div>
  );
}
