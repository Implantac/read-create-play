import { memo, useMemo } from "react";
import { NumberStats } from "@/engine/statistics";
import { Grid3X3 } from "lucide-react";

interface Props {
  stats: NumberStats[];
  totalNumbers: number;
}

export const HeatmapGrid = memo(function HeatmapGrid({ stats, totalNumbers }: Props) {
  const maxFreq = useMemo(() => Math.max(...stats.map(s => s.frequency)), [stats]);
  const cols = Math.min(totalNumbers, 10);

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
          <Grid3X3 className="w-4 h-4 text-neon-cyan" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Heatmap de Dezenas</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Intensidade por frequência de aparição</p>
        </div>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {stats.map((s) => {
          const intensity = maxFreq > 0 ? s.frequency / maxFreq : 0;
          return (
            <div
              key={s.number}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-mono font-bold cursor-default relative group transition-transform duration-150 hover:scale-110 hover:z-10"
              style={{
                backgroundColor: `hsl(145, 72%, ${12 + intensity * 38}%)`,
                color: intensity > 0.5 ? "hsl(225, 25%, 5%)" : "hsl(210, 20%, 80%)",
                boxShadow: intensity > 0.7 ? `0 0 12px hsl(145 72% 42% / ${intensity * 0.3})` : "none",
              }}
              title={`Nº ${s.number}: ${s.frequency}x`}
            >
              {s.number}
            </div>
          );
        })}
      </div>
    </div>
  );
});
