import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 mask-fade-right max-w-full lg:max-w-3xl">
      {LOTTERIES.map((lottery) => {
        const isActive = selected === lottery.id;
        return (
          <motion.button
            key={lottery.id}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(lottery.id)}
            className={`relative px-3 py-1.5 rounded-xl font-bold text-[9px] transition-all duration-300 border flex items-center gap-2 whitespace-nowrap shadow-md active:scale-95 ${
              isActive
                ? "bg-primary/20 border-primary/40 text-primary ring-1 ring-primary/20 shadow-primary/10"
                : "bg-secondary/10 border-border/20 text-muted-foreground hover:text-foreground hover:bg-secondary/30 hover:border-border/40"
            }`}
          >
            <span className="text-base shrink-0 drop-shadow-sm transition-transform group-hover:scale-110">{lottery.icon}</span>
            <span className="uppercase tracking-[0.1em]">{lottery.name}</span>

            {isActive && (
              <motion.div
                layoutId="active-indicator"
                className="absolute inset-0 border-2 border-primary/20 rounded-xl pointer-events-none"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
