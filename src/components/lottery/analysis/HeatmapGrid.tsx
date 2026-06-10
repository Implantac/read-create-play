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
    <div className="rounded-2xl glass-card p-6 space-y-6 group transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
            <Grid3X3 className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider italic">Heatmap de Dezenas</h3>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest opacity-60">Matriz de Intensidade</p>
          </div>
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
