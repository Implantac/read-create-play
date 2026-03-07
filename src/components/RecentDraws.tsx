import { DrawResult } from "@/data/lotteries";
import { motion } from "framer-motion";
import { History } from "lucide-react";

interface Props {
  draws: DrawResult[];
}

export function RecentDraws({ draws }: Props) {
  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
          <History className="w-4 h-4 text-neon-purple" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Últimos Concursos</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Resultados mais recentes</p>
        </div>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {draws.slice(0, 15).map((draw, i) => (
          <motion.div
            key={draw.concurso}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30 hover:border-border/60 transition-colors"
          >
            <div className="text-xs font-mono text-muted-foreground w-20 shrink-0">
              <div className="text-foreground font-semibold">#{draw.concurso}</div>
              <div className="text-[10px]">{draw.date}</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {draw.numbers.map(n => (
                <span key={n} className="lottery-ball text-xs w-7 h-7">
                  {String(n).padStart(2, "0")}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
