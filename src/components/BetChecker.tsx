import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { DrawResult } from "@/data/lotteries";
import { checkBetAgainstDraws, MatchResult, getPrizeTiers } from "@/services/lotteryApi";
import { DrawResultWithPrizes, DrawPrizeData } from "@/hooks/useLotteryDraws";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Trophy, X, TrendingUp, Zap, Brain, Loader2,
  BarChart3, Target, ArrowUpRight, ChevronDown, ChevronUp,
  Award, DollarSign, Sparkles, CheckCircle2, AlertTriangle,
  Copy, Save, Grid3X3, ArrowDown, ArrowUp, Minus, ListChecks,
  FileDown, RotateCcw, Hash, Eye, Dice1, Info, Eraser, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { generateNativeImprovements } from "@/engine/native-analysis";
import { computeFrequencyStats } from "@/engine/statistics";
import { useSavedBets, SavedBet } from "@/hooks/useSavedBets";
import { Progress } from "@/components/ui/progress";
import { BetHitsChart } from "@/components/BetHitsChart";
import { Badge } from "@/components/ui/badge";

// ─── Types ───

interface Props {
  draws: DrawResult[];
  drawsWithPrizes?: DrawResultWithPrizes[];
  lotteryId: string;
  maxNumbers: number;
  pick: number;
}

interface ExtendedMatchResult extends MatchResult {
  secondDrawHits: number;
  secondDrawMatched: number[];
  secondDrawNumbers: number[];
  bestMatchCount: number;
}

interface PerfResult {
  concurso: number; date: string; hits: number; matched: number[]; prize: string; prizeValue: number; realPrize?: string;
  secondHits?: number; secondMatched?: number[]; secondPrize?: string; secondPrizeValue?: number;
  bestHits?: number;
}

interface BetPerformance {
  numbers: number[];
  label: string;
  results: PerfResult[];
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

interface AIImprovement {
  original: number[];
  suggested: number[];
  reason: string;
  expectedGain: string;
}

// ─── Helpers ───

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
    megasena: { 6: { value: 50000000, label: "Sena (~R$50M)" }, 5: { value: 40000, label: "Quina (~R$40k)" }, 4: { value: 800, label: "Quadra (~R$800)" } },
    lotofacil: { 15: { value: 1500000, label: "15 pts (~R$1.5M)" }, 14: { value: 2000, label: "14 pts (~R$2k)" }, 13: { value: 35, label: "13 pts (R$35)" }, 12: { value: 14, label: "12 pts (R$14)" }, 11: { value: 7, label: "11 pts (R$7)" } },
    quina: { 5: { value: 5000000, label: "Quina (~R$5M)" }, 4: { value: 6000, label: "Quadra (~R$6k)" }, 3: { value: 150, label: "Terno (~R$150)" }, 2: { value: 5, label: "Duque (~R$5)" } },
    lotomania: { 20: { value: 3000000, label: "20 pts (~R$3M)" }, 19: { value: 50000, label: "19 pts (~R$50k)" }, 18: { value: 2000, label: "18 pts (~R$2k)" }, 17: { value: 200, label: "17 pts (~R$200)" }, 16: { value: 30, label: "16 pts (~R$30)" }, 15: { value: 6, label: "15 pts (R$6)" }, 0: { value: 6, label: "0 pts (R$6)" } },
    duplasena: { 6: { value: 3000000, label: "Sena (~R$3M)" }, 5: { value: 5000, label: "Quina (~R$5k)" }, 4: { value: 100, label: "Quadra (~R$100)" }, 3: { value: 3, label: "Terno (~R$3)" } },
    timemania: { 7: { value: 8000000, label: "7 pts (~R$8M)" }, 6: { value: 50000, label: "6 pts (~R$50k)" }, 5: { value: 1000, label: "5 pts (~R$1k)" }, 4: { value: 10, label: "4 pts (~R$10)" }, 3: { value: 3, label: "3 pts (R$3)" } },
    diadesorte: { 7: { value: 1000000, label: "7 pts (~R$1M)" }, 6: { value: 5000, label: "6 pts (~R$5k)" }, 5: { value: 100, label: "5 pts (~R$100)" }, 4: { value: 5, label: "4 pts (~R$5)" } },
    supersete: { 7: { value: 1000000, label: "7 pts (~R$1M)" }, 6: { value: 50000, label: "6 pts (~R$50k)" }, 5: { value: 1000, label: "5 pts (~R$1k)" }, 4: { value: 10, label: "4 pts (~R$10)" }, 3: { value: 3, label: "3 pts (R$3)" } },
  };
  return prizes[lotteryId]?.[hits] || null;
}

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

function getLotteryHint(lotteryId: string): string | null {
  switch (lotteryId) {
    case "supersete": return "Super Sete: conferência posicional — cada coluna é comparada individualmente.";
    case "lotomania": return "Lotomania: acertar 0 números também dá prêmio!";
    case "duplasena": return "Dupla Sena: conferência automática do 1º e 2º sorteio.";
    default: return null;
  }
}

