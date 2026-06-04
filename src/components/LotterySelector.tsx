import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide -mx-2 px-2 mask-fade-right">
      {LOTTERIES.map((lottery) => {
        const isActive = selected === lottery.id;
        return (
          <motion.button
            key={lottery.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(lottery.id)}
            className={`relative px-3 py-1.5 rounded-lg font-medium text-xs transition-all border flex items-center gap-2 whitespace-nowrap shadow-sm ${
              isActive
                ? "bg-primary/20 border-primary/50 text-primary ring-1 ring-primary/20"
                : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <span className="text-sm shrink-0">{lottery.icon}</span>
            <span className="text-[11px] sm:text-xs">{lottery.name}</span>
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
