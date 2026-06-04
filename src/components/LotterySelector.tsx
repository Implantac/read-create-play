import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-2 px-2 mask-fade-right">
      {LOTTERIES.map((lottery) => {
        const isActive = selected === lottery.id;
        return (
          <motion.button
            key={lottery.id}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(lottery.id)}
            className={`relative px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 border flex items-center gap-2.5 whitespace-nowrap shadow-md ${
              isActive
                ? "bg-primary/20 border-primary/50 text-primary ring-2 ring-primary/10 shadow-primary/10"
                : "bg-secondary/40 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-border/60"
            }`}
          >
            <span className="text-lg shrink-0 drop-shadow-sm">{lottery.icon}</span>
            <span className="text-[11px] sm:text-xs uppercase tracking-wider">{lottery.name}</span>

            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
