import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      {LOTTERIES.map((lottery) => {
        const isActive = selected === lottery.id;
        return (
          <motion.button
            key={lottery.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(lottery.id)}
            className={`relative px-3 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all border flex items-center gap-2 whitespace-nowrap ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-white/[0.03] border-white/5 text-muted-foreground hover:text-foreground hover:border-white/20"
            }`}
          >
            <span className="text-sm">{lottery.icon}</span>
            <span className="hidden sm:inline">{lottery.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
