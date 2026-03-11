import { useState } from "react";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { STRATEGIES, Strategy, generateByStrategy } from "@/engine/strategies";
import { GenerationFilters, DEFAULT_FILTERS, generateWithFilters, betMatchesFilters } from "@/engine/generation-filters";
import { GeneratorFiltersPanel } from "@/components/GeneratorFiltersPanel";
import { HistoricalValidationBadge } from "@/components/HistoricalValidationBadge";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Copy, Check, Brain, Flame, Snowflake, Shuffle, Hash, Sigma, Ratio, Grid3X3, Clock, BarChart3, TrendingUp, Repeat, Layers, Star, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLotteryContext } from "@/contexts/LotteryContext";

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
  const { draws } = useLotteryContext();
  const [strategy, setStrategy] = useState<Strategy>("smart");
  const [bets, setBets] = useState<number[][]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<GenerationFilters>({ ...DEFAULT_FILTERS });
  const [filterFailures, setFilterFailures] = useState(0);

  const hasActiveFilters = filters.fixedNumbers.length > 0 || filters.excludedNumbers.length > 0 ||
    filters.sumMin !== null || filters.sumMax !== null ||
    filters.minEven !== null || filters.maxEven !== null ||
    filters.maxConsecutive !== null || filters.mustIncludeHot > 0 || filters.mustIncludeCold > 0;

  const generate = (count: number) => {
    const newBets: number[][] = [];
    const seen = new Set<string>();
    const maxAttempts = count * 50;
    let attempts = 0;
    let failures = 0;

    while (newBets.length < count && attempts < maxAttempts) {
      attempts++;

      let bet: number[] | null;
      if (hasActiveFilters) {
        bet = generateWithFilters(
          () => generateByStrategy(strategy, stats, config),
          filters,
          stats,
          config,
          50
        );
        if (!bet) { failures++; continue; }
      } else {
        bet = generateByStrategy(strategy, stats, config);
      }

      const key = [...bet].sort((a, b) => a - b).join(",");
      if (!seen.has(key)) {
        seen.add(key);
        newBets.push(bet);
      }
    }

    setBets(newBets);
    setSaved(new Set());
    setFilterFailures(failures);

    if (newBets.length < count && hasActiveFilters) {
      toast.warning(`Filtros restritivos: ${newBets.length}/${count} jogos gerados. Relaxe os filtros para mais resultados.`);
    }
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

      {/* Filters Panel */}
      <div className="mb-4">
        <GeneratorFiltersPanel
          config={config}
          draws={draws}
          stats={stats}
          filters={filters}
          onFiltersChange={setFilters}
        />
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

      {/* Filter warnings */}
      {filterFailures > 0 && (
        <div className="flex items-center gap-2 p-2 mb-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{filterFailures} tentativas descartadas pelos filtros. Considere relaxar os critérios.</span>
        </div>
      )}

      {/* Bets list */}
      <AnimatePresence mode="wait">
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {bets.map((bet, i) => (
            <motion.div
              key={`${i}-${bet.join(",")}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg bg-secondary/30 border border-border/30 hover:border-border/60 transition-colors group"
            >
              <div className="flex items-center gap-2 p-3">
                <span className="text-xs text-muted-foreground font-mono w-6">#{i + 1}</span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {bet.map(n => {
                    const stat = stats.find(s => s.number === n);
                    const isFixed = filters.fixedNumbers.includes(n);
                    const ballClass =
                      isFixed
                        ? "ring-2 ring-primary"
                        : stat?.status === "hot"
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
              </div>
              {/* Historical Validation */}
              {draws.length > 0 && (
                <div className="px-3 pb-2">
                  <HistoricalValidationBadge bet={bet} draws={draws} config={config} />
                </div>
              )}
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
