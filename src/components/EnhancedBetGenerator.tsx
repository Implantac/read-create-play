import { useState } from "react";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { STRATEGIES, Strategy, generateByStrategy } from "@/engine/strategies";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Copy, Check, Brain, Flame, Snowflake, Shuffle, Hash, Sigma, Ratio, Grid3X3, Clock, BarChart3, TrendingUp, Repeat, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
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

export function EnhancedBetGenerator({ stats, config }: Props) {
  const [strategy, setStrategy] = useState<Strategy>("smart");
  const [bets, setBets] = useState<number[][]>([]);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = (count: number) => {
    const newBets: number[][] = [];
    for (let i = 0; i < count; i++) {
      newBets.push(generateByStrategy(strategy, stats, config));
    }
    setBets(newBets);
  };

  const copyBet = (bet: number[], index: number) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(index);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    const text = bets.map((b, i) => `#${i + 1}: ${b.join(" - ")}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todas as apostas copiadas!");
  };

  const currentStrategy = STRATEGIES.find(s => s.id === strategy)!;

  // Group strategies by category
  const grouped = (["basic", "math", "ai"] as const).map(cat => ({
    label: CATEGORY_LABELS[cat],
    items: STRATEGIES.filter(s => s.category === cat),
  }));

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-amber" />
            Gerador de Apostas Avançado
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{currentStrategy.desc}</p>
        </div>
        {bets.length > 0 && (
          <Button size="sm" variant="outline" onClick={copyAll} className="text-xs border-border">
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
            className="text-xs border-border hover:border-primary hover:text-primary"
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
              className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border"
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
              <button
                onClick={() => copyBet(bet, i)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {copied === i ? (
                  <Check className="w-4 h-4 text-neon-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {bets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Escolha uma estratégia e gere suas apostas
        </div>
      )}
    </div>
  );
}
