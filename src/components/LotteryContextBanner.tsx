import { useLotteryContext } from "@/contexts/LotteryContext";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function LotteryContextBanner() {
  const { config, draws, loading } = useLotteryContext();

  return (
    <motion.div
      key={config.id}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/[0.04] border border-primary/15"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <span className="text-xl">{config.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">{config.name}</p>
          <Badge variant="outline" className="text-[9px] border-primary/20 text-primary px-1.5 py-0">
            {config.pick} de {config.numbers}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {loading ? "Carregando..." : draws.length > 0 ? `${draws.length.toLocaleString()} sorteios carregados` : "Nenhum sorteio importado ainda"}
        </p>
      </div>
    </motion.div>
  );
}
