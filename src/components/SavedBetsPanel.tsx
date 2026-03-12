import { useSavedBets } from "@/hooks/useSavedBets";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Trash2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareBetButton } from "@/components/ShareBetButton";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export function SavedBetsPanel() {
  const { selectedLottery, config, stats } = useLotteryContext();
  const { savedBets, loading, deleteBet } = useSavedBets(selectedLottery);
  const [copied, setCopied] = useState<string | null>(null);

  const copyBet = (bet: number[], id: string) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(id);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const text = savedBets
      .map((b, i) => `#${i + 1}: ${b.numbers.join(" - ")}${b.strategy ? ` (${b.strategy})` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todas as apostas copiadas!");
  };

  if (loading) {
    return (
      <div className="rounded-xl glass-card p-5 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Carregando apostas salvas...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bookmark className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Apostas Salvas</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {savedBets.length} aposta{savedBets.length !== 1 ? "s" : ""} salva{savedBets.length !== 1 ? "s" : ""} para {config.name}
            </p>
          </div>
        </div>
        {savedBets.length > 0 && (
          <Button size="sm" variant="outline" onClick={copyAll} className="text-xs border-border/50">
            <Copy className="w-3 h-3 mr-1" /> Copiar todas
          </Button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {savedBets.map((bet, i) => (
            <motion.div
              key={bet.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-border/60 transition-colors group"
            >
              <div className="shrink-0 w-12">
                {bet.grade && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                    bet.grade === "S" ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
                    bet.grade === "A" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" :
                    "text-blue-400 bg-blue-400/10 border-blue-400/30"
                  }`}>
                    {bet.grade}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 flex-1">
                {bet.numbers.map(n => {
                  const stat = stats.find(s => s.number === n);
                  const ballClass =
                    stat?.status === "hot" ? "lottery-ball-hot" :
                    stat?.status === "cold" ? "lottery-ball-cold" : "";
                  return (
                    <span key={n} className={`lottery-ball text-[10px] w-7 h-7 ${ballClass}`}>
                      {String(n).padStart(2, "0")}
                    </span>
                  );
                })}
              </div>

              <div className="shrink-0 text-[10px] text-muted-foreground hidden sm:block">
                {bet.strategy && <span className="truncate max-w-[80px] block">{bet.strategy}</span>}
                {bet.score && <span className="font-mono">{bet.score}pts</span>}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => copyBet(bet.numbers, bet.id)}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/5"
                >
                  {copied === bet.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => deleteBet(bet.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/5 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {savedBets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/30 rounded-lg">
          <Bookmark className="w-6 h-6 mx-auto mb-2 opacity-30" />
          Nenhuma aposta salva para {config.name}
          <br />
          <span className="text-[10px]">Use o botão ⭐ nos geradores para salvar</span>
        </div>
      )}
    </div>
  );
}
