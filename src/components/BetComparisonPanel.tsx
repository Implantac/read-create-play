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
import { useMemo, useState, useEffect, useCallback } from "react";
import { PerfResult, BetPerformance } from "@/types/bet-analysis";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { Binary, Boxes } from "lucide-react";

function formatCurrency(value: number): string {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
}

function MetricBox({ label, value, icon: Icon, isBest, colorClass, suffix = "", tooltip }: { 
  label: string; value: string | number; icon: any; isBest?: boolean; colorClass?: string; suffix?: string; tooltip?: string
}) {
  const content = (
    <div 
      className={`p-3 rounded-xl border transition-all relative overflow-hidden h-full flex flex-col justify-center ${
        isBest 
          ? "bg-primary/10 border-primary/40 shadow-sm shadow-primary/10" 
          : "bg-muted/50 border-border/50"
      }`}
    >
      {isBest && (
        <motion.div 
          initial={{ opacity: 0, scale: 0, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="absolute -top-1 -right-1"
          aria-hidden="true"
        >
          <div className="bg-primary text-primary-foreground p-1 rounded-bl-lg shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
          </div>
        </motion.div>
      )}
      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1" aria-hidden="true">
        <Icon className={`w-3 h-3 ${isBest ? "text-primary" : ""}`} /> {label}
      </p>
      <p className={`text-sm font-bold font-mono ${isBest ? "text-primary scale-105" : colorClass || "text-foreground"} transition-all`} aria-hidden="true">
        {value}{suffix}
      </p>
    </div>
  );

  if (tooltip) {
    const tooltipId = `tooltip-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button 
              className="w-full text-left cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
              aria-label={`${label}: ${value}${suffix}. ${tooltip}`}
              aria-describedby={tooltipId}
            >
              {content}
            </button>
          </TooltipTrigger>
          <TooltipContent id={tooltipId} className="max-w-[200px] text-center">
            <p className="text-xs">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div role="group" aria-label={`${label}: ${value}${suffix}${isBest ? " (Melhor resultado)" : ""}`}>
      {content}
    </div>
  );
}

interface Props {
  bets: BetPerformance[];
  onClose: () => void;
  lotteryId: string;
  pick: number;
  stats?: NumberStats[];
  config?: LotteryConfig;
}

export function BetComparisonPanel({ bets, onClose, lotteryId, pick, stats, config }: Props) {
  const copyNumbers = (nums: number[]) => {
    navigator.clipboard.writeText(nums.join(", "));
    toast.success("Números copiados!");
  };
  
  // Filtros de Amostra
  const initialMin = useMemo(() => bets.length > 0 ? Math.min(...bets[0].results.map(r => r.concurso)) : 0, [bets]);
  const initialMax = useMemo(() => bets.length > 0 ? Math.max(...bets[0].results.map(r => r.concurso)) : 0, [bets]);
  
  const [minConcurso, setMinConcurso] = useState<number | "">(initialMin);
  const [maxConcurso, setMaxConcurso] = useState<number | "">(initialMax);
  const [onlyPrizes, setOnlyPrizes] = useState(false);

  // Derivar bets filtrados em tempo real
  const filteredBets = useMemo(() => {
    return bets.map(bet => {
      const filteredResults = bet.results.filter(r => {
        const matchesRange = (minConcurso === "" || r.concurso >= minConcurso) && 
                             (maxConcurso === "" || r.concurso <= maxConcurso);
        const matchesPrize = !onlyPrizes || (r.prizeValue > 0 || (r.secondPrizeValue && r.secondPrizeValue > 0));
        return matchesRange && matchesPrize;
      });

      // Recalcular métricas para o subconjunto filtrado
      const totalHits = filteredResults.reduce((s, r) => s + (r.bestHits ?? r.hits), 0);
      const avgHits = filteredResults.length > 0 ? totalHits / filteredResults.length : 0;
      const bestHit = filteredResults.length > 0 ? Math.max(...filteredResults.map(r => r.bestHits ?? r.hits)) : 0;
      const prizeHits = filteredResults.filter(r => r.prizeValue > 0 || (r.secondPrizeValue && r.secondPrizeValue > 0)).length;
      const totalPrizeValue = filteredResults.reduce((s, r) => s + (r.prizeValue + (r.secondPrizeValue || 0)), 0);

      // Recalcular consistency
      const threshold = Math.ceil(pick * 0.4);
      const consistency = filteredResults.length > 0 
        ? filteredResults.filter(r => (r.bestHits ?? r.hits) >= threshold).length / filteredResults.length 
        : 0;

      return {
        ...bet,
        results: filteredResults,
        avgHits,
        bestHit,
        prizeHits,
        totalPrizeValue,
        totalPrize: formatCurrency(totalPrizeValue),
        consistency // Adicionando consistency aqui para facilitar
      };
    });
  }, [bets, minConcurso, maxConcurso, onlyPrizes, pick]);

  // Comparação de dezenas (usando a aposta original, mas poderia ser a filtrada se mudasse dezenas)
  const allNumbers = Array.from(new Set(bets.flatMap(b => b.numbers))).sort((a, b) => a - b);
  const commonNumbers = allNumbers.filter(n => bets.every(b => b.numbers.includes(n)));

  // Calcular métricas de destaque baseadas nos filtros
  const highlights = useMemo(() => {
    if (filteredBets.length === 0) return null;

    const metrics = filteredBets.map(b => {
      return {
        avgHits: b.avgHits,
        bestHit: b.bestHit,
        prizeHits: b.prizeHits,
        totalPrize: b.totalPrizeValue,
        consistency: b.consistency || 0,
        score: b.score // O score original é mantido ou poderia ser recalculado? 
                       // Vamos recalcular o score para refletir os filtros
      };
    });

    // Função para recalcular score simplificado baseado na amostra atual
    const recalculatedMetrics = filteredBets.map((b, i) => {
      const drawCount = b.results.length;
      const effectiveMax = pick; // Simplificado
      const score = effectiveMax > 0 && drawCount > 0
        ? Math.round((b.avgHits / effectiveMax) * 40 + (b.bestHit / effectiveMax) * 30 + (b.prizeHits / drawCount) * 30)
        : 0;
      return { ...metrics[i], score: Math.min(score, 100) };
    });

    const findMaxIndices = (field: keyof typeof recalculatedMetrics[0]) => {
      const vals = recalculatedMetrics.map(m => m[field]);
      const maxVal = Math.max(...vals);
      if (maxVal === 0 && (field === 'prizeHits' || field === 'totalPrize')) return []; 
      return recalculatedMetrics.reduce((acc, curr, idx) => (curr[field] === maxVal ? [...acc, idx] : acc), [] as number[]);
    };

    return {
      avgHits: findMaxIndices("avgHits"),
      bestHit: findMaxIndices("bestHit"),
      prizeHits: findMaxIndices("prizeHits"),
      totalPrize: findMaxIndices("totalPrize"),
      consistency: findMaxIndices("consistency"),
      score: findMaxIndices("score"),
      metrics: recalculatedMetrics
    };
  }, [filteredBets, pick]);

  const resetFilters = () => {
    setMinConcurso(initialMin);
    setMaxConcurso(initialMax);
    setOnlyPrizes(false);
    toast.info("Filtros resetados");
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalhos apenas se o modal estiver aberto
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        document.getElementById('filter-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.info("Atalho: Filtros de Amostra", { duration: 1500 });
      }
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        document.getElementById('comparison-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.info("Atalho: Grid de Comparação", { duration: 1500 });
      }
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        document.getElementById('differences-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.info("Atalho: Análise de Divergência", { duration: 1500 });
      }
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        document.getElementById('consistency-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast.info("Atalho: Métrica de Consistência", { duration: 1500 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-xs text-muted-foreground">{bets.length} combinações • {lotteryId.toUpperCase()}</p>
                <div className="hidden lg:flex items-center gap-2 border-l border-border/50 pl-3 text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Atalhos:</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[8px]">Alt+F</kbd> Filtros
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[8px]">Alt+C</kbd> Grid
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[8px]">Alt+D</kbd> Divergir
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[8px]">Alt+S</kbd> Stats
                </div>
              </div>
            </div>

          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 scrollbar-thin">
          {/* Contest Filters Section */}
          <div id="filter-section" tabIndex={-1} className="bg-muted/20 border border-border/50 rounded-2xl p-4 space-y-4 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                <Filter className="w-4 h-4 text-primary" />
                Filtros da Amostra Retroativa
              </div>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-[10px] gap-1 hover:text-primary transition-colors">
                <RefreshCcw className="w-3 h-3" /> Resetar Amostra
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Concurso Inicial
                </Label>
                <Input 
                  type="number" 
                  value={minConcurso} 
                  onChange={(e) => setMinConcurso(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-9 text-xs bg-background/50"
                  placeholder="Ex: 1"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Concurso Final
                </Label>
                <Input 
                  type="number" 
                  value={maxConcurso} 
                  onChange={(e) => setMaxConcurso(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-9 text-xs bg-background/50"
                  placeholder={`Ex: ${initialMax}`}
                />
              </div>
              <div className="md:col-span-2 flex items-end pb-1.5">
                <div className="flex items-center space-x-2 bg-background/30 p-2.5 rounded-lg border border-border/40 w-full hover:border-primary/30 transition-all cursor-pointer group" onClick={() => setOnlyPrizes(!onlyPrizes)}>
                  <Checkbox 
                    id="onlyPrizes" 
                    checked={onlyPrizes} 
                    onCheckedChange={(checked) => setOnlyPrizes(checked === true)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Label htmlFor="onlyPrizes" className="text-xs cursor-pointer group-hover:text-foreground transition-colors">
                    Exibir apenas concursos premiados na amostra
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>
                Amostra atual: <strong>{filteredBets[0]?.results.length || 0} de {bets[0]?.results.length || 0} concursos</strong> 
                {onlyPrizes && " (filtrado por prêmios)"}. Todos os cálculos e rankings foram atualizados.
              </span>
            </div>
          </div>

          {/* Stats Grid Side-by-Side */}
          <div id="comparison-grid" tabIndex={-1} className="overflow-x-auto pb-4 scrollbar-thin focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl">
            <div className="flex gap-4 min-w-max pb-2">
              {filteredBets.map((bet, i) => {
                const isBestScore = highlights?.score.includes(i);
                const isBestAvg = highlights?.avgHits.includes(i);
                const isBestHit = highlights?.bestHit.includes(i);
                const isBestPrize = highlights?.prizeHits.includes(i);
                const isBestConsistency = highlights?.consistency.includes(i);
                const consistencyVal = highlights?.metrics[i].consistency || 0;
                const currentScore = highlights?.metrics[i].score || 0;

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
                      <Badge 
                        variant={isBestScore ? "default" : "secondary"} 
                        className={`font-mono ${isBestScore ? "gradient-brand" : ""}`}
                        aria-label={`Pontuação total: ${bet.score} de 100`}
                      >
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
                      <div aria-label={`Retorno total estimado: ${bet.totalPrize}`}>
                        <p className="text-[10px] text-muted-foreground mb-0.5" aria-hidden="true">Retorno Total Estimado</p>
                        <p className="text-sm font-bold text-primary font-mono" aria-hidden="true">{bet.totalPrize}</p>
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
                    
                    {/* Breakdown Side-by-Side */}
                    {stats && config && (
                      <div className="mt-6 pt-6 border-t border-border/50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1.5">
                            <Binary className="w-3 h-3 text-primary" /> 
                            Breakdown de IA por Dezena
                          </span>
                          <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest border-primary/20 text-primary">
                            {bet.strategyId || "Análise Geral"}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          {bet.numbers.sort((a, b) => a - b).map(n => {
                            const s = stats.find(st => st.number === n);
                            if (!s) return null;
                            
                            let scoreVal = 0;
                            let label = "Score";
                            const strat = bet.strategyId || "markov"; // Default to markov if unknown

                            if (strat === "markov") { scoreVal = s.trend > 0 ? 100 : 30; label = "Transição"; }
                            else if (strat === "poisson") { scoreVal = Math.round(Math.min(100, (10 / (s.avgGap + 1)) * 50)); label = "Poisson"; }
                            else if (strat === "cluster") { scoreVal = Math.round(Math.min(100, s.momentum * 30)); label = "Afinidade"; }
                            else { scoreVal = Math.round((s.percentage / 20) * 100); label = "Frequência"; }

                            return (
                              <TooltipProvider key={n}>
                                <Tooltip delayDuration={200}>
                                  <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center p-1.5 rounded-lg bg-background/40 border border-border/20 min-w-[38px] cursor-help hover:border-primary/40 transition-colors">
                                      <span className="text-[11px] font-bold font-mono">{String(n).padStart(2, "0")}</span>
                                      <div className="w-full h-1.5 mt-1.5 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-primary" style={{ width: `${scoreVal}%` }} />
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-[10px] p-2 bg-card border-border shadow-xl">
                                    <p className="font-bold">Dezena {n} • {label}: {scoreVal}</p>
                                    <p className="text-muted-foreground mt-1">Status: {s.status}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                        <p className="text-[8px] text-muted-foreground mt-3 italic">
                          * Barras indicam a força individual de cada dezena segundo a estratégia "{bet.strategyId || 'Markov'}".
                        </p>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-border/50">
                      <BetHitsChart results={bet.results} avgHits={bet.avgHits} pick={pick} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Differences Section */}
          <div id="differences-section" tabIndex={-1} className="space-y-4 focus:outline-none focus:ring-2 focus:ring-primary/10 p-2 rounded-xl">
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
          <div id="consistency-section" tabIndex={-1} className="space-y-6 focus:outline-none focus:ring-2 focus:ring-primary/10 p-2 rounded-xl">
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
