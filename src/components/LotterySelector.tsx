import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {LOTTERIES.map((lottery) => (
        <motion.button
          key={lottery.id}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect(lottery.id)}
          className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all border ${
            selected === lottery.id
              ? "bg-primary/15 border-primary/40 text-primary glow-green shadow-sm"
              : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-secondary/60"
          }`}
        >
          <span className="mr-1.5">{lottery.icon}</span>
          <span className="hidden sm:inline">{lottery.name}</span>
          <span className="sm:hidden">{lottery.name.split(' ')[0]}</span>
        </motion.button>
      ))}
    </div>
  );
}
