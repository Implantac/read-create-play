import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  const selectedLottery = LOTTERIES.find(l => l.id === selected);

  return (
    <div className="flex items-center gap-2">
      {/* Active lottery highlight */}
      {selectedLottery && (
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 mr-1">
          <span className="text-base">{selectedLottery.icon}</span>
          <span className="text-xs font-bold text-primary">{selectedLottery.name}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {LOTTERIES.map((lottery) => (
          <motion.button
            key={lottery.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(lottery.id)}
            className={`px-2.5 py-1.5 rounded-lg font-medium text-xs transition-all border flex items-center gap-1 ${
              selected === lottery.id
                ? "bg-primary/15 border-primary/40 text-primary glow-green shadow-sm ring-1 ring-primary/20"
                : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-secondary/60"
            }`}
          >
            <span>{lottery.icon}</span>
            <span className="hidden lg:inline">{lottery.name}</span>
            <span className="lg:hidden">{lottery.name.split(' ')[0]}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
