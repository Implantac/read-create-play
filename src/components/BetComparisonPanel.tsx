import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, GitCompare, X, Award, DollarSign, Target, 
  BarChart3, CheckCircle2, Copy, TrendingUp, ArrowRight,
  Sparkles, Zap, ShieldCheck, ExternalLink, Calendar,
  Medal, Info, Filter, Hash, RefreshCcw, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BetHitsChart } from "./BetHitsChart";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";
import { PerfResult, BetPerformance } from "@/types/bet-analysis";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
}

function MetricBox({ label, value, icon: Icon, isBest, colorClass, suffix = "", tooltip }: { 
  label: string; value: string | number; icon: any; isBest?: boolean; colorClass?: string; suffix?: string; tooltip?: string
}) {
  const content = (
    <div className={`p-3 rounded-xl border transition-all relative overflow-hidden h-full flex flex-col justify-center ${
      isBest 
        ? "bg-primary/10 border-primary/40 shadow-sm shadow-primary/10" 
        : "bg-muted/50 border-border/50"
    }`}>
      {isBest && (
        <motion.div 
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1"
        >
          <div className="bg-primary text-primary-foreground p-1 rounded-bl-lg shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        </motion.div>
      )}
      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
        <Icon className={`w-3 h-3 ${isBest ? "text-primary" : ""}`} /> {label}
      </p>
      <p className={`text-sm font-bold font-mono ${isBest ? "text-primary scale-105" : colorClass || "text-foreground"} transition-all`}>
        {value}{suffix}
      </p>
    </div>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">{content}</div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[200px] text-center">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
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

    const metrics = bets.map(b => {
      // Cálculo de consistência: Frequência de acertos acima de 40% do total de números
      const threshold = Math.ceil(pick * 0.4);
      const consistency = b.results.length > 0 
        ? b.results.filter(r => (r.bestHits ?? r.hits) >= threshold).length / b.results.length 
        : 0;

      return {
        avgHits: b.avgHits,
        bestHit: b.bestHit,
        prizeHits: b.prizeHits,
        totalPrize: b.totalPrizeValue,
        consistency: consistency,
        score: b.score
      };
    });

    const findMaxIndices = (field: keyof typeof metrics[0]) => {
      const vals = metrics.map(m => m[field]);
      const maxVal = Math.max(...vals);
      if (maxVal === 0 && (field === 'prizeHits' || field === 'totalPrize')) return []; 
      return metrics.reduce((acc, curr, idx) => (curr[field] === maxVal ? [...acc, idx] : acc), [] as number[]);
    };

    return {
      avgHits: findMaxIndices("avgHits"),
      bestHit: findMaxIndices("bestHit"),
      prizeHits: findMaxIndices("prizeHits"),
      totalPrize: findMaxIndices("totalPrize"),
      consistency: findMaxIndices("consistency"),
      score: findMaxIndices("score"),
      metrics: metrics
    };
  }, [bets, pick]);

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
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center ring-2 ring-primary/10">
              <GitCompare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Comparativo Detalhado</h2>
              <p className="text-xs text-muted-foreground">{bets.length} combinações selecionadas • {lotteryId.toUpperCase()}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scrollbar-thin">
          {/* Stats Grid Side-by-Side */}
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className="flex gap-4 min-w-max pb-2">
              {bets.map((bet, i) => {
                const isBestScore = highlights?.score.includes(i);
                const isBestAvg = highlights?.avgHits.includes(i);
                const isBestHit = highlights?.bestHit.includes(i);
                const isBestPrize = highlights?.prizeHits.includes(i);
                const isBestConsistency = highlights?.consistency.includes(i);
                const consistencyVal = highlights?.metrics[i].consistency || 0;

                return (
                  <div key={i} className={`p-5 rounded-2xl border-2 transition-all w-[300px] shrink-0 relative ${
                    isBestScore ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border/50 bg-card"
                  }`}>
                    {isBestScore && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="gradient-brand shadow-md border-none px-3 py-1 flex items-center gap-1.5 animate-bounce">
                          <Medal className="w-3.5 h-3.5 text-yellow-300" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Melhor Opção</span>
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {isBestScore && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Aposta #{i + 1}
                        </span>
                      </div>
                      <Badge variant={isBestScore ? "default" : "secondary"} className={`font-mono ${isBestScore ? "gradient-brand" : ""}`}>
                        Score: {bet.score}
                      </Badge>
                    </div>

                    <h3 className="font-bold text-sm mb-4 truncate pr-2" title={bet.label}>{bet.label}</h3>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <MetricBox 
                        label="Média" 
                        value={bet.avgHits.toFixed(2)} 
                        icon={Target} 
                        isBest={isBestAvg} 
                        tooltip="Média de acertos em todos os sorteios analisados"
                      />
                      <MetricBox 
                        label="Recorde" 
                        value={bet.bestHit} 
                        icon={Award} 
                        isBest={isBestHit} 
                        colorClass="text-accent"
                        tooltip="Maior pontuação já atingida por este jogo"
                      />
                      <MetricBox 
                        label="Prêmios" 
                        value={bet.prizeHits} 
                        icon={CheckCircle2} 
                        isBest={isBestPrize} 
                        colorClass="text-green-400"
                        suffix="x"
                        tooltip="Número de vezes que este jogo foi premiado"
                      />
                      <MetricBox 
                        label="Consistência" 
                        value={Math.round(consistencyVal * 100)} 
                        icon={ShieldCheck} 
                        isBest={isBestConsistency} 
                        colorClass="text-blue-400"
                        suffix="%"
                        tooltip="Frequência com que o jogo atinge ao menos 40% dos acertos"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-0.5">Retorno Total Estimado</p>
                        <p className="text-sm font-bold text-primary font-mono">{bet.totalPrize}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-primary" />
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
                );
              })}
            </div>
          </div>

          {/* Differences Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-primary" />
              Análise de Divergência de Dezenas
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-border bg-card/50">
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
                                <CheckCircle2 className={`w-4 h-4 ${commonNumbers.includes(n) ? "text-primary scale-110" : "text-green-400"}`} />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center opacity-5">
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
                <CheckCircle2 className="w-3 h-3 text-primary" /> Dezenas comuns (interseção)
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-400" /> Dezenas exclusivas
              </span>
            </div>
          </div>

          {/* Métrica de Consistência - Explicação */}
          <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold">Entenda a Métrica de Consistência</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold border-blue-500/30 text-blue-400 uppercase">Fórmula</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Limiar de 40%</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Um jogo é considerado "consistente" em um sorteio quando atinge ao menos <strong className="text-foreground">40% das dezenas</strong> necessárias para o prêmio máximo. 
                  Para a {lotteryId.toUpperCase()}, isso equivale a <strong className="text-foreground">{Math.ceil(pick * 0.4)} ou mais acertos</strong>.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold border-blue-500/30 text-blue-400 uppercase">Dados</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amostra Utilizada</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A porcentagem é extraída de uma base de <strong className="text-foreground">{bets[0]?.results.length || 0} sorteios</strong> reais. 
                  Esta amostra garante que a métrica reflita o comportamento histórico real e não apenas eventos isolados.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] font-bold border-blue-500/30 text-blue-400 uppercase">Objetivo</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">O que isso indica?</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quanto maior a porcentagem, mais <strong className="text-foreground">estável</strong> é o jogo. Jogos com alta consistência tendem a manter uma base de acertos frequente, 
                  reduzindo a dependência de um único sorteio atípico.
                </p>
              </div>
            </div>
          </div>

          {/* Ranking & Performance History */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Ranking e Histórico de Consistência
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {bets.map((bet, i) => {
                  const threshold = Math.ceil(pick * 0.4);
                  
                  // Calcular sequências consecutivas (streaks)
                  const sortedForStreaks = [...bet.results].sort((a, b) => a.concurso - b.concurso);
                  let currentStreak: number[] = [];
                  let allStreaks: number[][] = [];
                  
                  for (const r of sortedForStreaks) {
                    const hits = r.bestHits ?? r.hits;
                    if (hits >= threshold) {
                      if (currentStreak.length === 0 || r.concurso === currentStreak[currentStreak.length - 1] + 1) {
                        currentStreak.push(r.concurso);
                      } else {
                        if (currentStreak.length > 0) allStreaks.push(currentStreak);
                        currentStreak = [r.concurso];
                      }
                    } else {
                      if (currentStreak.length > 0) allStreaks.push(currentStreak);
                      currentStreak = [];
                    }
                  }
                  if (currentStreak.length > 0) allStreaks.push(currentStreak);
                  
                  const maxStreakLen = allStreaks.length > 0 ? Math.max(...allStreaks.map(s => s.length)) : 0;
                  const streakContests = new Set(
                    allStreaks
                      .filter(s => s.length === maxStreakLen && maxStreakLen > 1)
                      .flat()
                  );

                  const consistencyDraws = bet.results
                    .filter(r => (r.bestHits ?? r.hits) >= threshold)
                    .sort((a, b) => b.concurso - a.concurso);

                  return (
                    <div key={i} className="p-5 rounded-2xl border border-border bg-card/50 flex flex-col hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/40">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">{bet.label}</span>
                          <span className="text-[10px] text-muted-foreground">Threshold: {threshold} acertos</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
                            {consistencyDraws.length} sorteios consistentes
                          </Badge>
                          {maxStreakLen > 1 && (
                            <Badge variant="outline" className="text-[9px] bg-orange-500/10 text-orange-400 border-orange-500/20">
                              🔥 Maior Sequência: {maxStreakLen}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Top Hits */}
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-accent" /> Melhores Resultados
                          </p>
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

                        {/* Consistency Sample */}
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-400" /> Amostra Consistente
                          </p>
                          <div className="max-h-[180px] overflow-y-auto pr-2 scrollbar-thin space-y-1.5">
                            {consistencyDraws.length === 0 ? (
                              <p className="text-[10px] text-muted-foreground italic py-2 text-center">Nenhum concurso atingiu o limiar de 40%.</p>
                            ) : (
                              consistencyDraws.map((r, ri) => {
                                const googleLink = `https://www.google.com/search?q=resultado+loteria+${lotteryId}+concurso+${r.concurso}`;
                                const isStreak = streakContests.has(r.concurso);
                                
                                return (
                                  <div 
                                    key={ri} 
                                    className={`flex items-center justify-between text-[10px] p-2 rounded-lg border transition-all group ${
                                      isStreak 
                                        ? "bg-orange-500/5 border-orange-500/20 shadow-sm" 
                                        : "bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/10"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`font-mono font-bold ${isStreak ? "text-orange-400" : "text-blue-400"}`}>
                                        #{r.concurso}
                                      </span>
                                      <span className="opacity-50 flex items-center gap-1">
                                        <Calendar className="w-2.5 h-2.5" /> {r.date}
                                      </span>
                                      {isStreak && (
                                        <Badge variant="outline" className="text-[8px] bg-orange-500/10 text-orange-400 border-orange-500/20 h-4 px-1 leading-none">
                                          🔥 SEQ
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`font-bold ${isStreak ? "text-orange-300" : ""}`}>
                                        {r.bestHits ?? r.hits} acertos
                                      </span>
                                      <a 
                                        href={googleLink} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`p-1 rounded-md transition-colors ${
                                          isStreak 
                                            ? "hover:bg-orange-500/20 text-orange-400" 
                                            : "hover:bg-primary/20 text-muted-foreground hover:text-primary"
                                        }`}
                                        title="Revisar resultado no Google"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-6">
                <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sticky top-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-sm font-bold">Veredito da IA</h4>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed mb-4 space-y-3">
                    <p>
                      Com base nas métricas históricas, o jogo <strong className="text-foreground">{bets[highlights?.score[0] || 0].label}</strong> 
                      apresenta a melhor combinação de score ({bets[highlights?.score[0] || 0].score}) e estabilidade.
                    </p>
                    {highlights?.consistency.length && highlights.consistency.length > 0 && (
                      <p className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" /> 
                        <span>Destaque em consistência: <strong>{bets[highlights.consistency[0]].label}</strong>.</span>
                      </p>
                    )}
                    {commonNumbers.length > 0 && (
                      <p className="flex items-start gap-2">
                        <Target className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>Há uma convergência de <strong>{commonNumbers.length} dezenas</strong> comuns, reforçando a validade do núcleo escolhido.</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-3 pt-4 border-t border-primary/10">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Confiabilidade dos Dados</span>
                      <span className="font-bold text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Alta
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Volatilidade Estimada</span>
                      <span className="font-bold">Baixa</span>
                    </div>
                  </div>
                  <Button className="mt-6 w-full gap-2 gradient-brand shadow-lg shadow-primary/20 py-5 rounded-xl text-sm font-black uppercase tracking-wider" size="sm">
                    Utilizar Recomendação <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-muted/20 border border-border text-[10px] text-muted-foreground italic leading-relaxed">
                  * A análise utiliza dados retroativos reais. O "Score" é uma métrica ponderada que considera média de acertos, prêmios históricos e consistência.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-xl px-8">Fechar Comparativo</Button>
        </div>
      </div>
    </motion.div>
  );
}
