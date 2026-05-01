import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, GitCompare, X, Award, DollarSign, Target, 
  BarChart3, CheckCircle2, Copy, TrendingUp, ArrowRight,
  Sparkles, Zap, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BetHitsChart } from "./BetHitsChart";
import { toast } from "sonner";
import { useMemo } from "react";

interface PerfResult {
  concurso: number;
  date: string;
  hits: number;
  matched: number[];
  prize: string;
  prizeValue: number;
  realPrize?: string;
  secondHits?: number;
  secondMatched?: number[];
  secondPrize?: string;
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
}

interface Props {
  bets: BetPerformance[];
  onClose: () => void;
  lotteryId: string;
  pick: number;
}

export function BetComparisonPanel({ bets, onClose, lotteryId, pick }: Props) {
  const copyNumbers = (nums: number[]) => {
    navigator.clipboard.writeText(nums.join(", "));
    toast.success("Números copiados!");
  };

  // Comparação de dezenas
  const allNumbers = Array.from(new Set(bets.flatMap(b => b.numbers))).sort((a, b) => a - b);
  
  // Encontrar números em comum
  const commonNumbers = allNumbers.filter(n => bets.every(b => b.numbers.includes(n)));

  // Calcular métricas de destaque
  const highlights = useMemo(() => {
    if (bets.length === 0) return null;

    const getConsistency = (bet: BetPerformance) => {
      if (bet.results.length === 0) return 0;
      const mean = bet.avgHits;
      const variance = bet.results.reduce((acc, r) => acc + Math.pow((r.bestHits ?? r.hits) - mean, 2), 0) / bet.results.length;
      return 1 / (1 + Math.sqrt(variance)); // Quanto maior, mais consistente (menor desvio)
    };

    const metrics = bets.map(b => ({
      avgHits: b.avgHits,
      bestHit: b.bestHit,
      prizeHits: b.prizeHits,
      totalPrize: b.totalPrizeValue,
      consistency: getConsistency(b),
      score: b.score
    }));

    // Função para encontrar todos os índices que empatam no máximo
    const findMaxIndices = (field: keyof typeof metrics[0]) => {
      const maxVal = Math.max(...metrics.map(m => m[field] as number));
      return metrics.reduce((acc, curr, idx) => (curr[field] === maxVal ? [...acc, idx] : acc), [] as number[]);
    };

    return {
      avgHits: findMaxIndices("avgHits"),
      bestHit: findMaxIndices("bestHit"),
      prizeHits: findMaxIndices("prizeHits"),
      totalPrize: findMaxIndices("totalPrize"),
      consistency: findMaxIndices("consistency"),
      score: findMaxIndices("score"),
    };
  }, [bets]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm"
    >
      <div className="bg-card w-full max-w-5xl max-h-[90vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <GitCompare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Comparativo de Jogos</h2>
              <p className="text-xs text-muted-foreground">{bets.length} combinações selecionadas</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
          {/* Stats Grid Side-by-Side */}
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="flex gap-4 min-w-max pb-2">
              {bets.map((bet, i) => (
                <div key={i} className={`p-5 rounded-2xl border-2 transition-all w-[300px] shrink-0 ${
                  i === 0 ? "border-primary/30 bg-primary/5 shadow-lg shadow-primary/5" : "border-border/50 bg-card"
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Trophy className="w-4 h-4 text-primary" />}
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {i === 0 ? "Melhor Rank" : `Opção #${i + 1}`}
                    </span>
                  </div>
                  <Badge variant={i === 0 ? "default" : "secondary"} className="font-mono">
                    Score: {bet.score}
                  </Badge>
                </div>

                <h3 className="font-bold text-sm mb-4 truncate" title={bet.label}>{bet.label}</h3>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Target className="w-3 h-3" /> Média
                    </p>
                    <p className="text-sm font-bold font-mono">{bet.avgHits.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Award className="w-3 h-3" /> Recorde
                    </p>
                    <p className="text-sm font-bold font-mono text-accent">{bet.bestHit}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Prêmios
                    </p>
                    <p className="text-sm font-bold font-mono text-green-400">{bet.prizeHits}x</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Total
                    </p>
                    <p className="text-sm font-bold font-mono text-primary">{bet.totalPrize}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Composição</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyNumbers(bet.numbers)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bet.numbers.map(n => (
                      <span 
                        key={n} 
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors ${
                          commonNumbers.includes(n) 
                            ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                            : "bg-muted/50 text-foreground border-border"
                        }`}
                        title={commonNumbers.includes(n) ? "Número presente em todos os jogos comparados" : ""}
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50">
                  <BetHitsChart results={bet.results} avgHits={bet.avgHits} pick={pick} />
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* Differences Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary" />
              Análise de Divergência de Dezenas
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="p-3 text-[10px] font-bold uppercase text-muted-foreground">Número</th>
                    {bets.map((bet, i) => (
                      <th key={i} className="p-3 text-[10px] font-bold uppercase text-muted-foreground border-l border-border min-w-[120px]">
                        {bet.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allNumbers.map(n => (
                    <tr key={n} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs font-bold bg-muted/10">
                        {String(n).padStart(2, "0")}
                      </td>
                      {bets.map((bet, i) => {
                        const hasNum = bet.numbers.includes(n);
                        return (
                          <td key={i} className={`p-3 border-l border-border/50 text-center`}>
                            {hasNum ? (
                              <div className="flex items-center justify-center">
                                <CheckCircle2 className={`w-4 h-4 ${commonNumbers.includes(n) ? "text-primary" : "text-green-400"}`} />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center opacity-10">
                                <X className="w-3 h-3" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground px-2">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-primary" /> Dezenas comuns
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" /> Dezenas únicas
              </span>
            </div>
          </div>

          {/* Ranking & Performance History */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Ranking de Acertos Históricos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase font-bold px-1">Top Concursos por Jogo</p>
                {bets.map((bet, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-card/50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-foreground">{bet.label}</span>
                      <Badge variant="outline" className="text-[10px]">{bet.prizeHits} prêmios</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {bet.results
                        .filter(r => r.hits > 0)
                        .sort((a, b) => (b.bestHits ?? b.hits) - (a.bestHits ?? a.hits))
                        .slice(0, 3)
                        .map((r, ri) => (
                          <div key={ri} className="flex items-center justify-between text-[10px] p-2 rounded-lg bg-muted/30">
                            <span className="font-mono opacity-60">#{r.concurso}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{r.hits} acertos</span>
                              {r.prize && <span className="text-primary font-bold">🎉</span>}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h4 className="text-sm font-bold">Veredito da Comparação</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  O jogo <strong className="text-foreground">{bets[0].label}</strong> apresenta a maior robustez estatística com score de <strong>{bets[0].score}</strong>. 
                  {commonNumbers.length > 0 && ` Há uma convergência de ${commonNumbers.length} dezenas entre as seleções, o que sugere um núcleo forte de aposta.`}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Potencial de Prêmio</span>
                    <span className="font-bold text-green-400">Alto</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Divergência de Jogos</span>
                    <span className="font-bold">{Math.round((allNumbers.length - commonNumbers.length) / allNumbers.length * 100)}%</span>
                  </div>
                </div>
                <Button className="mt-6 w-full gap-2 gradient-brand shadow-lg shadow-primary/20" size="sm">
                  Utilizar Seleção Vencedora <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Fechar Comparativo</Button>
        </div>
      </div>
    </motion.div>
  );
}
