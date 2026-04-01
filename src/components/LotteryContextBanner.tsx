import { useLotteryContext } from "@/contexts/LotteryContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

export function LotteryContextBanner() {
  const { config, draws, loading, count, loadedCount } = useLotteryContext();

  const isBackgroundLoading = !loading && count > 0 && loadedCount < count;
  const progress = count > 0 ? Math.round((loadedCount / count) * 100) : 0;

  return (
    <motion.div
      key={config.id}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-primary/[0.04] border border-primary/15"
    >
      <div className="flex items-center gap-3">
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
            {loading
              ? "Carregando..."
              : draws.length > 0
                ? `${draws.length.toLocaleString()} sorteios carregados`
                : "Nenhum sorteio importado ainda"}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isBackgroundLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1"
          >
            <Progress value={progress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground text-right">
              {loadedCount.toLocaleString()} / {count.toLocaleString()} ({progress}%)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
