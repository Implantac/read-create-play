import { useState, useMemo, useEffect, useCallback } from "react";
import { DrawResult } from "@/data/lotteries";
import { checkBetAgainstDraws, MatchResult, getPrizeTiers } from "@/services/lotteryApi";
import { DrawResultWithPrizes, DrawPrizeData } from "@/hooks/useLotteryDraws";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trophy, X, TrendingUp, Zap, Brain, Loader2,
  BarChart3, Target, ArrowUpRight, ChevronDown, ChevronUp,
  Award, DollarSign, Sparkles, CheckCircle2, AlertTriangle,
  Copy, Save, Grid3X3, ArrowDown, ArrowUp, Minus, ListChecks,
  FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateNativeImprovements } from "@/engine/native-analysis";
import { computeFrequencyStats } from "@/engine/statistics";
import { useSavedBets, SavedBet } from "@/hooks/useSavedBets";
import { Progress } from "@/components/ui/progress";
import { BetHitsChart } from "@/components/BetHitsChart";

interface Props {
  draws: DrawResult[];
  drawsWithPrizes?: DrawResultWithPrizes[];
  lotteryId: string;
  maxNumbers: number;
  pick: number;
}

interface BetPerformance {
  numbers: number[];
  label: string;
  results: { concurso: number; date: string; hits: number; matched: number[]; prize: string; prizeValue: number; realPrize?: string }[];
  avgHits: number;
  bestHit: number;
  prizeHits: number;
  totalPrizeValue: number;
  totalPrize: string;
  score: number;
  trend?: "up" | "down" | "stable";
  recentAvg?: number;
  previousAvg?: number;
}

function getMaxPossibleHits(lotteryId: string, pick: number): number {
  switch (lotteryId) {
    case "lotomania": return 20;
    case "timemania": return 7;
    default: return pick;
  }
}

function matchBetAgainstDraw(bet: number[], draw: number[], lotteryId: string): { hits: number; matched: number[] } {
  if (lotteryId === "supersete") {
    const matched: number[] = [];
    const len = Math.min(bet.length, draw.length);
    for (let i = 0; i < len; i++) {
      if (bet[i] === draw[i]) matched.push(bet[i]);
    }
    return { hits: matched.length, matched };
  }
  const matched = bet.filter(n => draw.includes(n));
  return { hits: matched.length, matched };
}

function getEstimatedPrize(lotteryId: string, hits: number): { value: number; label: string } | null {
  const prizes: Record<string, Record<number, { value: number; label: string }>> = {
    megasena: {
      6: { value: 50000000, label: "Sena (~R$50M)" }, 5: { value: 40000, label: "Quina (~R$40k)" }, 4: { value: 800, label: "Quadra (~R$800)" },
    },
    lotofacil: {
      15: { value: 1500000, label: "15 pts (~R$1.5M)" }, 14: { value: 2000, label: "14 pts (~R$2k)" },
      13: { value: 35, label: "13 pts (R$35)" }, 12: { value: 14, label: "12 pts (R$14)" }, 11: { value: 7, label: "11 pts (R$7)" },
    },
    quina: {
      5: { value: 5000000, label: "Quina (~R$5M)" }, 4: { value: 6000, label: "Quadra (~R$6k)" },
      3: { value: 150, label: "Terno (~R$150)" }, 2: { value: 5, label: "Duque (~R$5)" },
    },
    lotomania: {
      20: { value: 3000000, label: "20 pts (~R$3M)" }, 19: { value: 50000, label: "19 pts (~R$50k)" },
      18: { value: 2000, label: "18 pts (~R$2k)" }, 17: { value: 200, label: "17 pts (~R$200)" },
      16: { value: 30, label: "16 pts (~R$30)" }, 15: { value: 6, label: "15 pts (R$6)" }, 0: { value: 6, label: "0 pts (R$6)" },
    },
    duplasena: {
      6: { value: 3000000, label: "Sena (~R$3M)" }, 5: { value: 5000, label: "Quina (~R$5k)" },
      4: { value: 100, label: "Quadra (~R$100)" }, 3: { value: 3, label: "Terno (~R$3)" },
    },
    timemania: {
      7: { value: 8000000, label: "7 pts (~R$8M)" }, 6: { value: 50000, label: "6 pts (~R$50k)" },
      5: { value: 1000, label: "5 pts (~R$1k)" }, 4: { value: 10, label: "4 pts (~R$10)" }, 3: { value: 3, label: "3 pts (R$3)" },
    },
    diadesorte: {
      7: { value: 1000000, label: "7 pts (~R$1M)" }, 6: { value: 5000, label: "6 pts (~R$5k)" },
      5: { value: 100, label: "5 pts (~R$100)" }, 4: { value: 5, label: "4 pts (~R$5)" },
    },
    supersete: {
      7: { value: 1000000, label: "7 pts (~R$1M)" }, 6: { value: 50000, label: "6 pts (~R$50k)" },
      5: { value: 1000, label: "5 pts (~R$1k)" }, 4: { value: 10, label: "4 pts (~R$10)" }, 3: { value: 3, label: "3 pts (R$3)" },
    },
  };
  return prizes[lotteryId]?.[hits] || null;
}

