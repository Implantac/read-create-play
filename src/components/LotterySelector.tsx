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
            className={`relative px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all border flex items-center gap-1.5 whitespace-nowrap ${
              isActive
                ? "bg-primary/15 border-primary/40 text-primary shadow-sm shadow-primary/10"
                : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
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
