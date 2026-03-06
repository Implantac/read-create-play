import { LOTTERIES, LotteryConfig } from "@/data/lotteries";
import { motion } from "framer-motion";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {LOTTERIES.map((lottery) => (
        <motion.button
          key={lottery.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(lottery.id)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border ${
            selected === lottery.id
              ? "bg-primary/20 border-primary text-primary glow-green"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
          }`}
        >
          <span className="mr-1.5">{lottery.icon}</span>
          {lottery.name}
        </motion.button>
      ))}
    </div>
  );
}
