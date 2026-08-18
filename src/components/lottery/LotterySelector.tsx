import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 mask-fade-right">
      {LOTTERIES.map((lottery) => {
        const isActive = selected === lottery.id;
        return (
          <motion.button
            key={lottery.id}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(lottery.id)}
            className={`relative px-5 py-2.5 rounded-2xl font-black text-[10px] transition-all duration-500 border flex items-center gap-3 whitespace-nowrap shadow-xl active:scale-95 ${
              isActive
                ? "bg-primary/20 border-primary/40 text-primary ring-1 ring-primary/20 shadow-primary/10 shadow-gold-glow"
                : "bg-secondary/20 border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/40 hover:border-border/60"
            }`}
          >
            <span className="text-xl shrink-0 drop-shadow-md group-hover:scale-110 transition-transform">{lottery.icon}</span>
            <span className="uppercase tracking-[0.2em] italic">{lottery.name}</span>

            {isActive && (
              <motion.div
                layoutId="active-indicator"
                className="absolute inset-0 border-2 border-primary/30 rounded-2xl pointer-events-none"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