/** Try to get the real prize value from prize_tiers data */
function getRealPrizeLabel(prizeTiers: DrawPrizeData | null | undefined, hits: number): string | undefined {
  if (!prizeTiers?.premiacoes) return undefined;
  const tier = prizeTiers.premiacoes.find(p => {
    const desc = p.descricao.toLowerCase();
    return desc.includes(`${hits} acerto`) || desc.includes(`${hits} ponto`) || p.faixa === hits;
  });
  if (tier && tier.valorPremio > 0) {
    return `R$ ${tier.valorPremio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${tier.ganhadores > 0 ? ` (${tier.ganhadores} ganh.)` : ""}`;
  }
  return undefined;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
}

interface AIImprovement {
  original: number[];
  suggested: number[];
  reason: string;
  expectedGain: string;
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? "hsl(var(--primary))" : score >= 40 ? "hsl(var(--neon-amber))" : "hsl(var(--destructive))";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={3} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={3} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono text-foreground">{score}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent = false }: {
  icon: React.ElementType; label: string; value: string | number; accent?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-lg border transition-colors ${
      accent ? "bg-primary/10 border-primary/20" : "bg-muted/30 border-border/30"
    }`}>
      <Icon className={`w-3.5 h-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-xs sm:text-sm font-bold font-mono ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
      <span className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight text-center">{label}</span>
    </div>
  );
}

