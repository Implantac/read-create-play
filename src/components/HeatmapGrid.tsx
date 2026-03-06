import { NumberStats } from "@/engine/statistics";
import { motion } from "framer-motion";

interface Props {
  stats: NumberStats[];
  totalNumbers: number;
}

export function HeatmapGrid({ stats, totalNumbers }: Props) {
  const maxFreq = Math.max(...stats.map(s => s.frequency));

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">Heatmap de Dezenas</h3>
      <p className="text-xs text-muted-foreground mb-4">Intensidade por frequência de aparição</p>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(totalNumbers, 10)}, 1fr)` }}>
        {stats.map((s, i) => {
          const intensity = maxFreq > 0 ? s.frequency / maxFreq : 0;
          return (
            <motion.div
              key={s.number}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.008 }}
              className="aspect-square rounded-md flex items-center justify-center text-xs font-mono font-bold cursor-default relative group"
              style={{
                backgroundColor: `hsl(142, 70%, ${15 + intensity * 35}%)`,
                color: intensity > 0.5 ? "hsl(220, 20%, 6%)" : "hsl(210, 20%, 80%)",
              }}
              title={`Nº ${s.number}: ${s.frequency}x`}
            >
              {s.number}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
