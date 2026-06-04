import { NumberStats } from "@/engine/stats/statistics";
import { motion } from "framer-motion";
import { Grid3X3 } from "lucide-react";

interface Props {
  stats: NumberStats[];
  totalNumbers: number;
}

export function HeatmapGrid({ stats, totalNumbers }: Props) {
  const maxFreq = Math.max(...stats.map(s => s.frequency));

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
      <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(totalNumbers, 10)}, 1fr)` }}>
        {stats.map((s, i) => {
          const intensity = maxFreq > 0 ? s.frequency / maxFreq : 0;
          return (
            <motion.div
              key={s.number}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.008 }}
              className="aspect-square rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-mono font-bold cursor-default relative group transition-all hover:scale-110 hover:z-10 hover:shadow-lg active:scale-95"
              style={{
                backgroundColor: `hsl(145, 72%, ${12 + intensity * 38}%)`,
                color: intensity > 0.5 ? "hsl(225, 25%, 5%)" : "hsl(210, 20%, 80%)",
                boxShadow: intensity > 0.7 ? `0 0 12px hsl(145 72% 42% / ${intensity * 0.3})` : "none",
              }}
              title={`Nº ${s.number}: ${s.frequency}x`}
            >
              <span className="relative z-10">{s.number}</span>

            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
