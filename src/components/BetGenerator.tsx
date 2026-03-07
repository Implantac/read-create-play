import { useState } from "react";
import { NumberStats, generateSmartBet } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
}

export function BetGenerator({ stats, config }: Props) {
  const [bets, setBets] = useState<number[][]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = (count: number) => {
    const newBets: number[][] = [];
    for (let i = 0; i < count; i++) {
      newBets.push(generateSmartBet(stats, config.pick));
    }
    setBets(newBets);
  };

  const copyBet = (bet: number[], index: number) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(index);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-neon-amber" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Gerador Inteligente</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Apostas baseadas em análise estatística</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[1, 3, 5, 10].map(n => (
          <Button
            key={n}
            variant="outline"
            size="sm"
            onClick={() => generate(n)}
            className="text-xs border-border/50 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            {n} aposta{n > 1 ? "s" : ""}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {bets.map((bet, i) => (
            <motion.div
              key={`${i}-${bet.join(",")}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-border/60 transition-colors"
            >
              <span className="text-xs text-muted-foreground font-mono w-6">#{i + 1}</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {bet.map(n => (
                  <span key={n} className="lottery-ball text-xs w-8 h-8">
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
              <button onClick={() => copyBet(bet, i)} className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/5">
                {copied === i ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </button>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {bets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/30 rounded-lg">
          Clique em um botão acima para gerar apostas inteligentes
        </div>
      )}
    </div>
  );
}
