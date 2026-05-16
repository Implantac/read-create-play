import { useState } from "react";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Copy, Check, Star, Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { GameAnalysisBlock } from "@/components/GameAnalysisBlock";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateNativeBets } from "@/engine/native-analysis";

interface Props {
  config: LotteryConfig;
  stats: NumberStats[];
  draws: DrawResult[];
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

export function AIPredictionPanel({ config, stats, draws, onSaveBet }: Props) {
  const [bets, setBets] = useState<number[][]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [count, setCount] = useState(3);
  const [quality, setQuality] = useState<{ avgScore: number; scores: number[]; details?: string[][]; grade: string } | null>(null);

  const generate = async () => {
    setLoading(true);
    setBets([]);
    setAnalysis("");
    setQuality(null);
    try {
      // Native generation — no AI credits needed
      await new Promise(r => setTimeout(r, 300)); // Brief delay for UX
      const result = generateNativeBets(stats, config, draws, count);

      setBets(result.bets);
      setAnalysis(result.analysis);
      setQuality(result.quality);
      setSaved(new Set());
      toast.success(`${result.bets.length} apostas geradas! Qualidade: ${result.quality.grade}`);
    } catch (e: any) {
      console.error("Native prediction error:", e);
      toast.error(e?.message || "Erro ao gerar predições");
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
    onSaveBet?.(bet, "IA Nativa v2.0");
    setSaved(prev => new Set([...prev, index]));
  };

  const copyAll = () => {
    const text = bets.map((b, i) => `#${i + 1}: ${b.join(" - ")}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todas as apostas copiadas!");
  };

  return (
    <div className="rounded-xl glass-card p-3 sm:p-5 border border-white/5 relative overflow-hidden group">
      {/* Dynamic Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/10 blur-[100px] pointer-events-none rounded-full group-hover:bg-primary/20 transition-all duration-700" />
      <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                Titan Predictive Engine
                <span className="text-[9px] px-2 py-0.5 rounded-lg bg-primary/20 text-primary font-black uppercase tracking-widest border border-primary/20">
                  Neural v4.0
                </span>
              </h3>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                Frequência + Markov + Ciclos + Entropia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-10 sm:ml-0">
            {quality && (
              <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md ${
                quality.grade === "S" ? "bg-yellow-500/20 text-yellow-400" :
                quality.grade === "A" ? "bg-green-500/20 text-green-400" :
                quality.grade === "B" ? "bg-blue-500/20 text-blue-400" :
                "bg-muted text-muted-foreground"
              }`}>
                {quality.grade} ({quality.avgScore}pts)
              </span>
            )}
            {bets.length > 0 && (
              <Button size="sm" variant="outline" onClick={copyAll} className="text-[10px] sm:text-xs h-7 sm:h-8 border-border/50">
                <Copy className="w-3 h-3 mr-1" /> Copiar
              </Button>
            )}
          </div>
        </div>

        {/* Count selector + Generate */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1">
            {[1, 3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`text-[11px] px-3 py-1.5 rounded-lg border font-bold transition-all duration-300 ${
                  count === n
                    ? "border-primary text-primary bg-primary/20"
                    : "border-white/5 text-muted-foreground hover:text-white hover:border-white/20 hover:bg-white/[0.03]"
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
            className="text-[11px] sm:text-xs gap-2 bg-primary text-primary-foreground h-9 px-6 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
                className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-white/[0.04] transition-all duration-500 group"
              >
                <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 flex-col sm:flex-row">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-xs text-primary font-mono font-semibold">#{i + 1}</span>
                    {quality?.scores?.[i] !== undefined && (
                      <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        quality.scores[i] >= 90 ? "bg-yellow-500/20 text-yellow-400" :
                        quality.scores[i] >= 80 ? "bg-green-500/20 text-green-400" :
                        quality.scores[i] >= 70 ? "bg-blue-500/20 text-blue-400" :
                        "bg-muted text-muted-foreground"
                      }`}>{quality.scores[i]}pts</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 flex-1">
                    {bet.map(n => {
                      const stat = stats.find(s => s.number === n);
                      const ballClass =
                        stat?.status === "hot"
                          ? "lottery-ball-hot"
                          : stat?.status === "cold"
                          ? "lottery-ball-cold"
                          : "";
                      return (
                        <span key={n} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 border-white/10 ${
                          stat?.status === "hot" ? "bg-destructive text-white border-destructive/50" : 
                          stat?.status === "cold" ? "bg-blue-600 text-white border-blue-500/50" : 
                          "bg-[#111] text-primary border-primary/20"
                        }`}>
                          {String(n).padStart(2, "0")}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1 self-end sm:self-auto">
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
                </div>
                {quality?.details?.[i] && quality.details[i].length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-8">
                    {quality.details[i].map((detail: string, j: number) => (
                      <span key={j} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        detail.startsWith("⚠") ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}>{detail}</span>
                    ))}
                  </div>
                )}
                <div className="ml-8">
                  <GameAnalysisBlock numbers={bet} stats={stats} config={config} draws={draws} />
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
