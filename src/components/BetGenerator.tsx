import { useState, useMemo } from "react";
import { NumberStats, generateSmartBet } from "@/engine/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { evaluateBetQuality, BetQualityReport } from "@/engine/bet-quality";
import { GameAnalysisBlock } from "@/components/GameAnalysisBlock";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, Copy, Check, ChevronRight, TrendingUp, Shield, Zap, BarChart3, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelectedBets } from "@/contexts/SelectedBetsContext";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws?: DrawResult[];
  onSaveBet?: (numbers: number[], strategy?: string, score?: number, grade?: string) => void;
}

interface ScoredBet {
  numbers: number[];
  report: BetQualityReport;
  insights: string[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-green-500/10 border-green-500/30";
  if (score >= 60) return "bg-yellow-500/10 border-yellow-500/30";
  if (score >= 40) return "bg-orange-500/10 border-orange-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function getGradeBg(grade: string): string {
  if (grade === "S") return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white";
  if (grade === "A") return "bg-green-500/90 text-white";
  if (grade === "B") return "bg-blue-500/90 text-white";
  if (grade === "C") return "bg-yellow-500/90 text-white";
  return "bg-muted text-muted-foreground";
}

function generateInsights(report: BetQualityReport): string[] {
  const insights: string[] = [];

  // Pick top strengths
  report.strengths.slice(0, 2).forEach(s => insights.push(`✅ ${s}`));

  // Pick top warning if no strengths
  if (insights.length === 0 && report.warnings.length > 0) {
    insights.push(`⚠️ ${report.warnings[0]}`);
  }

  // Add dimension-based insight
  const sorted = [...report.dimensions].sort((a, b) => b.score - a.score);
  if (sorted[0] && sorted[0].score >= 80 && insights.length < 3) {
    insights.push(`📊 ${sorted[0].name}: ${sorted[0].score}/100`);
  }

  // Add overall assessment
  if (report.overall >= 75 && insights.length < 3) {
    insights.push("🎯 Jogo bem distribuído e equilibrado");
  } else if (report.overall < 45 && insights.length < 3) {
    insights.push("⚠️ Considere gerar novamente para melhor equilíbrio");
  }

  // Ensure at least 2 insights
  if (insights.length < 2) {
    const parity = report.dimensions.find(d => d.name === "Equilíbrio Par/Ímpar");
    if (parity) insights.push(`📊 ${parity.detail}`);
  }

  return insights.slice(0, 3);
}

function generateSmartFiltered(stats: NumberStats[], pick: number, draws: DrawResult[], config: LotteryConfig, minScore: number = 40): ScoredBet {
  let best: ScoredBet | null = null;

  for (let attempt = 0; attempt < 50; attempt++) {
    const numbers = generateSmartBet(stats, pick);
    const report = evaluateBetQuality(numbers, stats, config, draws);

    if (!best || report.overall > best.report.overall) {
      best = { numbers, report, insights: generateInsights(report) };
    }

    if (report.overall >= minScore) break;
  }

  return best!;
}

export function BetGenerator({ stats, config, draws = [], onSaveBet }: Props) {
  const [bets, setBets] = useState<ScoredBet[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [generating, setGenerating] = useState(false);
  const { toggleBet, isBetMarked } = useSelectedBets();

  const avgScore = useMemo(() => {
    if (bets.length === 0) return 0;
    return Math.round(bets.reduce((s, b) => s + b.report.overall, 0) / bets.length);
  }, [bets]);

  const generate = (count: number) => {
    setGenerating(true);
    // Use requestAnimationFrame for visual feedback
    requestAnimationFrame(() => {
      const newBets: ScoredBet[] = [];
      for (let i = 0; i < count; i++) {
        newBets.push(generateSmartFiltered(stats, config.pick, draws, config, 50));
      }
      // Sort by score descending
      newBets.sort((a, b) => b.report.overall - a.report.overall);
      setBets(newBets);
      setStep(2);
      setGenerating(false);
    });
  };

  const regenerateSingle = (index: number) => {
    const newBet = generateSmartFiltered(stats, config.pick, draws, config, 50);
    setBets(prev => {
      const updated = [...prev];
      updated[index] = newBet;
      return updated;
    });
    toast.success("Jogo regenerado!");
  };

  const copyBet = (bet: number[], index: number) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(index);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-xl glass-card p-3 sm:p-5 space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-foreground">Gerador de Apostas Inteligentes</h3>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
            Gere apostas com melhor distribuição estatística
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${step >= 1 ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border/50"}`}>
          <Zap className="w-3 h-3" />
          <span>Gerar</span>
        </div>
        <ChevronRight className="w-3 h-3" />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${step >= 2 ? "bg-primary/10 border-primary/30 text-primary font-medium" : "border-border/50"}`}>
          <BarChart3 className="w-3 h-3" />
          <span>Resultados</span>
        </div>
      </div>

      {/* Generate Buttons */}
      <div className="flex flex-wrap gap-2">
        {[1, 3, 5, 10].map(n => (
          <Button
            key={n}
            variant="outline"
            size="sm"
            onClick={() => generate(n)}
            disabled={generating}
            className="text-xs border-border/50 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${generating ? "animate-spin" : ""}`} />
            {n} jogo{n > 1 ? "s" : ""} inteligente{n > 1 ? "s" : ""}
          </Button>
        ))}
      </div>

      {/* Summary Bar */}
      <AnimatePresence>
        {bets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between p-3 rounded-lg border ${getScoreBg(avgScore)}`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${getScoreColor(avgScore)}`} />
              <span className="text-xs font-medium text-foreground">
                Média dos jogos: <span className={`font-bold ${getScoreColor(avgScore)}`}>{avgScore}/100</span>
              </span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {bets.length} jogo{bets.length > 1 ? "s" : ""} gerado{bets.length > 1 ? "s" : ""}
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Smart Cards */}
      <AnimatePresence mode="wait">
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {bets.map((bet, i) => (
            <motion.div
              key={`${i}-${bet.numbers.join(",")}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-colors space-y-3"
            >
              {/* Card Header: Checkbox + Rank + Score + Grade */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isBetMarked(bet.numbers)}
                    onCheckedChange={() => toggleBet({ numbers: bet.numbers, label: `Gerador #${i + 1} (${bet.report.grade})` })}
                    className="h-4 w-4"
                  />
                  <span className="text-xs text-muted-foreground font-mono">#{i + 1}</span>
                  <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getGradeBg(bet.report.grade)}`}>
                    {bet.report.grade}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-lg font-bold tabular-nums ${getScoreColor(bet.report.overall)}`}>
                      {bet.report.overall}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>

              {/* Score Bar */}
              <Progress value={bet.report.overall} className="h-1.5" />

              {/* Numbers */}
              <div className="flex flex-wrap gap-1.5">
                {bet.numbers.map(n => (
                  <span key={n} className="lottery-ball text-xs w-8 h-8">
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>

              {/* Insights */}
              <div className="space-y-1 pt-1 border-t border-border/30">
                {bet.insights.map((insight, j) => (
                  <p key={j} className="text-[11px] text-muted-foreground leading-relaxed">
                    {insight}
                  </p>
                ))}
              </div>

              {/* AI Analysis Block */}
              <GameAnalysisBlock numbers={bet.numbers} stats={stats} config={config} draws={draws} />

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => regenerateSingle(i)}
                  className="h-7 text-[10px] text-muted-foreground hover:text-primary px-2"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Gerar novamente
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyBet(bet.numbers, i)}
                  className="h-7 text-[10px] text-muted-foreground hover:text-primary px-2"
                >
                  {copied === i ? <Check className="w-3 h-3 mr-1 text-primary" /> : <Copy className="w-3 h-3 mr-1" />}
                  Copiar
                </Button>
                {onSaveBet && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onSaveBet(bet.numbers, "Gerador Inteligente", bet.report.overall, bet.report.grade);
                      toast.success("Aposta salva!");
                    }}
                    className="h-7 text-[10px] text-muted-foreground hover:text-primary px-2"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Salvar
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Empty State */}
      {bets.length === 0 && (
        <div className="text-center py-10 text-muted-foreground border border-dashed border-border/30 rounded-lg space-y-2">
          <Sparkles className="w-8 h-8 mx-auto opacity-30" />
          <p className="text-sm font-medium">Gere apostas com distribuição otimizada</p>
          <p className="text-[11px]">Cada jogo é pontuado de 0 a 100 com base em equilíbrio, dispersão e padrões</p>
        </div>
      )}

      {/* Compliance */}
      <p className="text-[9px] text-muted-foreground/60 text-center leading-relaxed">
        Análise estatística para fins educacionais. Não garante premiação.
      </p>
    </div>
  );
}
