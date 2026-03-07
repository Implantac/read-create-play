import { useLotteryContext } from "@/contexts/LotteryContext";
import { LOTTERIES } from "@/data/lotteries";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function LotteryContextBanner() {
  const { config, draws, loading } = useLotteryContext();

  return (
    <motion.div
      key={config.id}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20 mb-4"
    >
      <span className="text-2xl">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{config.name}</p>
        <p className="text-[11px] text-muted-foreground">
          {config.pick} números de {config.numbers} • {!loading && draws.length > 0 ? `${draws.length} sorteios carregados` : "Sem dados"}
        </p>
      </div>
      <Badge variant="outline" className="text-[10px] border-primary/30 text-primary shrink-0">
        {config.pick}/{config.numbers}
      </Badge>
    </motion.div>
  );
}
