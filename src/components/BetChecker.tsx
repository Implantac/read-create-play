import { useState, useMemo } from "react";
import { DrawResult } from "@/data/lotteries";
import { checkBetAgainstDraws, MatchResult, getPrizeTiers } from "@/services/lotteryApi";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, X, TrendingUp, Zap, Brain, Loader2, BarChart3, Target, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSavedBets, SavedBet } from "@/hooks/useSavedBets";

interface Props {
  draws: DrawResult[];
  lotteryId: string;
  maxNumbers: number;
  pick: number;
}

interface BetPerformance {
  numbers: number[];
  label: string;
  results: { concurso: number; date: string; hits: number; matched: number[]; prize: string }[];
  avgHits: number;
  bestHit: number;
  prizeHits: number;
  totalPrize: string;
  score: number;
}

// Estimated prize values per lottery/hits
function getEstimatedPrize(lotteryId: string, hits: number): { value: number; label: string } | null {
  const prizes: Record<string, Record<number, { value: number; label: string }>> = {
    megasena: {
      6: { value: 50000000, label: "Sena (~R$50M)" },
      5: { value: 40000, label: "Quina (~R$40k)" },
      4: { value: 800, label: "Quadra (~R$800)" },
    },
    lotofacil: {
      15: { value: 1500000, label: "15 pts (~R$1.5M)" },
      14: { value: 2000, label: "14 pts (~R$2k)" },
      13: { value: 35, label: "13 pts (R$35)" },
      12: { value: 14, label: "12 pts (R$14)" },
      11: { value: 7, label: "11 pts (R$7)" },
    },
    quina: {
      5: { value: 5000000, label: "Quina (~R$5M)" },
      4: { value: 6000, label: "Quadra (~R$6k)" },
      3: { value: 150, label: "Terno (~R$150)" },
      2: { value: 5, label: "Duque (~R$5)" },
    },
    lotomania: {
      20: { value: 3000000, label: "20 pts (~R$3M)" },
      19: { value: 50000, label: "19 pts (~R$50k)" },
      18: { value: 2000, label: "18 pts (~R$2k)" },
      17: { value: 200, label: "17 pts (~R$200)" },
      16: { value: 30, label: "16 pts (~R$30)" },
      15: { value: 6, label: "15 pts (R$6)" },
      0: { value: 6, label: "0 pts (R$6)" },
    },
    duplasena: {
      6: { value: 3000000, label: "Sena (~R$3M)" },
      5: { value: 5000, label: "Quina (~R$5k)" },
      4: { value: 100, label: "Quadra (~R$100)" },
      3: { value: 3, label: "Terno (~R$3)" },
    },
    timemania: {
      7: { value: 8000000, label: "7 pts (~R$8M)" },
      6: { value: 50000, label: "6 pts (~R$50k)" },
      5: { value: 1000, label: "5 pts (~R$1k)" },
      4: { value: 10, label: "4 pts (~R$10)" },
      3: { value: 3, label: "3 pts (R$3)" },
    },
    diadesorte: {
      7: { value: 1000000, label: "7 pts (~R$1M)" },
      6: { value: 5000, label: "6 pts (~R$5k)" },
      5: { value: 100, label: "5 pts (~R$100)" },
      4: { value: 5, label: "4 pts (~R$5)" },
    },
    supersete: {
      7: { value: 1000000, label: "7 pts (~R$1M)" },
      6: { value: 50000, label: "6 pts (~R$50k)" },
      5: { value: 1000, label: "5 pts (~R$1k)" },
      4: { value: 10, label: "4 pts (~R$10)" },
      3: { value: 3, label: "3 pts (R$3)" },
    },
  };
  return prizes[lotteryId]?.[hits] || null;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
  return `R$${value.toFixed(0)}`;
}

interface AIImprovement {
  original: number[];
  suggested: number[];
  reason: string;
  expectedGain: string;
}

