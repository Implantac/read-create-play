import { useState, useMemo } from "react";
import { useSelectedBets, BulkCheckResult } from "@/contexts/SelectedBetsContext";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Search, Trophy, Target, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

function matchBet(bet: number[], draw: number[], lotteryId: string): { hits: number; matched: number[] } {
  if (lotteryId === "supersete") {
    const matched: number[] = [];
    for (let i = 0; i < Math.min(bet.length, draw.length); i++) {
      if (bet[i] === draw[i]) matched.push(bet[i]);
    }
    return { hits: matched.length, matched };
  }
  const matched = bet.filter(n => draw.includes(n));
  return { hits: matched.length, matched };
}

function getMinPrizeHits(lotteryId: string): number {
  const map: Record<string, number> = {
    megasena: 4, lotofacil: 11, quina: 2, lotomania: 15,
    duplasena: 3, timemania: 3, diadesorte: 4, supersete: 3,
  };
  return map[lotteryId] ?? 3;
}

export function BulkCheckBar() {
  const { markedBets, clearMarked, checkResults, setCheckResults } = useSelectedBets();
  const { draws, selectedLottery } = useLotteryContext();
  const [showResults, setShowResults] = useState(false);

  const runCheck = () => {
    if (markedBets.length === 0) return;
    const recentDraws = draws.slice(0, 20);
    if (recentDraws.length === 0) { toast.error("Nenhum sorteio disponível"); return; }
    const minPrize = getMinPrizeHits(selectedLottery);

    const results: BulkCheckResult[] = markedBets.map(bet => {
      const drawResults = recentDraws.map(d => {
        const { hits, matched } = matchBet(bet.numbers, d.numbers, selectedLottery);
        return { concurso: d.concurso, date: d.date, hits, matched };
      });
      const avgHits = drawResults.reduce((s, r) => s + r.hits, 0) / drawResults.length;
      const bestHit = Math.max(...drawResults.map(r => r.hits));
      const prizeHits = drawResults.filter(r => r.hits >= minPrize).length;
      return { numbers: bet.numbers, label: bet.label, draws: drawResults, avgHits, bestHit, prizeHits };
    });

    results.sort((a, b) => b.avgHits - a.avgHits);
    setCheckResults(results);
    setShowResults(true);
    toast.success(`${results.length} jogos conferidos contra ${recentDraws.length} sorteios`);
  };

  if (markedBets.length === 0 && !showResults) return null;

  return (
    <>
      {/* Floating bar */}
      <AnimatePresence>
        {markedBets.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/10"
          >
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {markedBets.length} jogo{markedBets.length > 1 ? "s" : ""} marcado{markedBets.length > 1 ? "s" : ""}
            </span>
            <Button size="sm" onClick={runCheck} className="gradient-brand text-primary-foreground shadow-md gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Conferir
            </Button>
            <Button size="icon" variant="ghost" onClick={() => { clearMarked(); setShowResults(false); }} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results panel */}
      <AnimatePresence>
        {showResults && checkResults && checkResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-xl glass-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Resultado da Conferência</h3>
                  <p className="text-[11px] text-muted-foreground">{checkResults.length} jogos × 20 últimos sorteios</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setShowResults(false)} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard icon={Target} label="Média acertos" value={
                (checkResults.reduce((s, r) => s + r.avgHits, 0) / checkResults.length).toFixed(1)
              } />
              <SummaryCard icon={TrendingUp} label="Melhor acerto" value={
                Math.max(...checkResults.map(r => r.bestHit)).toString()
              } accent />
              <SummaryCard icon={BarChart3} label="Com prêmio" value={
                checkResults.reduce((s, r) => s + r.prizeHits, 0).toString()
              } />
            </div>

            {/* Per-bet results */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {checkResults.map((result, i) => (
                <BetResultCard key={i} result={result} rank={i + 1} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SummaryCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 p-3 rounded-lg border ${
      accent ? "bg-primary/10 border-primary/20" : "bg-muted/30 border-border/30"
    }`}>
      <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-lg font-bold font-mono ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
      <span className="text-[9px] text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function BetResultCard({ result, rank }: { result: BulkCheckResult; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = result.avgHits >= 3 ? "text-green-500" : result.avgHits >= 2 ? "text-yellow-500" : "text-muted-foreground";
  const prizeDraws = result.draws.filter(d => d.hits > 0).sort((a, b) => b.hits - a.hits);

  return (
    <div className="p-3 rounded-xl bg-card border border-border/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">#{rank}</span>
          <span className="text-xs font-medium text-foreground truncate max-w-[160px]">{result.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold font-mono ${scoreColor}`}>
            {result.avgHits.toFixed(1)} avg
          </span>
          {result.prizeHits > 0 && (
            <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-500">
              {result.prizeHits} prêmio{result.prizeHits > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Numbers */}
      <div className="flex flex-wrap gap-1">
        {result.numbers.map(n => (
          <span key={n} className="lottery-ball text-[10px] w-7 h-7">{String(n).padStart(2, "0")}</span>
        ))}
      </div>

      {/* Best hits summary */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Melhor: <strong className="text-foreground">{result.bestHit} acertos</strong></span>
        <span>•</span>
        <button onClick={() => setExpanded(!expanded)} className="text-primary hover:underline">
          {expanded ? "Ocultar" : "Ver detalhes"}
        </button>
      </div>

      {/* Expanded draw results */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-2 border-t border-border/30">
              {prizeDraws.slice(0, 10).map(d => (
                <div key={d.concurso} className="flex items-center justify-between text-[10px] py-1">
                  <span className="text-muted-foreground">Concurso {d.concurso}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {d.matched.map(n => (
                        <span key={n} className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold">
                          {n}
                        </span>
                      ))}
                    </div>
                    <Badge variant="outline" className="text-[8px] h-4">{d.hits} acerto{d.hits > 1 ? "s" : ""}</Badge>
                  </div>
                </div>
              ))}
              {prizeDraws.length > 10 && (
                <p className="text-[9px] text-muted-foreground text-center pt-1">+{prizeDraws.length - 10} sorteios</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
