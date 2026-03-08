import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Copy, Check, Star, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  config: LotteryConfig;
  stats: NumberStats[];
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

export function AIPredictionPanel({ config, stats, onSaveBet }: Props) {
  const [bets, setBets] = useState<number[][]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(3);

  const generate = async () => {
    setLoading(true);
    setBets([]);
    setAnalysis("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-lottery-predict", {
        body: { lottery_id: config.id, count },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro na predição");

      setBets(data.bets || []);
      setAnalysis(data.analysis || "");
      setSaved(new Set());
      toast.success(`${data.count} apostas geradas pela IA!`);
    } catch (e: any) {
      console.error("AI prediction error:", e);
      const msg = e?.message || "Erro ao gerar predições";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyBet = (bet: number[], index: number) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(index);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = (bet: number[], index: number) => {
    onSaveBet?.(bet, "IA Avançada (Gemini)");
    setSaved(prev => new Set([...prev, index]));
  };

  const copyAll = () => {
    const text = bets.map((b, i) => `#${i + 1}: ${b.join(" - ")}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todas as apostas copiadas!");
  };

  return (
    <div className="rounded-xl glass-card p-5 border border-primary/20 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                IA Avançada
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Gemini AI
                </span>
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Análise profunda dos últimos 100 sorteios com inteligência artificial
              </p>
            </div>
          </div>
          {bets.length > 0 && (
            <Button size="sm" variant="outline" onClick={copyAll} className="text-xs border-border/50">
              <Copy className="w-3 h-3 mr-1" /> Copiar todas
            </Button>
          )}
        </div>

        {/* Count selector + Generate */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            {[1, 3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                  count === n
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <Button
            onClick={generate}
            disabled={loading}
            size="sm"
            className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Gerar com IA
              </>
            )}
          </Button>
        </div>

        {/* Analysis text */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-muted/30 border border-border/30"
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              <Brain className="w-3 h-3 inline mr-1 text-primary" />
              {analysis}
            </p>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <Brain className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xs text-muted-foreground animate-pulse">
              A IA está analisando padrões de 100 sorteios...
            </p>
          </div>
        )}

        {/* Bets list */}
        <AnimatePresence mode="wait">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {bets.map((bet, i) => (
              <motion.div
                key={`ai-${i}-${bet.join(",")}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-primary/10 hover:border-primary/30 transition-colors group"
              >
                <span className="text-xs text-primary font-mono w-6 font-semibold">#{i + 1}</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {bet.map(n => {
                    const stat = stats.find(s => s.number === n);
                    const ballClass =
                      stat?.status === "hot"
                        ? "lottery-ball-hot"
                        : stat?.status === "cold"
                        ? "lottery-ball-cold"
                        : "";
                    return (
                      <span key={n} className={`lottery-ball text-xs w-8 h-8 ${ballClass}`}>
                        {String(n).padStart(2, "0")}
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1">
                  {onSaveBet && (
                    <button
                      onClick={() => handleSave(bet, i)}
                      className={`transition-colors p-1 rounded-md ${
                        saved.has(i)
                          ? "text-yellow-400"
                          : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/5 opacity-0 group-hover:opacity-100"
                      }`}
                      disabled={saved.has(i)}
                    >
                      <Star className={`w-4 h-4 ${saved.has(i) ? "fill-yellow-400" : ""}`} />
                    </button>
                  )}
                  <button
                    onClick={() => copyBet(bet, i)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/5"
                  >
                    {copied === i ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {!loading && bets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-primary/20 rounded-lg">
            <Brain className="w-6 h-6 mx-auto mb-2 text-primary/40" />
            Clique em "Gerar com IA" para obter palpites inteligentes
          </div>
        )}
      </div>
    </div>
  );
}
