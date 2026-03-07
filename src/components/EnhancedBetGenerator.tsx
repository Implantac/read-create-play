import { useState } from "react";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { STRATEGIES, Strategy, generateByStrategy } from "@/engine/strategies";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Copy, Check, Brain, Flame, Snowflake, Shuffle, Hash, Sigma, Ratio, Grid3X3, Clock, BarChart3, TrendingUp, Repeat, Layers, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

const ICON_MAP: Record<Strategy, typeof Sparkles> = {
  smart: Sparkles,
  hot: Flame,
  cold: Snowflake,
  balanced: Shuffle,
  trend: TrendingUp,
  fibonacci: Sigma,
  primes: Hash,
  golden: Ratio,
  sectors: Grid3X3,
  lowDelay: Clock,
  pattern: BarChart3,
  cycle: Repeat,
  ml: Brain,
  hybrid: Layers,
};

const CATEGORY_LABELS = { basic: "Básicas", math: "Matemáticas", ai: "Inteligência Artificial" };

export function EnhancedBetGenerator({ stats, config, onSaveBet }: Props) {
  const [strategy, setStrategy] = useState<Strategy>("smart");
  const [bets, setBets] = useState<number[][]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const generate = (count: number) => {
    const newBets: number[][] = [];
    for (let i = 0; i < count; i++) {
      newBets.push(generateByStrategy(strategy, stats, config));
    }
    setBets(newBets);
    setSaved(new Set());
  };

  const copyBet = (bet: number[], index: number) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(index);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSave = (bet: number[], index: number) => {
    const strategyInfo = STRATEGIES.find(s => s.id === strategy);
    onSaveBet?.(bet, strategyInfo?.label || strategy);
    setSaved(prev => new Set([...prev, index]));
  };

  const copyAll = () => {
    const text = bets.map((b, i) => `#${i + 1}: ${b.join(" - ")}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todas as apostas copiadas!");
  };

  const currentStrategy = STRATEGIES.find(s => s.id === strategy)!;

  const grouped = (["basic", "math", "ai"] as const).map(cat => ({
    label: CATEGORY_LABELS[cat],
    items: STRATEGIES.filter(s => s.category === cat),
  }));

  return (
    <div className="rounded-xl glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-neon-amber" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Gerador Avançado</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{currentStrategy.desc}</p>
          </div>
        </div>
        {bets.length > 0 && (
          <Button size="sm" variant="outline" onClick={copyAll} className="text-xs border-border/50">
            <Copy className="w-3 h-3 mr-1" /> Copiar todas
          </Button>
        )}
      </div>

      {/* Strategy selector grouped */}
      <div className="space-y-2 mb-4">
        {grouped.map(group => (
          <div key={group.label}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map(s => {
                const Icon = ICON_MAP[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => setStrategy(s.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-all ${
                      strategy === s.id
                        ? "border-neon-amber text-neon-amber bg-neon-amber/10"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Generate buttons */}
      <div className="flex gap-2 mb-4">
        {[1, 3, 5, 10].map(n => (
          <Button
            key={n}
            variant="outline"
            size="sm"
            onClick={() => generate(n)}
            className="text-xs border-border/50 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            {n} jogo{n > 1 ? "s" : ""}
          </Button>
        ))}
      </div>

      {/* Bets list */}
      <AnimatePresence mode="wait">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {bets.map((bet, i) => (
            <motion.div
              key={`${i}-${bet.join(",")}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/30 hover:border-border/60 transition-colors group"
            >
              <span className="text-xs text-muted-foreground font-mono w-6">#{i + 1}</span>
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

      {bets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border/30 rounded-lg">
          Escolha uma estratégia e gere suas apostas
        </div>
      )}
    </div>
  );
}