function TrendBadge({ trend, recentAvg, previousAvg }: { trend: "up" | "down" | "stable"; recentAvg: number; previousAvg: number }) {
  const config = {
    up: { icon: ArrowUp, color: "text-green-400 bg-green-400/10 border-green-400/30", label: "Subindo" },
    down: { icon: ArrowDown, color: "text-destructive bg-destructive/10 border-destructive/30", label: "Caindo" },
    stable: { icon: Minus, color: "text-muted-foreground bg-muted/30 border-border/30", label: "Estável" },
  };
  const c = config[trend];
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${c.color}`}>
      <c.icon className="w-3 h-3" />
      <span>{c.label}</span>
      <span className="opacity-70">({recentAvg.toFixed(1)} vs {previousAvg.toFixed(1)})</span>
    </div>
  );
}

export function BetChecker({ draws, drawsWithPrizes, lotteryId, maxNumbers, pick }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [performances, setPerformances] = useState<BetPerformance[]>([]);
  const [aiImprovements, setAiImprovements] = useState<AIImprovement[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [drawRange, setDrawRange] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"check" | "performance" | "improve">("check");
  const [expandedPerf, setExpandedPerf] = useState<number | null>(null);
  const [hasRunPerformance, setHasRunPerformance] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  const { savedBets, saveBet } = useSavedBets(lotteryId);
  const selectedDraws = useMemo(() => draws.slice(0, drawRange), [draws, drawRange]);
  const lastDraw = useMemo(() => draws.length > 0 ? draws[0] : null, [draws]);

  // Prize data map for real values
  const prizeDataMap = useMemo(() => {
    if (!drawsWithPrizes) return new Map<number, DrawPrizeData | null>();
    const map = new Map<number, DrawPrizeData | null>();
    drawsWithPrizes.forEach(d => map.set(d.concurso, d.prizeTiers || null));
    return map;
  }, [drawsWithPrizes]);

  useEffect(() => {
    setSelectedNumbers([]);
    setResults(null);
    setPerformances([]);
    setAiImprovements([]);
    setInputValue("");
    setExpandedPerf(null);
    setHasRunPerformance(false);
    setShowGrid(false);
  }, [lotteryId]);

  useEffect(() => {
    if (hasRunPerformance && selectedDraws.length > 0) {
      const timer = setTimeout(() => runPerformanceCheck(), 50);
      return () => clearTimeout(timer);
    }
  }, [drawRange, selectedDraws]);

  const prizeTiers = getPrizeTiers(lotteryId);
  const minPrizeHits = prizeTiers.length > 0
    ? Math.max(1, Math.min(...prizeTiers.map(t => t.hits).filter(h => h > 0)))
    : 3;

  const handleInput = (val: string) => {
    setInputValue(val);
    const nums = val.split(/[,\s\-]+/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= maxNumbers);
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
    const nums = inputValue.split(/[,\s\-]+/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= 1 && n <= maxNumbers);
    if (nums.length === 0) return;
    const unique = [...new Set([...selectedNumbers, ...nums])].sort((a, b) => a - b);
    if (unique.length > pick) { toast.error(`Máximo de ${pick} números`); return; }
    setSelectedNumbers(unique);
    setInputValue("");
    setResults(null);
  };

  const removeNumber = (n: number) => {
    setSelectedNumbers(prev => prev.filter(x => x !== n));
    setResults(null);
  };

  const toggleGridNumber = useCallback((n: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n);
      if (prev.length >= pick) { toast.error(`Máximo de ${pick} números`); return prev; }
      return [...prev, n].sort((a, b) => a - b);
    });
    setResults(null);
  }, [pick]);

  const loadSavedBet = (bet: SavedBet) => {
    setSelectedNumbers([...bet.numbers]);
    setResults(null);
    toast.success(`Aposta "${bet.label || bet.strategy || "salva"}" carregada`);
  };

  const check = () => {
    if (selectedNumbers.length < 1) { toast.error("Adicione pelo menos 1 número"); return; }
    const matches = draws.map(draw => {
      const { hits, matched } = matchBetAgainstDraw(selectedNumbers, draw.numbers, lotteryId);
      return { concurso: draw.concurso, date: draw.date, drawnNumbers: draw.numbers, matchedNumbers: matched, matchCount: hits };
    }).filter(r => r.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount);
    setResults(matches);
    toast.success(`${matches.length} concursos com acertos encontrados`);
  };

  const clear = () => { setSelectedNumbers([]); setResults(null); setInputValue(""); };
  const copyNumbers = (nums: number[]) => { navigator.clipboard.writeText(nums.join(", ")); toast.success("Números copiados!"); };

  const computeTrend = (betResults: { hits: number }[]): { trend: "up" | "down" | "stable"; recentAvg: number; previousAvg: number } => {
    if (betResults.length < 6) return { trend: "stable", recentAvg: 0, previousAvg: 0 };
    const recent = betResults.slice(0, 5);
    const previous = betResults.slice(5, 15);
    const recentAvg = recent.reduce((s, r) => s + r.hits, 0) / recent.length;
    const previousAvg = previous.length > 0 ? previous.reduce((s, r) => s + r.hits, 0) / previous.length : recentAvg;
    const diff = recentAvg - previousAvg;
    const trend = diff > 0.3 ? "up" : diff < -0.3 ? "down" : "stable";
    return { trend, recentAvg, previousAvg };
  };

  const runPerformanceCheck = () => {
    const allBets: { numbers: number[]; label: string }[] = [];
    if (selectedNumbers.length > 0) allBets.push({ numbers: [...selectedNumbers], label: `Seleção atual (${selectedNumbers.length} nº)` });
    savedBets.forEach((bet, i) => allBets.push({ numbers: [...bet.numbers], label: bet.label || bet.strategy || `Aposta salva #${i + 1}` }));
    if (allBets.length === 0) { toast.error("Nenhuma aposta para conferir."); return; }
    if (selectedDraws.length === 0) { toast.error("Nenhum sorteio disponível."); return; }

    const maxHits = getMaxPossibleHits(lotteryId, pick);
    const perfs: BetPerformance[] = allBets.map(bet => {
      let totalPrizeValue = 0;
      const betResults = selectedDraws.map(draw => {
        const { hits, matched } = matchBetAgainstDraw(bet.numbers, draw.numbers, lotteryId);
        const prizeInfo = getEstimatedPrize(lotteryId, hits);
        if (prizeInfo) totalPrizeValue += prizeInfo.value;
        // Try real prize
        const realPrize = getRealPrizeLabel(prizeDataMap.get(draw.concurso), hits);
        return { concurso: draw.concurso, date: draw.date, hits, matched, prize: prizeInfo?.label || "", prizeValue: prizeInfo?.value || 0, realPrize };
      });

      const drawCount = selectedDraws.length;
      const totalHits = betResults.reduce((s, r) => s + r.hits, 0);
      const avgHits = drawCount > 0 ? totalHits / drawCount : 0;
      const bestHit = betResults.length > 0 ? Math.max(...betResults.map(r => r.hits)) : 0;
      const prizeHits = betResults.filter(r => r.prizeValue > 0).length;
      const effectiveMax = Math.min(bet.numbers.length, maxHits);
      const score = effectiveMax > 0 && drawCount > 0
        ? Math.round((avgHits / effectiveMax) * 40 + (bestHit / effectiveMax) * 30 + (prizeHits / drawCount) * 30)
        : 0;

      const trendData = computeTrend(betResults);

      return {
        numbers: bet.numbers, label: bet.label, results: betResults,
        avgHits: Math.round(avgHits * 100) / 100, bestHit, prizeHits,
        totalPrizeValue, totalPrize: formatCurrency(totalPrizeValue),
        score: Math.min(score, 100),
        trend: trendData.trend, recentAvg: trendData.recentAvg, previousAvg: trendData.previousAvg,
      };
    });

    perfs.sort((a, b) => b.score - a.score);
    setPerformances(perfs);
    setActiveTab("performance");
    setHasRunPerformance(true);
    toast.success(`${perfs.length} apostas conferidas contra ${selectedDraws.length} sorteios reais`);
  };

  const runCheckAll = () => {
    if (savedBets.length === 0) { toast.error("Nenhuma aposta salva"); return; }
    setSelectedNumbers([]);
    setDrawRange(10);
    setTimeout(() => runPerformanceCheck(), 100);
  };

  const requestAIImprovements = async () => {
    const betsToImprove = performances.length > 0
      ? performances.slice(0, 5)
      : savedBets.slice(0, 5).map((b, i) => ({
          numbers: b.numbers, label: b.label || b.strategy || `Aposta #${i + 1}`,
          avgHits: 0, bestHit: 0, prizeHits: 0, score: 0, results: [],
        }));
    if (betsToImprove.length === 0) { toast.error("Gere apostas ou confira a performance primeiro"); return; }
    setLoadingAI(true);
    setActiveTab("improve");
    try {
      const stats = computeFrequencyStats(draws, maxNumbers);
      const config = { id: lotteryId, name: lotteryId, numbers: maxNumbers, pick, color: "", icon: "" };
      const improvements = generateNativeImprovements(
        betsToImprove.map(b => ({ numbers: b.numbers, label: b.label, avgHits: b.avgHits, bestHit: b.bestHit, prizeHits: b.prizeHits })),
        stats, config, draws
      );
      setAiImprovements(improvements);
      toast.success("Motor nativo gerou sugestões de melhoria!");
    } catch (e: any) {
      console.error("Native improvement error:", e);
      toast.error("Erro ao gerar melhorias");
    } finally {
      setLoadingAI(false);
    }
  };

  const tierSummary = results ? prizeTiers.map(tier => ({ ...tier, count: results.filter(r => r.matchCount === tier.hits).length })) : [];

  const globalSummary = useMemo(() => {
    if (performances.length === 0) return null;
    const totalPrize = performances.reduce((s, p) => s + p.totalPrizeValue, 0);
    const avgScore = Math.round(performances.reduce((s, p) => s + p.score, 0) / performances.length);
    const totalPrizeHits = performances.reduce((s, p) => s + p.prizeHits, 0);
    const bestOverall = Math.max(...performances.map(p => p.bestHit));
    const trendsUp = performances.filter(p => p.trend === "up").length;
    const trendsDown = performances.filter(p => p.trend === "down").length;
    return { totalPrize, avgScore, totalPrizeHits, bestOverall, trendsUp, trendsDown };
  }, [performances]);

  const tabs = [
    { key: "check" as const, label: "Conferir", icon: Search, desc: "Manual" },
    { key: "performance" as const, label: "Performance", icon: BarChart3, desc: drawRange === 1 ? "Último" : `${drawRange} jogos` },
    { key: "improve" as const, label: "IA Melhorias", icon: Brain, desc: "Otimizar" },
  ];

  // Number grid columns
  const gridCols = maxNumbers <= 31 ? 8 : maxNumbers <= 50 ? 10 : 10;

  return (
    <div className="rounded-xl glass-card overflow-hidden">
      {/* Header */}
      <div className="relative p-4 sm:p-5 pb-3 sm:pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/5">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Conferência Inteligente</h3>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
              Confira apostas, analise performance e receba melhorias da IA
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {savedBets.length > 0 && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                {savedBets.length} salvas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="px-4 sm:px-5">
        <div className="flex gap-0.5 p-1 rounded-xl bg-muted/50 border border-border/30">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-md border border-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === tab.key ? "text-primary" : ""}`} />
              <span className="text-[10px] sm:text-[11px] font-medium">{tab.label}</span>
              <span className="text-[7px] sm:text-[8px] opacity-60">{tab.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-3 sm:pt-4">
        {/* ========== TAB: CHECK ========== */}
        {activeTab === "check" && (
          <div className="space-y-3 sm:space-y-4">
            {/* Input + grid toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={inputValue}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addFromInput()}
                  placeholder={`Digite números: 5, 12, 23...`}
                  className="bg-muted/50 border-border/50 text-sm focus:border-primary/50 pl-9"
                />
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <Button size="icon" variant="outline" onClick={() => setShowGrid(!showGrid)} className="shrink-0 border-border/50" title="Grade visual">
                <Grid3X3 className={`w-4 h-4 ${showGrid ? "text-primary" : ""}`} />
              </Button>
              <Button size="sm" onClick={check} disabled={selectedNumbers.length < 1} className="gradient-brand text-primary-foreground shadow-md shadow-primary/10 px-3 sm:px-5">
                Conferir
              </Button>
            </div>

            {/* Quick-load saved bets */}
            {savedBets.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <ListChecks className="w-3 h-3" /> Carregar aposta salva:
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {savedBets.slice(0, 6).map((bet, i) => (
                    <button
                      key={bet.id}
                      onClick={() => loadSavedBet(bet)}
                      className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border/40 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all truncate max-w-[140px]"
                    >
                      {bet.label || bet.strategy || `#${i + 1}`}
                    </button>
                  ))}
                  {savedBets.length > 6 && (
                    <span className="text-[10px] text-muted-foreground self-center">+{savedBets.length - 6}</span>
                  )}
                </div>
              </div>
            )}

            {/* Number grid */}
            <AnimatePresence>
              {showGrid && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="grid gap-1 sm:gap-1.5 p-3 rounded-xl bg-muted/20 border border-border/30"
                    style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: maxNumbers }, (_, i) => i + 1).map(n => {
                      const isSelected = selectedNumbers.includes(n);
                      return (
                        <motion.button
                          key={n}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleGridNumber(n)}
                          className={`aspect-square rounded-md text-[10px] sm:text-xs font-mono font-bold flex items-center justify-center transition-all border ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30"
                              : "bg-card/60 text-foreground/70 border-border/40 hover:bg-primary/10 hover:border-primary/30"
                          }`}
                        >
                          {String(n).padStart(2, "0")}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected numbers with counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{selectedNumbers.length}/{pick} números</span>
                {selectedNumbers.length > 0 && (
                  <button onClick={clear} className="text-[10px] text-destructive hover:text-destructive/80 transition-colors">Limpar tudo</button>
                )}
              </div>
              <Progress value={(selectedNumbers.length / pick) * 100} className="h-1" />
              <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                <AnimatePresence mode="popLayout">
                  {selectedNumbers.map(n => (
                    <motion.button
                      key={n} layout initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      className="lottery-ball text-xs w-8 h-8 relative group cursor-pointer"
                      onClick={() => removeNumber(n)}
                    >
                      {String(n).padStart(2, "0")}
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-2.5 h-2.5" />
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {selectedNumbers.length === 0 && (
                  <span className="text-xs text-muted-foreground/60 py-2 italic">Nenhum número selecionado</span>
                )}
              </div>
            </div>

            {/* Prize tier summary */}
            <AnimatePresence>
              {results && tierSummary.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2">
                  {tierSummary.filter(t => t.count > 0).map(tier => (
                    <motion.div key={tier.label} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                      className="rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 p-2.5 sm:p-3 text-center"
                    >
                      <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent mx-auto mb-1" />
                      <p className="text-base sm:text-lg font-bold font-mono text-accent">{tier.count}x</p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">{tier.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results list */}
            <AnimatePresence>
              {results && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {results.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Nenhum acerto nos {draws.length} concursos</p>
                    </div>
                  )}
                  {results.slice(0, 30).map((r, i) => (
                    <motion.div key={r.concurso} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors"
                    >
                      <div className="text-xs min-w-[60px] sm:min-w-[80px]">
                        <span className="font-mono font-medium text-foreground">#{r.concurso}</span>
                        <span className="text-muted-foreground ml-1 text-[9px] sm:text-[10px] hidden sm:inline">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Trophy className="w-3 h-3 text-accent" />
                        <span className="text-xs font-bold text-accent">{r.matchCount}</span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 ml-auto">
                        {r.matchedNumbers.map(n => (
                          <span key={n} className="lottery-ball text-[9px] w-5 h-5">{String(n).padStart(2, "0")}</span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ========== TAB: PERFORMANCE ========== */}
        {activeTab === "performance" && (
          <div className="space-y-3 sm:space-y-4">
            {/* Last draw info */}
            {lastDraw && (
              <div className="rounded-lg bg-accent/5 border border-accent/15 p-2.5 sm:p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-foreground">
                    Último sorteio: <span className="font-mono text-accent">#{lastDraw.concurso}</span>
                    {lastDraw.date && <span className="text-muted-foreground ml-1">({lastDraw.date})</span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {lastDraw.numbers.map(n => (
                    <span key={n} className="text-[9px] sm:text-[10px] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono font-bold bg-accent/15 text-accent border border-accent/30">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Matching rule indicator */}
            {(() => {
              const rules: Record<string, { badge: string; title: string; desc: string }> = {
                megasena: { badge: "6", title: "Mega Sena — Interseção (6 de 60)", desc: "Aposta 6 números de 1 a 60. Faixas: Sena (6), Quina (5), Quadra (4)." },
                lotofacil: { badge: "15", title: "Lotofácil — Interseção (15 de 25)", desc: "Aposta 15 números de 1 a 25. Faixas: 15 a 11 acertos." },
                quina: { badge: "5", title: "Quina — Interseção (5 de 80)", desc: "Aposta 5 números de 1 a 80. Faixas: Quina (5) a Duque (2)." },
                lotomania: { badge: "20", title: "Lotomania — Interseção (máx. 20)", desc: "Aposta 50 de 0 a 99. Sorteio: 20. Faixas: 20 a 15 + prêmio 0." },
                duplasena: { badge: "2x", title: "Dupla Sena — Interseção (6 de 50)", desc: "Dois sorteios por concurso. Faixas: Sena a Terno." },
                timemania: { badge: "7", title: "Timemania — Interseção (máx. 7)", desc: "Aposta 10 de 1 a 80. Sorteio: 7. Faixas: 7 a 3." },
                diadesorte: { badge: "7", title: "Dia de Sorte — Interseção (7 de 31)", desc: "Aposta 7 de 1 a 31. Faixas: 7 a 4." },
                supersete: { badge: "P", title: "Super Sete — Posicional", desc: "1 dígito por coluna, 7 colunas. Acertos = posições iguais." },
              };
              const rule = rules[lotteryId] || rules.megasena;
              return (
                <div className="flex items-start gap-2 text-[9px] sm:text-[10px] rounded-lg px-2.5 sm:px-3 py-2 border border-border/20 bg-muted/30">
                  <div className="w-5 h-5 shrink-0 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary">{rule.badge}</span>
                  </div>
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-semibold">{rule.title}</span> — {rule.desc}
                  </span>
                </div>
              );
            })()}

            <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {[1, 10, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setDrawRange(n)}
                    className={`text-[10px] sm:text-[11px] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border transition-all font-medium ${
                      drawRange === n
                        ? "border-primary bg-primary/15 text-primary shadow-sm shadow-primary/10"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {n === 1 ? "Último" : `${n} jogos`}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5">
                {savedBets.length > 0 && (
                  <Button size="sm" variant="outline" onClick={runCheckAll} className="text-[10px] sm:text-xs gap-1 h-7 sm:h-8 border-border/50">
                    <ListChecks className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Conferir Todas
                  </Button>
                )}
                <Button size="sm" onClick={runPerformanceCheck} className="text-[10px] sm:text-xs gap-1 shadow-md h-7 sm:h-8">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Analisar
                </Button>
              </div>
            </div>

            {/* Draw range info */}
            {selectedDraws.length > 0 && (
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-2.5 sm:px-3 py-2 border border-border/20">
                <BarChart3 className="w-3 h-3 shrink-0" />
                <span>
                  Concursos{" "}
                  <span className="font-mono text-foreground">#{selectedDraws[selectedDraws.length - 1]?.concurso}</span>
                  {" a "}
                  <span className="font-mono text-foreground">#{selectedDraws[0]?.concurso}</span>
                  {" "}({selectedDraws.length} sorteios)
                </span>
              </div>
            )}

            {/* Global summary */}
            <AnimatePresence>
              {globalSummary && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    <StatCard icon={Target} label="Score médio" value={globalSummary.avgScore} />
                    <StatCard icon={Trophy} label="Melhor acerto" value={globalSummary.bestOverall} />
                    <StatCard icon={Award} label="Premiações" value={`${globalSummary.totalPrizeHits}x`} />
                    <StatCard icon={DollarSign} label="Total estimado" value={formatCurrency(globalSummary.totalPrize)} accent />
                  </div>
                  {/* Trend summary */}
                  {(globalSummary.trendsUp > 0 || globalSummary.trendsDown > 0) && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      {globalSummary.trendsUp > 0 && (
                        <span className="flex items-center gap-1 text-green-400">
                          <ArrowUp className="w-3 h-3" /> {globalSummary.trendsUp} em alta
                        </span>
                      )}
                      {globalSummary.trendsDown > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <ArrowDown className="w-3 h-3" /> {globalSummary.trendsDown} em baixa
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Performance cards */}
            {performances.length > 0 && (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {performances.map((perf, i) => {
                  const isExpanded = expandedPerf === i;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="rounded-xl bg-card/60 border border-border/30 overflow-hidden hover:border-border/60 transition-colors"
                    >
                      <button className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 text-left" onClick={() => setExpandedPerf(isExpanded ? null : i)}>
                        <div className="shrink-0">
                          {i < 3 ? <span className="text-base sm:text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                            : <span className="text-xs font-mono text-muted-foreground w-6 text-center">#{i + 1}</span>}
                        </div>
                        <ScoreRing score={perf.score} size={38} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] sm:text-xs font-semibold text-foreground truncate">{perf.label}</p>
                            {perf.trend && perf.recentAvg !== undefined && perf.previousAvg !== undefined && (
                              <TrendBadge trend={perf.trend} recentAvg={perf.recentAvg} previousAvg={perf.previousAvg} />
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                              Média: <span className="text-foreground font-mono">{perf.avgHits}</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                              Melhor: <span className="text-accent font-mono">{perf.bestHit}</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                              Prêmios: <span className="text-green-400 font-mono">{perf.prizeHits}x</span>
                            </span>
                          </div>
                        </div>
                        {perf.totalPrizeValue > 0 && (
                          <span className="text-[10px] sm:text-xs font-bold text-primary font-mono shrink-0">{perf.totalPrize}</span>
                        )}
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-3 sm:px-3.5 pb-3 sm:pb-3.5 space-y-3 border-t border-border/20 pt-3">
                              {/* Numbers with last draw match */}
                              <div className="flex items-center gap-2">
                                <div className="flex flex-wrap gap-1">
                                  {perf.numbers.map(n => {
                                    const lastDrawResult = perf.results[0];
                                    const isHitLastDraw = lastDrawResult?.matched.includes(n) || false;
                                    return (
                                      <span key={n} className={`text-[9px] sm:text-[10px] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono font-bold ${
                                        isHitLastDraw
                                          ? "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-sm shadow-destructive/30"
                                          : "lottery-ball"
                                      }`}>{String(n).padStart(2, "0")}</span>
                                    );
                                  })}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); copyNumbers(perf.numbers); }}
                                  className="ml-auto p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" title="Copiar números">
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Drawn numbers from last draw */}
                              {perf.results[0] && (
                                <div className="space-y-1">
                                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                    Sorteados no #{perf.results[0].concurso}:
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedDraws[0]?.numbers.map(n => {
                                      const isInBet = perf.numbers.includes(n);
                                      return (
                                        <span key={n} className={`text-[8px] sm:text-[9px] w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-mono ${
                                          isInBet
                                            ? "bg-destructive/15 text-destructive border border-destructive/30 font-bold"
                                            : "bg-muted/30 text-muted-foreground border border-border/20"
                                        }`}>{String(n).padStart(2, "0")}</span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Hit distribution bar */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground">Distribuição de acertos</span>
                                <div className="flex gap-0.5 h-4 sm:h-5 rounded-md overflow-hidden bg-muted/30">
                                  {perf.results.map((r, ri) => (
                                    <div key={ri} className={`transition-all ${r.prize ? "bg-primary/60" : r.hits > 0 ? "bg-primary/30" : "bg-muted/20"}`}
                                      style={{ width: `${100 / perf.results.length}%` }}
                                      title={`#${r.concurso}: ${r.hits} acertos${r.prize ? ` → ${r.prize}` : ""}`}
                                    />
                                  ))}
                                </div>
                              </div>

                              {/* Prize details with real values */}
                              {perf.results.some(r => r.prize) && (
                                <div className="space-y-1">
                                  <span className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Prêmios conquistados
                                  </span>
                                  {perf.results.filter(r => r.prize).map(r => (
                                    <div key={`p-${r.concurso}`} className="flex items-center justify-between text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-primary" />
                                        <span className="text-muted-foreground font-mono">#{r.concurso}</span>
                                        <span className="text-foreground">{r.hits} acertos</span>
                                      </div>
                                      <div className="text-right">
                                        {r.realPrize ? (
                                          <span className="font-semibold text-green-400">{r.realPrize}</span>
                                        ) : (
                                          <span className="font-semibold text-primary">{r.prize}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Per-draw mini chips */}
                              <div className="flex gap-1 flex-wrap">
                                {perf.results.filter(r => r.hits > 0).slice(0, 20).map(r => (
                                  <span key={r.concurso} className={`text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded font-mono ${
                                    r.prize ? "bg-primary/15 text-primary border border-primary/20" : "bg-muted/40 text-muted-foreground border border-border/20"
                                  }`}>#{r.concurso}:{r.hits}</span>
                                ))}
                                {perf.results.filter(r => r.hits > 0).length > 20 && (
                                  <span className="text-[7px] sm:text-[8px] text-muted-foreground py-0.5">+{perf.results.filter(r => r.hits > 0).length - 20} mais</span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {performances.length === 0 && (
              <div className="text-center py-8 sm:py-10 text-muted-foreground border border-dashed border-border/30 rounded-xl">
                <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-3 opacity-30" />
                <p className="text-[11px] sm:text-xs font-medium">Analise a performance das suas apostas</p>
                <p className="text-[9px] sm:text-[10px] mt-1 opacity-60">Selecione o range e clique em "Analisar"</p>
              </div>
            )}
          </div>
        )}

        {/* ========== TAB: AI IMPROVEMENTS ========== */}
        {activeTab === "improve" && (
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                A IA analisa suas apostas e sugere ajustes para <strong className="text-foreground">maximizar acertos</strong>
              </p>
              <Button size="sm" onClick={requestAIImprovements} disabled={loadingAI} className="text-[10px] sm:text-xs gap-1.5 shrink-0 shadow-md h-7 sm:h-8">
                {loadingAI ? <><Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" /> Analisando...</>
                  : <><Brain className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Sugerir Melhorias</>}
              </Button>
            </div>

            {loadingAI && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-10 sm:py-12 gap-4">
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-primary/15 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center"><Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" /></div>
                </div>
                <div className="text-center">
                  <p className="text-[11px] sm:text-xs text-foreground font-medium">IA analisando...</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">Processando padrões e gerando melhorias</p>
                </div>
              </motion.div>
            )}

            {!loadingAI && aiImprovements.length > 0 && (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {aiImprovements.map((imp, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-3 sm:p-4 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-bold text-foreground flex-1">Melhoria #{i + 1}</span>
                      <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-medium border border-green-500/20">
                        {imp.expectedGain}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Original</p>
                        <div className="flex flex-wrap gap-1">
                          {imp.original.map(n => {
                            const removed = !imp.suggested.includes(n);
                            return (
                              <span key={n} className={`text-[9px] sm:text-[10px] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-mono border ${
                                removed ? "bg-destructive/15 text-destructive border-destructive/30 line-through" : "bg-muted/40 text-foreground/70 border-border/30"
                              }`}>{String(n).padStart(2, "0")}</span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <p className="text-[9px] sm:text-[10px] text-primary font-medium flex items-center gap-1 uppercase tracking-wider">
                          <ArrowUpRight className="w-3 h-3" /> Sugerida
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {imp.suggested.map(n => {
                            const added = !imp.original.includes(n);
                            return (
                              <span key={n} className={`lottery-ball text-[9px] sm:text-[10px] w-5 h-5 sm:w-6 sm:h-6 ${
                                added ? "ring-2 ring-green-400/60 ring-offset-1 ring-offset-background" : ""
                              }`}>{String(n).padStart(2, "0")}</span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 p-2 sm:p-2.5 rounded-lg bg-muted/20 border border-border/20">
                      <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">{imp.reason}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-[9px] sm:text-[10px] h-7 gap-1 flex-1" onClick={() => copyNumbers(imp.suggested)}>
                        <Copy className="w-3 h-3" /> Copiar
                      </Button>
                      <Button size="sm" variant="outline" className="text-[9px] sm:text-[10px] h-7 gap-1 flex-1 border-primary/20 text-primary hover:bg-primary/10"
                        onClick={() => saveBet({ numbers: imp.suggested, strategy: "IA Otimizada", label: `Melhoria IA #${i + 1}` })}>
                        <Save className="w-3 h-3" /> Salvar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loadingAI && aiImprovements.length === 0 && (
              <div className="text-center py-8 sm:py-10 text-muted-foreground border border-dashed border-primary/15 rounded-xl">
                <Brain className="w-7 h-7 sm:w-8 sm:h-8 mx-auto mb-3 opacity-30" />
                <p className="text-[11px] sm:text-xs font-medium">
                  {performances.length > 0 ? 'Clique em "Sugerir Melhorias" para otimizar' : "Analise a performance primeiro"}
                </p>
                <p className="text-[9px] sm:text-[10px] mt-1 opacity-60">A IA manterá ~60% dos seus números originais</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
