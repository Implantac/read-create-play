import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { Grid3X3, RotateCcw, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSmartBet } from "@/engine/statistics";
import { toast } from "sonner";

interface Props {
  config: LotteryConfig;
  stats: NumberStats[];
  onSaveBet?: (numbers: number[]) => void;
}

export function NumberPickerGrid({ config, stats, onSaveBet }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = useCallback((n: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(n)) {
        next.delete(n);
      } else {
        if (next.size >= config.pick) {
          toast.error(`Máximo de ${config.pick} números`);
          return prev;
        }
        next.add(n);
      }
      return next;
    });
  }, [config.pick]);

  const clear = () => setSelected(new Set());

  const autoFill = () => {
    const bet = generateSmartBet(stats, config.pick);
    setSelected(new Set(bet));
  };

  const handleSave = () => {
    if (selected.size !== config.pick) {
      toast.error(`Selecione exatamente ${config.pick} números`);
      return;
    }
    const numbers = [...selected].sort((a, b) => a - b);
    onSaveBet?.(numbers);
  };

  const copyBet = () => {
    if (selected.size === 0) return;
    const numbers = [...selected].sort((a, b) => a - b);
    navigator.clipboard.writeText(numbers.join(" - "));
    toast.success("Números copiados!");
  };

  // Calculate grid columns — Lotofácil uses a 5x5 grid on mobile for perfect layout
  const isLotofacil = config.numbers === 25;
  const cols = isLotofacil ? 5 : config.numbers <= 31 ? 8 : config.numbers <= 50 ? 10 : 10;
  const mobileCols = isLotofacil ? 5 : config.numbers <= 31 ? 6 : config.numbers <= 50 ? 8 : 8;

  return (
    <div className="rounded-xl glass-card p-3 sm:p-5 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
            <Grid3X3 className="w-4 h-4 text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Seletor Visual de Números</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {selected.size}/{config.pick} selecionados — Toque para selecionar
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={clear} className="text-xs h-8 border-border/50">
            <RotateCcw className="w-3 h-3 mr-1" /> Limpar
          </Button>
          <Button size="sm" variant="outline" onClick={autoFill} className="text-xs h-8 border-border/50">
            <Sparkles className="w-3 h-3 mr-1" /> Auto
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${(selected.size / config.pick) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>

      {/* Grid */}
      <div
        className="grid gap-1 sm:gap-1.5"
        style={{
          gridTemplateColumns: `repeat(var(--grid-cols), minmax(0, 1fr))`,
          // @ts-ignore
          "--grid-cols": cols,
        } as React.CSSProperties}
      >
        <style>{`
          @media (max-width: 640px) {
            .number-picker-grid { --grid-cols: ${mobileCols} !important; }
          }
        `}</style>
        <div className="number-picker-grid contents">
        {Array.from({ length: config.numbers }, (_, i) => i + 1).map(n => {
          const stat = stats.find(s => s.number === n);
          const isSelected = selected.has(n);
          const isHot = stat?.status === "hot";
          const isCold = stat?.status === "cold";

          return (
            <motion.button
              key={n}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggle(n)}
              className={`
                relative aspect-square rounded-lg text-xs font-mono font-bold
                flex items-center justify-center transition-all duration-150
                border
                ${isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 scale-105"
                  : isHot
                    ? "bg-neon-red/10 text-neon-red border-neon-red/30 hover:bg-neon-red/20"
                    : isCold
                      ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/20"
                      : "bg-secondary/50 text-foreground/80 border-border/50 hover:bg-secondary hover:text-foreground"
                }
              `}
            >
              {String(n).padStart(2, "0")}
              {isHot && !isSelected && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neon-red" />
              )}
              {isCold && !isSelected && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-neon-blue" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-red" /> Quente
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-blue" /> Frio
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" /> Selecionado
        </span>
      </div>

      {/* Actions */}
      {selected.size > 0 && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyBet} className="text-xs flex-1">
            Copiar ({[...selected].sort((a, b) => a - b).join(", ")})
          </Button>
          {onSaveBet && selected.size === config.pick && (
            <Button size="sm" onClick={handleSave} className="text-xs gap-1">
              <Save className="w-3 h-3" /> Salvar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
