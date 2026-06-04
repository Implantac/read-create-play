import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, Flame, Snowflake, TrendingUp, Clock, 
  Target, Filter, Brain, Zap, Shield, Info,
  Search, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [
  { label: "Todos", value: 0 },
  { label: "Últimos 30", value: 30 },
  { label: "Últimos 100", value: 100 },
] as const;

export default function FarolEstatisticoPage() {
  const { config, stats, farol, cycle, draws } = useLotteryContext();
  const [period, setPeriod] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFarol = useMemo(() => {
    let result = farol || [];
    if (searchTerm) {
      result = result.filter(s => s.number.toString().includes(searchTerm));
    }
    return result.sort((a, b) => b.titanScore - a.titanScore);
  }, [farol, searchTerm]);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-neon-cyan border-neon-cyan/50 bg-neon-cyan/10 shadow-[0_0_15px_rgba(0,255,255,0.3)]";
    if (score >= 70) return "text-emerald-400 border-emerald-500/50 bg-emerald-500/10";
    if (score >= 40) return "text-amber-400 border-amber-500/50 bg-amber-500/10";
    return "text-rose-400 border-rose-500/50 bg-rose-500/10";
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 10) return <ArrowUpRight className="w-3 h-3 text-emerald-400" />;
    if (trend < -10) return <ArrowDownRight className="w-3 h-3 text-rose-400" />;
    return <Activity className="w-3 h-3 text-amber-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <PageHeader
        title="Farol Estatístico Titan"
        description="Engenharia de dados e Score proprietário (FAROL)"
        icon={Zap}
        badge="SISTEMA ELITE"
      />
      <LotteryContextBanner />

      {/* Resumo de Ciclo e Tendência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-panel border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Ciclo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-black text-foreground">{cycle?.currentCycle || 0}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Ciclo nº</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{cycle?.drawsInCurrentCycle || 0} concursos</p>
                <p className="text-[10px] text-muted-foreground">no ciclo atual</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                <span>Faltam {cycle?.missingNumbers.length || 0} dezenas</span>
                <span>Média: {cycle?.avgDrawsToClose.toFixed(1) || 0}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {cycle?.missingNumbers.slice(0, 8).map(n => (
                  <span key={n} className="w-5 h-5 flex items-center justify-center rounded bg-primary/20 text-[10px] font-mono font-bold border border-primary/30">
                    {n}
                  </span>
                ))}
                {(cycle?.missingNumbers.length || 0) > 8 && <span className="text-[10px] text-muted-foreground self-center">...</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-accent/20 bg-accent/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4 text-accent" />
              Inteligência Titan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Confiança IA</span>
                <span className="text-xs font-black text-accent">87%</span>
              </div>
              <Progress value={87} className="h-1.5 bg-accent/20" />
              <div className="p-2 rounded-lg bg-background/50 border border-accent/10">
                <p className="text-[9px] leading-relaxed text-muted-foreground italic">
                  "O ciclo atual demonstra alta probabilidade de fechamento nas próximas 2 rodadas. Recomendado foco nas dezenas com Score Elite."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              Score Médio Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-2">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-emerald-500/10"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * 68) / 100}
                    className="text-emerald-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-emerald-400">68</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">Forte</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {PERIOD_OPTIONS.map(opt => (
            <Button 
              key={opt.value} 
              size="sm" 
              variant={period === opt.value ? "default" : "outline"} 
              onClick={() => setPeriod(opt.value)} 
              className="h-8 text-[10px] font-black uppercase px-4 rounded-xl shrink-0"
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar dezena..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted/20 border border-border/40 rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Grid do Farol */}
      <m.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {filteredFarol.map((s) => (
          <m.div key={s.number} variants={item}>
            <Card className="group relative overflow-hidden glass-panel border-border/40 hover:border-primary/40 transition-all duration-300">
              {/* Background gradient focus */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground font-mono font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                      {String(s.number).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Titan Score</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="text-[10px] max-w-[200px]">
                            Algoritmo proprietário: Frequência (30%), Atraso (25%), Tendência (20%), Ciclo (15%) e Correlação (10%).
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-black text-foreground">{s.titanScore}</h4>
                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase h-4 px-1.5 rounded-md", getScoreColor(s.titanScore))}>
                          {s.titanGrade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {getTrendIcon(s.trend)}
                      <span className={cn("text-[10px] font-bold", s.trend > 0 ? "text-emerald-400" : s.trend < 0 ? "text-rose-400" : "text-amber-400")}>
                        {s.trend > 0 ? "+" : ""}{s.trend}%
                      </span>
                    </div>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Tendência</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] uppercase font-black text-muted-foreground">
                      <span>Freq. Geral</span>
                      <span className="text-foreground">{s.frequency}x</span>
                    </div>
                    <Progress value={(s.frequency / (draws.length || 1)) * 300} className="h-1" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] uppercase font-black text-muted-foreground">
                      <span>Atraso</span>
                      <span className="text-foreground">{s.currentDelay}</span>
                    </div>
                    <Progress value={(s.currentDelay / s.avgDelay) * 50} className="h-1 bg-amber-500/20" />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-primary" />
                    Principais Correlações
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.correlations.slice(0, 3).map((c) => (
                      <div key={c.number} className="flex items-center gap-1 bg-muted/30 px-2 py-1 rounded-lg border border-border/20">
                        <span className="text-[9px] font-mono font-bold">{String(c.number).padStart(2, "0")}</span>
                        <span className="text-[8px] text-muted-foreground">{Math.round(c.percentage)}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center p-1.5 rounded-lg bg-muted/20 border border-border/20">
                    <p className="text-[14px] font-black font-mono leading-none">{s.repeatLast5}</p>
                    <p className="text-[7px] font-black uppercase text-muted-foreground mt-1">Rep. 5</p>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-muted/20 border border-border/20">
                    <p className="text-[14px] font-black font-mono leading-none">{s.repeatLast10}</p>
                    <p className="text-[7px] font-black uppercase text-muted-foreground mt-1">Rep. 10</p>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-muted/20 border border-border/20">
                    <p className="text-[14px] font-black font-mono leading-none">{s.avgGap}</p>
                    <p className="text-[7px] font-black uppercase text-muted-foreground mt-1">Média Gap</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </m.div>
        ))}
      </m.div>
    </div>
  );
}