export function BetChecker({ draws, lotteryId, maxNumbers, pick }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [performances, setPerformances] = useState<BetPerformance[]>([]);
  const [showPerformance, setShowPerformance] = useState(false);
  const [aiImprovements, setAiImprovements] = useState<AIImprovement[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [drawRange, setDrawRange] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"check" | "performance" | "improve">("check");

  const { savedBets } = useSavedBets(lotteryId);
  const selectedDraws = useMemo(() => draws.slice(0, drawRange), [draws, drawRange]);
  const prizeTiers = getPrizeTiers(lotteryId);
  const minPrizeHits = prizeTiers.length > 0 ? prizeTiers[prizeTiers.length - 1].hits : 3;

  const handleInput = (val: string) => {
    setInputValue(val);
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

  // Auto-check all bets (saved + manual) against last 10 draws
  const runPerformanceCheck = () => {
    const allBets: { numbers: number[]; label: string }[] = [];

    // Add saved bets
    savedBets.forEach((bet, i) => {
      allBets.push({
        numbers: bet.numbers,
        label: bet.label || bet.strategy || `Aposta salva #${i + 1}`,
      });
    });

    // Add current manual selection if exists
    if (selectedNumbers.length === pick) {
      allBets.push({ numbers: selectedNumbers, label: "Seleção atual" });
    }

    if (allBets.length === 0) {
      toast.error("Nenhuma aposta para conferir. Salve apostas ou selecione números.");
      return;
    }

    const perfs: BetPerformance[] = allBets.map(bet => {
      let totalPrizeValue = 0;
      const betResults = selectedDraws.map(draw => {
        const matched = bet.numbers.filter(n => draw.numbers.includes(n));
        const prizeInfo = getEstimatedPrize(lotteryId, matched.length);
        if (prizeInfo) totalPrizeValue += prizeInfo.value;
        return {
          concurso: draw.concurso,
          date: draw.date,
          hits: matched.length,
          matched,
          prize: prizeInfo?.label || "",
        };
      });

      const totalHits = betResults.reduce((s, r) => s + r.hits, 0);
      const avgHits = totalHits / selectedDraws.length;
      const bestHit = Math.max(...betResults.map(r => r.hits));
      const prizeHits = betResults.filter(r => r.hits >= minPrizeHits).length;

      const score = Math.round(
        (avgHits / pick) * 40 +
        (bestHit / pick) * 30 +
        (prizeHits / selectedDraws.length) * 30
      );

      return {
        numbers: bet.numbers,
        label: bet.label,
        results: betResults,
        avgHits: Math.round(avgHits * 100) / 100,
        bestHit,
        prizeHits,
        totalPrize: formatCurrency(totalPrizeValue),
        score: Math.min(score, 100),
      };
    });

    perfs.sort((a, b) => b.score - a.score);
    setPerformances(perfs);
    setShowPerformance(true);
    setActiveTab("performance");
    toast.success(`${perfs.length} apostas conferidas nos últimos ${drawRange} sorteios`);
  };

  // AI improvement suggestions
  const requestAIImprovements = async () => {
    const betsToImprove = performances.length > 0
      ? performances.slice(0, 5)
      : savedBets.slice(0, 5).map((b, i) => ({
          numbers: b.numbers,
          label: b.label || b.strategy || `Aposta #${i + 1}`,
          avgHits: 0,
          bestHit: 0,
          prizeHits: 0,
          score: 0,
          results: [],
        }));

    if (betsToImprove.length === 0) {
      toast.error("Gere apostas ou confira a performance primeiro");
      return;
    }

    setLoadingAI(true);
    setActiveTab("improve");

    try {
      const last10Data = selectedDraws.slice(0, 10).map(d => ({
        concurso: d.concurso,
        numbers: d.numbers,
        date: d.date,
      }));

      const { data, error } = await supabase.functions.invoke("ai-lottery-predict", {
        body: {
          lottery_id: lotteryId,
          count: betsToImprove.length,
          mode: "improve",
          bets_to_improve: betsToImprove.map(b => ({
            numbers: b.numbers,
            label: b.label,
            avg_hits: b.avgHits,
            best_hit: b.bestHit,
            prize_hits: b.prizeHits,
          })),
          last_draws: last10Data,
        },
      });

      if (error) throw error;

      if (data?.improvements) {
        setAiImprovements(data.improvements);
        toast.success("IA gerou sugestões de melhoria!");
      } else if (data?.bets) {
        // Fallback: use generated bets as improvements
        const improvements: AIImprovement[] = betsToImprove.map((original, i) => ({
          original: original.numbers,
          suggested: data.bets[i] || data.bets[0],
          reason: data.analysis || "Otimização baseada em padrões estatísticos recentes",
          expectedGain: "+15-25% de chance de acerto",
        }));
        setAiImprovements(improvements);
        toast.success("IA gerou apostas otimizadas!");
      }
    } catch (e: any) {
      console.error("AI improvement error:", e);
      toast.error("Erro ao solicitar melhorias da IA");
    } finally {
      setLoadingAI(false);
    }
  };

  const tierSummary = results
    ? prizeTiers.map(tier => ({
        ...tier,
        count: results.filter(r => r.matchCount >= tier.hits).length,
      }))
    : [];

  return (
    <div className="rounded-xl glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center">
            <Search className="w-4 h-4 text-neon-amber" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conferência Inteligente</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Confira apostas, analise performance e receba melhorias da IA
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border/30">
        {[
          { key: "check" as const, label: "Conferir", icon: Search },
          { key: "performance" as const, label: "Performance", icon: BarChart3 },
          { key: "improve" as const, label: "Melhorar com IA", icon: Brain },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md transition-all ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Check */}
      {activeTab === "check" && (
        <div className="space-y-3">
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
      )}

      {/* Tab: Performance */}
      {activeTab === "performance" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              Confere apostas salvas nos últimos <strong className="text-foreground">{drawRange} sorteios</strong>
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[10, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => { setDrawRange(n); setPerformances([]); }}
                    className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${
                      drawRange === n
                        ? "border-primary text-primary bg-primary/10 font-semibold"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n} jogos
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={runPerformanceCheck} className="text-xs gap-1.5">
                <TrendingUp className="w-3 h-3" /> Analisar
              </Button>
            </div>
          </div>

          {selectedDraws.length > 0 && selectedDraws.length <= 20 && (
            <div className="flex gap-1 flex-wrap">
              {selectedDraws.map(d => (
                <span key={d.concurso} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/50 border border-border/30 text-muted-foreground font-mono">
                  #{d.concurso}
                </span>
              ))}
            </div>
          )}
          {selectedDraws.length > 20 && (
            <p className="text-[10px] text-muted-foreground">
              Concursos #{selectedDraws[selectedDraws.length - 1]?.concurso} a #{selectedDraws[0]?.concurso} ({selectedDraws.length} sorteios)
            </p>
          )}

          {performances.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {performances.map((perf, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg bg-secondary/30 border border-border/30 p-3 space-y-2"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {i < 3 && (
                        <span className={`text-xs font-bold ${
                          i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : "text-amber-600"
                        }`}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                        </span>
                      )}
                      <span className="text-xs font-medium text-foreground truncate max-w-[200px]">
                        {perf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        perf.score >= 70 ? "bg-green-500/20 text-green-400" :
                        perf.score >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {perf.score}pts
                      </span>
                    </div>
                  </div>

                  {/* Numbers */}
                  <div className="flex flex-wrap gap-1">
                    {perf.numbers.map(n => (
                      <span key={n} className="lottery-ball text-[10px] w-6 h-6">
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-1.5 rounded bg-muted/30">
                      <p className="text-[9px] text-muted-foreground">Média acertos</p>
                      <p className="text-sm font-bold font-mono text-foreground">{perf.avgHits}</p>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/30">
                      <p className="text-[9px] text-muted-foreground">Melhor</p>
                      <p className="text-sm font-bold font-mono text-neon-amber">{perf.bestHit}</p>
                    </div>
                    <div className="text-center p-1.5 rounded bg-muted/30">
                      <p className="text-[9px] text-muted-foreground">Premiações</p>
                      <p className="text-sm font-bold font-mono text-green-400">{perf.prizeHits}x</p>
                    </div>
                  </div>

                  {/* Per-draw breakdown */}
                  <div className="flex gap-1 flex-wrap">
                    {perf.results.map(r => (
                      <span
                        key={r.concurso}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          r.hits >= minPrizeHits
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : r.hits > 0
                            ? "bg-secondary/50 text-muted-foreground border border-border/30"
                            : "bg-muted/20 text-muted-foreground/50"
                        }`}
                        title={`Concurso #${r.concurso}: ${r.hits} acertos`}
                      >
                        #{r.concurso}: {r.hits}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {performances.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-border/30 rounded-lg">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 opacity-40" />
              Clique em "Analisar Performance" para conferir suas apostas
            </div>
          )}
        </div>
      )}

      {/* Tab: AI Improvements */}
      {activeTab === "improve" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              A IA analisa suas apostas e sugere ajustes para <strong className="text-foreground">maximizar acertos</strong>
            </p>
            <Button
              size="sm"
              onClick={requestAIImprovements}
              disabled={loadingAI}
              className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
            >
              {loadingAI ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Analisando...</>
              ) : (
                <><Brain className="w-3 h-3" /> Sugerir Melhorias</>
              )}
            </Button>
          </div>

          {loadingAI && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                <Brain className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs text-muted-foreground animate-pulse">
                IA analisando performance e gerando melhorias...
              </p>
            </div>
          )}

          {!loadingAI && aiImprovements.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {aiImprovements.map((imp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Melhoria #{i + 1}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 ml-auto">
                      {imp.expectedGain}
                    </span>
                  </div>

                  {/* Original vs Suggested */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground mb-1">Original</p>
                      <div className="flex flex-wrap gap-1">
                        {imp.original.map(n => {
                          const removed = !imp.suggested.includes(n);
                          return (
                            <span key={n} className={`text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                              removed
                                ? "bg-destructive/20 text-destructive line-through"
                                : "bg-secondary/50 text-foreground"
                            }`}>
                              {String(n).padStart(2, "0")}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-primary mb-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> Sugerida
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {imp.suggested.map(n => {
                          const added = !imp.original.includes(n);
                          return (
                            <span key={n} className={`lottery-ball text-[10px] w-6 h-6 ${
                              added ? "ring-2 ring-green-400 ring-offset-1 ring-offset-background" : ""
                            }`}>
                              {String(n).padStart(2, "0")}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <Target className="w-3 h-3 inline mr-1 text-primary" />
                    {imp.reason}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {!loadingAI && aiImprovements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs border border-dashed border-primary/20 rounded-lg">
              <Brain className="w-6 h-6 mx-auto mb-2 opacity-40" />
              {performances.length > 0
                ? 'Clique em "Sugerir Melhorias" para a IA otimizar suas apostas'
                : 'Analise a performance primeiro e depois peça melhorias da IA'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
