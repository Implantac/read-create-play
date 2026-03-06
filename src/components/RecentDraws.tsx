import { DrawResult } from "@/data/lotteries";
import { motion } from "framer-motion";
import { History } from "lucide-react";

interface Props {
  draws: DrawResult[];
}

export function RecentDraws({ draws }: Props) {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-neon-purple" />
        Últimos Concursos
      </h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {draws.slice(0, 15).map((draw, i) => (
          <motion.div
            key={draw.concurso}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/50"
          >
            <div className="text-xs font-mono text-muted-foreground w-20">
              <div className="text-foreground font-semibold">#{draw.concurso}</div>
              <div>{draw.date}</div>
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