function getGridCols(lotteryId: string, maxNumbers: number): { desktop: number; mobile: number } {
  if (lotteryId === "supersete") return { desktop: 10, mobile: 5 };
  if (lotteryId === "lotomania") return { desktop: 10, mobile: 8 };
  if (maxNumbers <= 10) return { desktop: 5, mobile: 5 };
  if (maxNumbers <= 25) return { desktop: 5, mobile: 5 };
  if (maxNumbers <= 31) return { desktop: 8, mobile: 6 };
  if (maxNumbers <= 50) return { desktop: 10, mobile: 8 };
  return { desktop: 10, mobile: 8 };
}

// ─── Sub Components ───

function SelectionProgressRing({ current, total }: { current: number; total: number }) {
  const size = 52;
  const strokeWidth = 3.5;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? current / total : 0;
  const offset = circumference - pct * circumference;
  const isComplete = current === total;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} opacity={0.4} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={isComplete ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
          strokeWidth={strokeWidth} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={current}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-sm font-bold font-mono leading-none ${isComplete ? "text-primary" : "text-foreground"}`}
        >
          {current}
        </motion.span>
        <span className="text-[8px] text-muted-foreground leading-none mt-0.5">/{total}</span>
      </div>
    </div>
  );
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

/* ─── Draw comparison block (for 1st/2nd draw) ─── */
function DrawComparisonBlock({
  label, bet, drawnNumbers, matched, hits, maxHits, pct, prize, realPrize, hasLotomania0Prize, lotteryId
}: {
  label?: string; bet: number[]; drawnNumbers: number[]; matched: number[];
  hits: number; maxHits: number; pct: number;
  prize: { value: number; label: string } | null; realPrize?: string;
  hasLotomania0Prize: boolean; lotteryId: string;
}) {
  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{label}</Badge>
          <span className="text-xs font-bold text-foreground">{hits} de {maxHits} acertos</span>
          {prize && <span className="text-[10px] text-primary font-semibold">🎉 Premiado!</span>}
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Aproveitamento{label ? ` (${label})` : ""}</span>
          <span className="font-mono font-bold text-foreground">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${prize ? "bg-gradient-to-r from-primary to-primary/70" : hits > 0 ? "bg-muted-foreground/60" : "bg-destructive/50"}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Seus números {lotteryId === "supersete" && <span className="normal-case text-primary">(posicional)</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {bet.map((n, idx) => {
            const isMatch = lotteryId === "supersete" ? (drawnNumbers[idx] === n) : matched.includes(n);
            return (
              <motion.span
                key={`${n}-${idx}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-all ${
                  isMatch
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/20"
                    : "bg-muted/50 text-muted-foreground border-border/50"
                }`}
              >
                {String(n).padStart(2, "0")}
              </motion.span>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Números sorteados</p>
        <div className="flex flex-wrap gap-1.5">
          {drawnNumbers.map((n, idx) => {
            const isMatch = lotteryId === "supersete" ? (bet[idx] === n) : matched.includes(n);
            return (
              <span
                key={`${n}-${idx}`}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border ${
                  isMatch
                    ? "bg-primary/15 text-primary border-primary/40 font-black"
                    : "bg-card text-foreground/60 border-border/30"
                }`}
              >
                {String(n).padStart(2, "0")}
              </span>
            );
          })}
        </div>
      </div>

      {(prize || hasLotomania0Prize) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
        >
          <DollarSign className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1">
            {realPrize ? (
              <><p className="text-xs font-bold text-primary">{realPrize}</p><p className="text-[10px] text-muted-foreground">Valor real do concurso</p></>
            ) : (
              <><p className="text-xs font-bold text-primary">{prize?.label || "Prêmio (R$6)"}</p><p className="text-[10px] text-muted-foreground">Estimativa de prêmio</p></>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ─── Quick Check Result Card ─── */
function QuickCheckResult({
  bet, draw, lotteryId, onClose, prizeTiers
}: {
  bet: number[]; draw: DrawResult; lotteryId: string; onClose: () => void;
  prizeTiers?: DrawPrizeData | null;
}) {
  const { hits, matched } = matchBetAgainstDraw(bet, draw.numbers, lotteryId);
  const prize = getEstimatedPrize(lotteryId, hits);
  const realPrize = getRealPrizeLabel(prizeTiers, hits);
  const maxHits = getMaxPossibleHits(lotteryId, bet.length);
  const pct = maxHits > 0 ? Math.round((hits / maxHits) * 100) : 0;

  const has2ndDraw = lotteryId === "duplasena" && draw.secondDrawNumbers && draw.secondDrawNumbers.length > 0;
  const secondResult = has2ndDraw ? matchBetAgainstDraw(bet, draw.secondDrawNumbers!, lotteryId) : null;
  const secondPrize = secondResult ? getEstimatedPrize(lotteryId, secondResult.hits) : null;
  const secondMaxHits = maxHits;
  const secondPct = secondResult && secondMaxHits > 0 ? Math.round((secondResult.hits / secondMaxHits) * 100) : 0;
  const bestHitsOverall = secondResult ? Math.max(hits, secondResult.hits) : hits;
  const bestPrize = secondResult ? (hits >= (secondResult?.hits ?? 0) ? prize : secondPrize) : prize;
  const hasLotomania0Prize = lotteryId === "lotomania" && hits === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="rounded-xl border-2 overflow-hidden"
      style={{
        borderColor: (bestPrize || hasLotomania0Prize) ? "hsl(var(--primary))" : bestHitsOverall > 0 ? "hsl(var(--border))" : "hsl(var(--destructive) / 0.3)"
      }}
    >
      <div className={`px-4 py-3 flex items-center justify-between ${
        (bestPrize || hasLotomania0Prize) ? "bg-primary/10" : "bg-muted/30"
      }`}>
        <div className="flex items-center gap-3">
          {(bestPrize || hasLotomania0Prize) ? (
            <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
              className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </motion.div>
          ) : bestHitsOverall > 0 ? (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Target className="w-5 h-5 text-muted-foreground" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="w-5 h-5 text-destructive" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-foreground">
              {has2ndDraw ? `1º: ${hits} | 2º: ${secondResult!.hits} de ${maxHits}` : `${hits} de ${maxHits} acertos`}
              {(bestPrize || hasLotomania0Prize) && <span className="ml-2">🎉</span>}
            </p>
            <p className="text-[11px] text-muted-foreground">Concurso #{draw.concurso} — {draw.date}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <DrawComparisonBlock label={has2ndDraw ? "1º Sorteio" : undefined} bet={bet} drawnNumbers={draw.numbers} matched={matched} hits={hits} maxHits={maxHits} pct={pct} prize={prize} realPrize={realPrize} hasLotomania0Prize={hasLotomania0Prize} lotteryId={lotteryId} />
        {has2ndDraw && secondResult && (
          <>
            <div className="border-t border-border/40 pt-3" />
            <DrawComparisonBlock label="2º Sorteio" bet={bet} drawnNumbers={draw.secondDrawNumbers!} matched={secondResult.matched} hits={secondResult.hits} maxHits={secondMaxHits} pct={secondPct} prize={secondPrize} realPrize={undefined} hasLotomania0Prize={false} lotteryId={lotteryId} />
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───

export function BetChecker({ draws, drawsWithPrizes, lotteryId, maxNumbers, pick }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [results, setResults] = useState<ExtendedMatchResult[] | null>(null);
  const [performances, setPerformances] = useState<BetPerformance[]>([]);
  const [aiImprovements, setAiImprovements] = useState<AIImprovement[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [drawRange, setDrawRange] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"quick" | "check" | "performance" | "improve">("quick");
  const [expandedPerf, setExpandedPerf] = useState<number | null>(null);
  const [hasRunPerformance, setHasRunPerformance] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [quickCheckResult, setQuickCheckResult] = useState<{ bet: number[]; draw: DrawResult } | null>(null);

  const { savedBets, saveBet } = useSavedBets(lotteryId);
  const selectedDraws = useMemo(() => draws.slice(0, drawRange), [draws, drawRange]);
  const lastDraw = useMemo(() => draws.length > 0 ? draws[0] : null, [draws]);
  const lotteryHint = useMemo(() => getLotteryHint(lotteryId), [lotteryId]);
  const gridColsConfig = useMemo(() => getGridCols(lotteryId, maxNumbers), [lotteryId, maxNumbers]);

  const prizeDataMap = useMemo(() => {
    if (!drawsWithPrizes) return new Map<number, DrawPrizeData | null>();
    const map = new Map<number, DrawPrizeData | null>();
    drawsWithPrizes.forEach(d => map.set(d.concurso, d.prizeTiers || null));
    return map;
  }, [drawsWithPrizes]);

  const lastDrawPrizeTiers = useMemo(() => {
    if (!lastDraw || !drawsWithPrizes) return null;
    const found = drawsWithPrizes.find(d => d.concurso === lastDraw.concurso);
    return found?.prizeTiers || null;
  }, [lastDraw, drawsWithPrizes]);

  useEffect(() => {
    setSelectedNumbers([]);
    setResults(null);
    setPerformances([]);
    setAiImprovements([]);
    setInputValue("");
    setExpandedPerf(null);
    setHasRunPerformance(false);
    setShowGrid(true);
    setQuickCheckResult(null);
    setActiveTab("quick");
  }, [lotteryId]);

  const performanceRef = useRef({ hasRunPerformance, runPerformanceCheck: () => {} });

  const prizeTiers = getPrizeTiers(lotteryId);
  const minPrizeHits = prizeTiers.length > 0
    ? Math.max(1, Math.min(...prizeTiers.map(t => t.hits).filter(h => h > 0)))
    : 3;

  const handleInput = (val: string) => {
    setInputValue(val);
    const minNum = lotteryId === "lotomania" ? 0 : 1;
    const nums = val.split(/[,\s\-]+/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= minNum && n <= maxNumbers);
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
    const minNum = lotteryId === "lotomania" ? 0 : 1;
    const nums = inputValue.split(/[,\s\-]+/).map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n >= minNum && n <= maxNumbers);
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
    setQuickCheckResult(null);
  };

  const toggleGridNumber = useCallback((n: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n);
      if (prev.length >= pick) { toast.error(`Máximo de ${pick} números`); return prev; }
      return [...prev, n].sort((a, b) => a - b);
    });
    setResults(null);
    setQuickCheckResult(null);
  }, [pick]);

  const loadSavedBet = (bet: SavedBet) => {
    setSelectedNumbers([...bet.numbers]);
    setResults(null);
    setQuickCheckResult(null);
    toast.success(`Aposta "${bet.label || bet.strategy || "salva"}" carregada`);
  };

  const quickCheck = () => {
    if (selectedNumbers.length < 1) { toast.error("Selecione pelo menos 1 número"); return; }
    if (!lastDraw) { toast.error("Nenhum sorteio disponível"); return; }
    setQuickCheckResult({ bet: [...selectedNumbers], draw: lastDraw });
  };

  const check = () => {
    if (selectedNumbers.length < 1) { toast.error("Adicione pelo menos 1 número"); return; }
    const isDupla = lotteryId === "duplasena";
    const matches: ExtendedMatchResult[] = draws.map(draw => {
      const { hits, matched } = matchBetAgainstDraw(selectedNumbers, draw.numbers, lotteryId);
      const second = isDupla && draw.secondDrawNumbers?.length
        ? matchBetAgainstDraw(selectedNumbers, draw.secondDrawNumbers, lotteryId) : null;
      const bestCount = second ? Math.max(hits, second.hits) : hits;
      return {
        concurso: draw.concurso, date: draw.date, drawnNumbers: draw.numbers,
        matchedNumbers: matched, matchCount: hits,
        secondDrawHits: second?.hits ?? 0, secondDrawMatched: second?.matched ?? [],
        secondDrawNumbers: draw.secondDrawNumbers ?? [], bestMatchCount: bestCount,
      };
    }).filter(r => r.bestMatchCount > 0 || (lotteryId === "lotomania" && r.matchCount === 0))
      .sort((a, b) => b.bestMatchCount - a.bestMatchCount);
    setResults(matches);
    setActiveTab("check");
    toast.success(`${matches.length} concursos com acertos encontrados`);
  };

  const clear = () => {
    setSelectedNumbers([]);
    setResults(null);
    setInputValue("");
    setQuickCheckResult(null);
  };

  const copyNumbers = (nums: number[]) => {
    navigator.clipboard.writeText(nums.join(", "));
    toast.success("Números copiados!");
  };

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

  const runPerformanceCheck = useCallback(() => {
    const allBets: { numbers: number[]; label: string }[] = [];
    if (selectedNumbers.length > 0) allBets.push({ numbers: [...selectedNumbers], label: `Seleção atual (${selectedNumbers.length} nº)` });
    savedBets.forEach((bet, i) => allBets.push({ numbers: [...bet.numbers], label: bet.label || bet.strategy || `Aposta salva #${i + 1}` }));
    if (allBets.length === 0) { toast.error("Nenhuma aposta para conferir."); return; }
    if (selectedDraws.length === 0) { toast.error("Nenhum sorteio disponível."); return; }

    const isDupla = lotteryId === "duplasena";
    const maxHits = getMaxPossibleHits(lotteryId, pick);
    const perfs: BetPerformance[] = allBets.map(bet => {
      let totalPrizeValue = 0;
      const betResults: PerfResult[] = selectedDraws.map(draw => {
        const { hits, matched } = matchBetAgainstDraw(bet.numbers, draw.numbers, lotteryId);
        const prizeInfo = getEstimatedPrize(lotteryId, hits);
        if (prizeInfo) totalPrizeValue += prizeInfo.value;
        const realPrize = getRealPrizeLabel(prizeDataMap.get(draw.concurso), hits);

        let secondHits: number | undefined, secondMatched: number[] | undefined, secondPrize: string | undefined, secondPrizeValue: number | undefined;
        let bestHitsForDraw = hits;
        if (isDupla && draw.secondDrawNumbers?.length) {
          const s = matchBetAgainstDraw(bet.numbers, draw.secondDrawNumbers, lotteryId);
          secondHits = s.hits; secondMatched = s.matched;
          const sp = getEstimatedPrize(lotteryId, s.hits);
          if (sp) { secondPrize = sp.label; secondPrizeValue = sp.value; totalPrizeValue += sp.value; }
          bestHitsForDraw = Math.max(hits, s.hits);
        }

        return {
          concurso: draw.concurso, date: draw.date, hits, matched,
          prize: prizeInfo?.label || "", prizeValue: prizeInfo?.value || 0, realPrize,
          secondHits, secondMatched, secondPrize, secondPrizeValue,
          bestHits: isDupla ? bestHitsForDraw : undefined,
        };
      });

      const drawCount = selectedDraws.length;
      const totalHits = betResults.reduce((s, r) => s + r.hits, 0);
      const avgHits = drawCount > 0 ? totalHits / drawCount : 0;
      const bestHit = betResults.length > 0 ? Math.max(...betResults.map(r => r.bestHits ?? r.hits)) : 0;
      const prizeHits = betResults.filter(r => r.prizeValue > 0 || (r.secondPrizeValue && r.secondPrizeValue > 0)).length;
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
  }, [selectedNumbers, savedBets, selectedDraws, lotteryId, pick, prizeDataMap]);

  performanceRef.current = { hasRunPerformance, runPerformanceCheck };

  useEffect(() => {
    if (performanceRef.current.hasRunPerformance && selectedDraws.length > 0) {
      const timer = setTimeout(() => performanceRef.current.runPerformanceCheck(), 50);
      return () => clearTimeout(timer);
    }
  }, [drawRange, selectedDraws]);

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
    { key: "quick" as const, label: "Conferir", icon: Zap, count: quickCheckResult ? 1 : 0 },
    { key: "check" as const, label: "Histórico", icon: Search, count: results?.length ?? 0 },
    { key: "performance" as const, label: "Performance", icon: BarChart3, count: performances.length },
    { key: "improve" as const, label: "IA", icon: Brain, count: aiImprovements.length },
  ];

  const startNum = lotteryId === "lotomania" ? 0 : 1;
  const totalNums = lotteryId === "lotomania" ? maxNumbers + 1 : maxNumbers;
  const isReady = selectedNumbers.length > 0;

  return (
    <div className="rounded-2xl glass-card overflow-hidden">
      {/* ─── Header ─── */}
      <div className="relative p-4 sm:p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <SelectionProgressRing current={selectedNumbers.length} total={pick} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">Conferência de Jogos</h3>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
              {selectedNumbers.length === 0
                ? "Selecione seus números para conferir"
                : selectedNumbers.length < pick
                  ? `Faltam ${pick - selectedNumbers.length} número${pick - selectedNumbers.length > 1 ? "s" : ""}`
                  : "✓ Jogo completo — pronto para conferir!"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {savedBets.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {savedBets.length} salvas
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* ─── Lottery hint ─── */}
      {lotteryHint && (
        <div className="mx-4 sm:mx-5 mb-3 flex items-start gap-2 p-2.5 rounded-lg bg-accent/5 border border-accent/15 text-[10px] text-accent">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{lotteryHint}</span>
        </div>
      )}

      {/* ─── Number Input Area ─── */}
      <div className="px-4 sm:px-5 space-y-3">
        {/* Input + grid toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={inputValue}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addFromInput()}
              placeholder={`${startNum === 0 ? "0, 5, 12" : "5, 12, 23"}... (${selectedNumbers.length}/${pick})`}
              className="bg-muted/30 border-border/40 text-sm pl-9 h-11 rounded-xl focus:border-primary/50"
            />
          </div>
          <Button
            size="icon"
            variant={showGrid ? "default" : "outline"}
            onClick={() => setShowGrid(!showGrid)}
            className="shrink-0 h-11 w-11 rounded-xl"
            title="Grade visual"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Saved bets quick load */}
        {savedBets.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">Carregar aposta salva:</span>
            <div className="flex gap-1.5 flex-wrap">
              {savedBets.slice(0, 8).map((bet, i) => (
                <motion.button
                  key={bet.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => loadSavedBet(bet)}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg border border-border/40 bg-card/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all truncate max-w-[130px] shadow-sm"
                >
                  {bet.label || bet.strategy || `#${i + 1}`}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Number Grid */}
        <AnimatePresence>
          {showGrid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div
                className="number-checker-grid grid gap-1 sm:gap-1.5 p-3 rounded-xl bg-muted/15 border border-border/20"
                style={{ gridTemplateColumns: `repeat(${gridColsConfig.mobile}, minmax(0, 1fr))` }}
              >
                <style>{`
                  @media (min-width: 641px) {
                    .number-checker-grid { grid-template-columns: repeat(${gridColsConfig.desktop}, minmax(0, 1fr)) !important; }
                  }
                `}</style>
                {Array.from({ length: totalNums }, (_, i) => i + startNum).map(n => {
                  const isSelected = selectedNumbers.includes(n);
                  const isInLastDraw = lastDraw?.numbers.includes(n);
                  return (
                    <motion.button
                      key={n}
                      whileTap={{ scale: 0.88 }}
                      whileHover={{ scale: 1.08 }}
                      onClick={() => toggleGridNumber(n)}
                      className={`relative aspect-square rounded-lg text-[10px] sm:text-xs font-mono font-bold flex items-center justify-center transition-all border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 z-10"
                          : "bg-card/80 text-foreground/70 border-border/30 hover:bg-primary/10 hover:border-primary/30"
                      }`}
                    >
                      {String(n).padStart(2, "0")}
                      {isInLastDraw && !isSelected && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border border-background" />
                      )}
                      {isSelected && (
                        <motion.span
                          layoutId={`selected-ring-${n}`}
                          className="absolute inset-0 rounded-lg ring-2 ring-primary/40"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 mt-2 px-1 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary" /> Selecionado
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent" /> Último sorteio
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected numbers display */}
        <AnimatePresence>
          {selectedNumbers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2.5 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {selectedNumbers.length}/{pick} selecionados
                  </span>
                  {selectedNumbers.length === pick && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[9px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded"
                    >
                      ✓ Completo
                    </motion.span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => copyNumbers(selectedNumbers)} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors p-1 rounded-md hover:bg-primary/5">
                    <Copy className="w-3 h-3" /> Copiar
                  </button>
                  <button onClick={clear} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors p-1 rounded-md hover:bg-destructive/5">
                    <Eraser className="w-3 h-3" /> Limpar
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center p-2 rounded-xl bg-muted/10 border border-border/20">
                <AnimatePresence mode="popLayout">
                  {selectedNumbers.map(n => (
                    <motion.button
                      key={n} layout initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="lottery-ball text-xs w-8 h-8 relative group cursor-pointer hover:ring-2 hover:ring-destructive/30 transition-all"
                      onClick={() => removeNumber(n)}
                    >
                      {String(n).padStart(2, "0")}
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                        <X className="w-2.5 h-2.5" />
                      </span>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap pb-1">
          <Button
            onClick={quickCheck}
            disabled={selectedNumbers.length < 1 || !lastDraw}
            className="flex-1 gap-2 gradient-brand text-primary-foreground shadow-lg h-11 rounded-xl text-sm font-semibold"
          >
            <Play className="w-4 h-4" />
            Conferir
          </Button>
          <Button
            onClick={check}
            disabled={selectedNumbers.length < 1}
            variant="outline"
            className="gap-2 h-11 rounded-xl"
          >
            <Search className="w-4 h-4" />
            Histórico
          </Button>
          {savedBets.length > 0 && (
            <Button onClick={runCheckAll} variant="outline" className="gap-2 h-11 rounded-xl">
              <ListChecks className="w-4 h-4" />
              Salvas
            </Button>
          )}
        </div>
      </div>

      {/* Quick check result */}
      <AnimatePresence>
        {quickCheckResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 sm:px-5 pt-3"
          >
            <QuickCheckResult
              bet={quickCheckResult.bet}
              draw={quickCheckResult.draw}
              lotteryId={lotteryId}
              onClose={() => setQuickCheckResult(null)}
              prizeTiers={lastDrawPrizeTiers}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Tab navigation ─── */}
      <div className="px-4 sm:px-5 pt-4">
        <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/20">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-card text-foreground shadow-md border border-border/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.key ? "text-primary" : ""}`} />
              <span className="text-[10px] sm:text-[11px] font-medium">{tab.label}</span>
              {tab.count > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold px-1"
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </motion.span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="p-4 sm:p-5 pt-3">
        <AnimatePresence mode="wait">
          {/* ========== TAB: QUICK ========== */}
          {activeTab === "quick" && (
            <motion.div key="quick" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div className="space-y-3">
                {lastDraw && (
                  <div className="rounded-xl bg-accent/5 border border-accent/15 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                          <Target className="w-4 h-4 text-accent" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          Último: <span className="font-mono text-accent">#{lastDraw.concurso}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{lastDraw.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {lastDraw.numbers.map((n, idx) => (
                        <motion.span
                          key={`${n}-${idx}`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-mono font-bold bg-accent/15 text-accent border border-accent/30 shadow-sm"
                        >
                          {String(n).padStart(2, "0")}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNumbers.length === 0 && !quickCheckResult && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-10 text-muted-foreground border border-dashed border-border/30 rounded-xl bg-muted/5"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <Dice1 className="w-7 h-7 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">Selecione seus números</p>
                    <p className="text-[11px] mt-1.5 opacity-60 max-w-[220px] mx-auto">Use a grade acima ou digite os números para começar</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========== TAB: CHECK ========== */}
          {activeTab === "check" && (
            <motion.div key="check" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div className="space-y-3">
                <AnimatePresence>
                  {results && tierSummary.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-2">
                      {tierSummary.filter(t => t.count > 0).map(tier => (
                        <motion.div key={tier.label} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                          className="rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 p-3 text-center"
                        >
                          <Trophy className="w-4 h-4 text-accent mx-auto mb-1" />
                          <p className="text-lg font-bold font-mono text-accent">{tier.count}x</p>
                          <p className="text-[9px] text-muted-foreground">{tier.label}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {results && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                      {results.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                          <p className="text-xs">Nenhum acerto nos {draws.length} concursos</p>
                        </div>
                      )}
                      {results.slice(0, 50).map((r, i) => {
                        const isDupla = lotteryId === "duplasena" && r.secondDrawNumbers.length > 0;
                        return (
                          <motion.div key={r.concurso} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.015 }}
                            className="p-3 rounded-xl bg-card/40 border border-border/20 hover:bg-card/70 hover:border-border/40 transition-all space-y-1.5"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-xs min-w-[70px]">
                                <span className="font-mono font-medium text-foreground">#{r.concurso}</span>
                                <span className="text-muted-foreground ml-1 text-[10px] hidden sm:inline">{r.date}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Trophy className="w-3 h-3 text-accent" />
                                <span className="text-sm font-bold text-accent">
                                  {isDupla ? `${r.matchCount}|${r.secondDrawHits}` : r.matchCount}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-0.5 ml-auto">
                                {r.matchedNumbers.map((n, idx) => (
                                  <span key={`${n}-${idx}`} className="lottery-ball text-[9px] w-5 h-5">{String(n).padStart(2, "0")}</span>
                                ))}
                              </div>
                            </div>
                            {isDupla && r.secondDrawHits > 0 && (
                              <div className="flex items-center gap-3 pl-[70px]">
                                <Badge variant="outline" className="text-[8px] px-1.5 py-0">2º</Badge>
                                <span className="text-[10px] text-muted-foreground font-mono">{r.secondDrawHits} acertos</span>
                                <div className="flex flex-wrap gap-0.5 ml-auto">
                                  {r.secondDrawMatched.map((n, idx) => (
                                    <span key={`s-${n}-${idx}`} className="lottery-ball text-[9px] w-5 h-5 opacity-80">{String(n).padStart(2, "0")}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!results && (
                  <div className="text-center py-10 text-muted-foreground border border-dashed border-border/30 rounded-xl bg-muted/5">
                    <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-7 h-7 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">Confira contra todo o histórico</p>
                    <p className="text-[11px] mt-1.5 opacity-60">Selecione números e clique "Histórico"</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========== TAB: PERFORMANCE ========== */}
          {activeTab === "performance" && (
            <motion.div key="perf" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    {[1, 10, 50, 100].map(n => (
                      <button
                        key={n}
                        onClick={() => setDrawRange(n)}
                        className={`text-[10px] px-3.5 py-2 rounded-lg border transition-all font-medium ${
                          drawRange === n
                            ? "border-primary bg-primary/15 text-primary shadow-sm"
                            : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                      >
                        {n === 1 ? "Último" : `${n} jogos`}
                      </button>
                    ))}
                  </div>
                  <Button size="sm" onClick={runPerformanceCheck} className="text-xs gap-1.5 shadow-md rounded-lg h-9">
                    <TrendingUp className="w-3.5 h-3.5" /> Analisar
                  </Button>
                </div>

                {selectedDraws.length > 0 && performances.length > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 border border-border/15">
                    <BarChart3 className="w-3 h-3 shrink-0" />
                    <span>
                      Concursos <span className="font-mono text-foreground">#{selectedDraws[selectedDraws.length - 1]?.concurso}</span>
                      {" a "}<span className="font-mono text-foreground">#{selectedDraws[0]?.concurso}</span>
                      {" "}({selectedDraws.length})
                    </span>
                  </div>
                )}

                <AnimatePresence>
                  {globalSummary && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { icon: Target, label: "Score médio", value: globalSummary.avgScore },
                          { icon: Trophy, label: "Melhor acerto", value: globalSummary.bestOverall, accent: true },
                          { icon: Award, label: "Premiações", value: `${globalSummary.totalPrizeHits}x` },
                          { icon: DollarSign, label: "Total estimado", value: formatCurrency(globalSummary.totalPrize), accent: true },
                        ].map(s => (
                          <div key={s.label} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                            s.accent ? "bg-primary/10 border-primary/20" : "bg-muted/20 border-border/20"
                          }`}>
                            <s.icon className={`w-4 h-4 ${s.accent ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-sm font-bold font-mono ${s.accent ? "text-primary" : "text-foreground"}`}>{s.value}</span>
                            <span className="text-[9px] text-muted-foreground text-center">{s.label}</span>
                          </div>
                        ))}
                      </div>
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

                {performances.length > 0 && (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {performances.map((perf, i) => {
                      const isExpanded = expandedPerf === i;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="rounded-xl bg-card/50 border border-border/25 overflow-hidden hover:border-border/50 transition-all"
                        >
                          <button className="w-full flex items-center gap-2 sm:gap-3 p-3.5 text-left" onClick={() => setExpandedPerf(isExpanded ? null : i)}>
                            <div className="shrink-0">
                              {i < 3 ? <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                                : <span className="text-xs font-mono text-muted-foreground w-6 text-center">#{i + 1}</span>}
                            </div>
                            <ScoreRing score={perf.score} size={38} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-foreground truncate">{perf.label}</p>
                                {perf.trend && perf.recentAvg !== undefined && perf.previousAvg !== undefined && (
                                  <TrendBadge trend={perf.trend} recentAvg={perf.recentAvg} previousAvg={perf.previousAvg} />
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[10px] text-muted-foreground">Média: <span className="text-foreground font-mono">{perf.avgHits}</span></span>
                                <span className="text-[10px] text-muted-foreground">Melhor: <span className="text-accent font-mono">{perf.bestHit}</span></span>
                                <span className="text-[10px] text-muted-foreground">Prêmios: <span className="text-green-400 font-mono">{perf.prizeHits}x</span></span>
                              </div>
                            </div>
                            {perf.totalPrizeValue > 0 && (
                              <span className="text-xs font-bold text-primary font-mono shrink-0">{perf.totalPrize}</span>
                            )}
                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            </motion.div>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/20 pt-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex flex-wrap gap-1">
                                      {perf.numbers.map((n, idx) => {
                                        const lastDrawResult = perf.results[0];
                                        const isHitLastDraw = lastDrawResult?.matched.includes(n) || false;
                                        return (
                                          <span key={`${n}-${idx}`} className={`text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold ${
                                            isHitLastDraw
                                              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/30"
                                              : "lottery-ball"
                                          }`}>{String(n).padStart(2, "0")}</span>
                                        );
                                      })}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); copyNumbers(perf.numbers); }}
                                      className="ml-auto p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" title="Copiar">
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      Distribuição de acertos{lotteryId === "duplasena" ? " (melhor dos 2 sorteios)" : ""}
                                    </span>
                                    <div className="flex gap-0.5 h-6 rounded-lg overflow-hidden bg-muted/20">
                                      {perf.results.map((r, ri) => {
                                        const best = r.bestHits ?? r.hits;
                                        const hasPrize = r.prize || r.secondPrize;
                                        return (
                                          <div key={ri} className={`transition-all rounded-sm ${hasPrize ? "bg-primary/60" : best > 0 ? "bg-primary/25" : "bg-muted/15"}`}
                                            style={{ width: `${100 / perf.results.length}%` }}
                                            title={`#${r.concurso}: 1º ${r.hits}${r.secondHits !== undefined ? ` | 2º ${r.secondHits}` : ""} acertos${hasPrize ? " → Premiado!" : ""}`}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <BetHitsChart results={perf.results} avgHits={perf.avgHits} pick={pick} />

                                  {perf.results.some(r => r.prize || r.secondPrize) && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" /> Prêmios conquistados
                                      </span>
                                      {perf.results.filter(r => r.prize || r.secondPrize).map(r => (
                                        <div key={`p-${r.concurso}`} className="space-y-1">
                                          {r.prize && (
                                            <div className="flex items-center justify-between text-[10px] px-2.5 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                                              <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                                <span className="text-muted-foreground font-mono">#{r.concurso}</span>
                                                {r.secondPrize && <Badge variant="outline" className="text-[7px] px-1 py-0">1º</Badge>}
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
                                          )}
                                          {r.secondPrize && (
                                            <div className="flex items-center justify-between text-[10px] px-2.5 py-1.5 rounded-lg bg-accent/5 border border-accent/10">
                                              <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-3 h-3 text-accent" />
                                                <span className="text-muted-foreground font-mono">#{r.concurso}</span>
                                                <Badge variant="outline" className="text-[7px] px-1 py-0">2º</Badge>
                                                <span className="text-foreground">{r.secondHits} acertos</span>
                                              </div>
                                              <span className="font-semibold text-accent">{r.secondPrize}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
                  <div className="text-center py-10 text-muted-foreground border border-dashed border-border/30 rounded-xl bg-muted/5">
                    <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-7 h-7 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">Analise a performance das suas apostas</p>
                    <p className="text-[11px] mt-1.5 opacity-60">Selecione o range e clique em "Analisar"</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========== TAB: AI ========== */}
          {activeTab === "improve" && (
            <motion.div key="improve" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    A IA analisa suas apostas e sugere ajustes para <strong className="text-foreground">maximizar acertos</strong>
                  </p>
                  <Button size="sm" onClick={requestAIImprovements} disabled={loadingAI} className="text-xs gap-1.5 shrink-0 shadow-md rounded-lg h-9">
                    {loadingAI ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando...</>
                      : <><Brain className="w-3.5 h-3.5" /> Melhorar</>}
                  </Button>
                </div>

                {loadingAI && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-14 gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-primary/15 border-t-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center"><Brain className="w-6 h-6 text-primary animate-pulse" /></div>
                    </div>
                    <p className="text-xs text-foreground font-medium">IA analisando padrões...</p>
                  </motion.div>
                )}

                {!loadingAI && aiImprovements.length > 0 && (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    {aiImprovements.map((imp, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-xs font-bold text-foreground flex-1">Melhoria #{i + 1}</span>
                          <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-500">
                            {imp.expectedGain}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Original</p>
                            <div className="flex flex-wrap gap-1">
                              {imp.original.map((n, idx) => {
                                const removed = !imp.suggested.includes(n);
                                return (
                                  <span key={`${n}-${idx}`} className={`text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-mono border ${
                                    removed ? "bg-destructive/15 text-destructive border-destructive/30 line-through" : "bg-muted/40 text-foreground/70 border-border/30"
                                  }`}>{String(n).padStart(2, "0")}</span>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] text-primary font-medium flex items-center gap-1 uppercase tracking-wider">
                              <ArrowUpRight className="w-3 h-3" /> Sugerida
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {imp.suggested.map((n, idx) => {
                                const added = !imp.original.includes(n);
                                return (
                                  <span key={`${n}-${idx}`} className={`lottery-ball text-[10px] w-6 h-6 ${
                                    added ? "ring-2 ring-green-400/60 ring-offset-1 ring-offset-background" : ""
                                  }`}>{String(n).padStart(2, "0")}</span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/20">
                          <Target className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{imp.reason}</p>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-[10px] h-7 gap-1 flex-1" onClick={() => copyNumbers(imp.suggested)}>
                            <Copy className="w-3 h-3" /> Copiar
                          </Button>
                          <Button size="sm" variant="outline" className="text-[10px] h-7 gap-1 flex-1 border-primary/20 text-primary hover:bg-primary/10"
                            onClick={() => saveBet({ numbers: imp.suggested, strategy: "IA Otimizada", label: `Melhoria IA #${i + 1}` })}>
                            <Save className="w-3 h-3" /> Salvar
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!loadingAI && aiImprovements.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground border border-dashed border-primary/15 rounded-xl bg-muted/5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-7 h-7 opacity-30" />
                    </div>
                    <p className="text-sm font-medium">Nenhuma sugestão ainda</p>
                    <p className="text-[11px] mt-1.5 opacity-60">Clique em "Melhorar" para analisar</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
