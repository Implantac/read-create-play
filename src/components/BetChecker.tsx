import { useState } from "react";
import { DrawResult } from "@/data/lotteries";
import { checkBetAgainstDraws, MatchResult, getPrizeTiers } from "@/services/lotteryApi";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, X, Plus } from "lucide-react";
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

  const addNumber = () => {
    const n = parseInt(inputValue, 10);
    if (isNaN(n) || n < 1 || n > maxNumbers) {
      toast.error(`Número deve estar entre 1 e ${maxNumbers}`);
      return;
    }
    if (selectedNumbers.includes(n)) {
      toast.error("Número já adicionado");
      return;
    }
    if (selectedNumbers.length >= pick) {
      toast.error(`Máximo de ${pick} números`);
      return;
    }
    setSelectedNumbers(prev => [...prev, n].sort((a, b) => a - b));
    setInputValue("");
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

  const prizeTiers = getPrizeTiers(lotteryId);

  const tierSummary = results
    ? prizeTiers.map(tier => ({
        ...tier,
        count: results.filter(r => r.matchCount >= tier.hits).length,
      }))
    : [];

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Search className="w-4 h-4 text-neon-amber" />
          Conferência de Jogos
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Insira seus números e confira contra os resultados históricos
        </p>
      </div>

      {/* Number input */}
      <div className="flex gap-2 mb-3">
        <Input
          type="number"
          min={1}
          max={maxNumbers}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addNumber()}
          placeholder={`1 a ${maxNumbers}`}
          className="w-24 bg-secondary border-border text-foreground text-sm"
        />
        <Button size="sm" variant="outline" onClick={addNumber} className="border-border hover:border-primary">
          <Plus className="w-3 h-3 mr-1" /> Adicionar
        </Button>
        <Button
          size="sm"
          onClick={check}
          disabled={selectedNumbers.length < 1}
          className="ml-auto bg-neon-amber/20 text-neon-amber border border-neon-amber/30 hover:bg-neon-amber/30"
        >
          <Search className="w-3 h-3 mr-1" /> Conferir
        </Button>
      </div>

      {/* Selected numbers */}
      <div className="flex flex-wrap gap-1.5 mb-4 min-h-[40px]">
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
        {selectedNumbers.length === 0 && (
          <span className="text-xs text-muted-foreground py-2">Nenhum número selecionado</span>
        )}
      </div>

      {/* Prize tier summary */}
      {results && tierSummary.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {tierSummary.filter(t => t.count > 0).map(tier => (
            <div key={tier.label} className="rounded-lg bg-neon-amber/10 border border-neon-amber/20 p-2 text-center">
              <p className="text-xs text-muted-foreground">{tier.label}</p>
              <p className="text-lg font-bold font-mono text-neon-amber">{tier.count}x</p>
            </div>
          ))}
        </div>
      )}

      {/* Results list */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 max-h-60 overflow-y-auto"
          >
            {results.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum acerto encontrado nos {draws.length} concursos analisados
              </p>
            )}
            {results.slice(0, 20).map(r => (
              <div
                key={r.concurso}
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border"
              >
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
