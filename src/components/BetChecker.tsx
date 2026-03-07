import { useState } from "react";
import { DrawResult } from "@/data/lotteries";
import { checkBetAgainstDraws, MatchResult, getPrizeTiers } from "@/services/lotteryApi";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props {
  draws: DrawResult[];
  lotteryId: string;
  maxNumbers: number;
  pick: number;
}

export function BetChecker({ draws, lotteryId, maxNumbers, pick }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [results, setResults] = useState<MatchResult[] | null>(null);

  const handleInput = (val: string) => {
    setInputValue(val);
    // Try to parse comma/space/dash separated numbers
    const nums = val
      .split(/[,\s\-]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= maxNumbers);
    
    if (nums.length > 0 && (val.endsWith(" ") || val.endsWith(",") || val.endsWith("-"))) {
      const unique = [...new Set([...selectedNumbers, ...nums])].sort((a, b) => a - b);
      if (unique.length <= pick) {
        setSelectedNumbers(unique);
        setInputValue("");
        setResults(null);
      }
    }
  };

  const addFromInput = () => {
    const nums = inputValue
      .split(/[,\s\-]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= maxNumbers);
    
    if (nums.length === 0) return;
    
    const unique = [...new Set([...selectedNumbers, ...nums])].sort((a, b) => a - b);
    if (unique.length > pick) {
      toast.error(`Máximo de ${pick} números`);
      return;
    }
    setSelectedNumbers(unique);
    setInputValue("");
    setResults(null);
  };

  const removeNumber = (n: number) => {
    setSelectedNumbers(prev => prev.filter(x => x !== n));
    setResults(null);
  };

  const check = () => {
    if (selectedNumbers.length < 1) {
      toast.error("Adicione pelo menos 1 número");
      return;
    }
    const matches = checkBetAgainstDraws(selectedNumbers, draws);
    setResults(matches);
    toast.success(`${matches.length} concursos com acertos encontrados`);
  };

  const clear = () => {
    setSelectedNumbers([]);
    setResults(null);
    setInputValue("");
  };

  const prizeTiers = getPrizeTiers(lotteryId);
  const tierSummary = results
    ? prizeTiers.map(tier => ({
        ...tier,
        count: results.filter(r => r.matchCount >= tier.hits).length,
      }))
    : [];

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center">
          <Search className="w-4 h-4 text-neon-amber" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Conferência de Jogos</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Cole ou digite seus números separados por vírgula ou espaço
          </p>
        </div>
      </div>

      {/* Number input - improved */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addFromInput()}
          placeholder={`Ex: 5, 12, 23, 34, 45, 60`}
          className="flex-1 bg-secondary/50 border-border/50 text-sm focus:border-primary/50"
        />
        <Button
          size="sm"
          onClick={check}
          disabled={selectedNumbers.length < 1}
          className="gradient-brand text-primary-foreground shadow-md shadow-primary/10"
        >
          <Search className="w-3 h-3 mr-1" /> Conferir
        </Button>
      </div>

      {/* Selected numbers */}
      <div className="flex flex-wrap gap-1.5 min-h-[40px] items-center">
        {selectedNumbers.map(n => (
          <motion.button
            key={n}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="lottery-ball text-xs w-8 h-8 relative group"
            onClick={() => removeNumber(n)}
          >
            {String(n).padStart(2, "0")}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-2.5 h-2.5" />
            </span>
          </motion.button>
        ))}
        {selectedNumbers.length > 0 && (
          <button onClick={clear} className="text-[10px] text-muted-foreground hover:text-destructive ml-1">
            Limpar
          </button>
        )}
        {selectedNumbers.length === 0 && (
          <span className="text-xs text-muted-foreground py-2">Nenhum número selecionado</span>
        )}
      </div>

      {/* Prize tier summary */}
      {results && tierSummary.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {tierSummary.filter(t => t.count > 0).map(tier => (
            <div key={tier.label} className="rounded-lg bg-neon-amber/5 border border-neon-amber/20 p-2.5 text-center">
              <p className="text-[10px] text-muted-foreground">{tier.label}</p>
              <p className="text-lg font-bold font-mono text-neon-amber">{tier.count}x</p>
            </div>
          ))}
        </div>
      )}

      {/* Results list */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {results.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum acerto encontrado nos {draws.length} concursos analisados
              </p>
            )}
            {results.slice(0, 20).map(r => (
              <div key={r.concurso} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30">
                <div className="text-xs">
                  <span className="font-mono text-foreground">#{r.concurso}</span>
                  <span className="text-muted-foreground ml-2">{r.date}</span>
                </div>
                <div className="flex items-center gap-1 ml-auto">
                  <Trophy className="w-3 h-3 text-neon-amber" />
                  <span className="text-xs font-bold text-neon-amber">{r.matchCount} acertos</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.matchedNumbers.map(n => (
                    <span key={n} className="lottery-ball text-[10px] w-6 h-6">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
