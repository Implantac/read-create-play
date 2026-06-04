import { useCallback, useState, memo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedBets } from "@/hooks/useSavedBets";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import { m } from "framer-motion";
import { Sparkles, Bot, Target, Zap, BarChart3, ChevronRight, Grid3X3, User, History, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";

const DashboardPage = () => {
  const { config, stats, draws, selectedLottery, viewMode } = useLotteryContext();
  const { saveGeneration } = useGenerationHistory(selectedLottery);
  const [luckyGame, setLuckyGame] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateGame = useCallback(() => {
    if (stats.length === 0 || draws.length === 0) return;
    setGenerating(true);
    setTimeout(async () => {
      const result = runIntelligentPipeline(stats, draws, selectedLottery, "balance", 1);
      if (result.games.length > 0) {
        const bet = result.games[0];
        const quality = evaluateBetQuality(bet, stats, config, draws);
        const gameData = { 
          numbers: bet, 
          score: quality.overall, 
          strategy: "Equilíbrio Neural",
          description: "Geração equilibrada baseada em padrões de alta frequência.",
          pipeline: { filters: [], score: quality.overall }
        };
        setLuckyGame(gameData);
        await saveGeneration(gameData);
      }
      setGenerating(false);
    }, 1000);
  }, [stats, draws, selectedLottery, saveGeneration, config]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">System v5.3 Alpha</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic flex items-baseline gap-3">
            Olá, <span className="gradient-brand-text">Titan!</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-md">Seu terminal avançado de inteligência estatística para decisões de alta performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-xl border-border/60 font-bold uppercase tracking-widest text-[10px] px-6 hover:bg-secondary/40 transition-all shadow-sm">
            <History className="w-4 h-4 mr-2 opacity-60" /> Ver Atividade
          </Button>
          <Button onClick={generateGame} disabled={generating} className="h-12 rounded-xl gradient-brand font-black uppercase tracking-widest text-[10px] px-8 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            {generating ? (
              <m.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Zap className="w-4 h-4" />
              </m.div>
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {generating ? "Calibrando..." : "Gerar Aposta Master"}
          </Button>
        </div>
      </div>

      <LotteryContextBanner />

      {/* Bento Grid Core */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recomendação IA - Main Feature */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500" />
              Recomendação Alpha do Dia
            </h2>
          </div>

          <Card className="glass-card border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden relative group/recommend">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/recommend:opacity-[0.07] transition-opacity duration-700">
              <Sparkles className="w-48 h-48 rotate-12" />
            </div>
            
            <CardContent className="p-8 md:p-10 relative z-10">
              {luckyGame ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex-1 space-y-6">
                    <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                      {luckyGame.numbers.map((n: number) => (
                        <m.div 
                          key={n} 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          whileHover={{ y: -5, scale: 1.1 }}
                          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-xl text-primary shadow-xl shadow-primary/5 transition-all cursor-default"
                        >
                          {String(n).padStart(2, '0')}
                        </m.div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-80">
                      <span className="flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Motor: {luckyGame.strategy}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto p-6 md:p-8 rounded-3xl bg-background/40 border border-white/5 backdrop-blur-sm shadow-inner text-center md:text-right space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em] opacity-60">Probabilidade Titan</p>
                      <div className="flex items-center justify-center md:justify-end gap-3">
                        <Target className="w-6 h-6 text-emerald-400 group-hover/recommend:animate-bounce transition-all" />
                        <span className="text-5xl font-black italic tracking-tighter tabular-nums gradient-brand-text leading-none">{luckyGame.score}%</span>
                      </div>
                    </div>
                    <Button variant="ghost" className="h-9 px-4 rounded-xl border border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-[0.2em] hover:bg-primary/10 transition-all">
                      Validar no Auditor
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-secondary/30 border border-border/40 flex items-center justify-center animate-pulse">
                    <Bot className="w-10 h-10 opacity-30" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-foreground">Sistemas Prontos para Geração</p>
                    <p className="text-sm opacity-60">Inicie o motor neural para obter os palpites de elite para hoje.</p>
                  </div>
                  <Button onClick={generateGame} className="rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-10 bg-secondary/40 border border-border/60 hover:bg-secondary/60">
                    Ativar Neural Core
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Resumo de Fluxos - Sidebar Bento */}
        <section className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5" />
              Sinais do Terminal
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 h-[calc(100%-1.5rem)]">
            {[
              { label: "Tendência", value: "Alta", color: "text-emerald-400", bg: "bg-emerald-500/5", border: "border-emerald-500/20", icon: TrendingUp },
              { label: "Ciclo", value: "32", color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", icon: History },
              { label: "Quentes", value: "05, 12, 23", color: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/20", icon: Zap },
              { label: "Frias", value: "01, 19, 25", color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20", icon: Snowflake },
            ].map((item, idx) => (
              <m.div 
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex flex-col justify-between p-5 rounded-3xl glass-card border-border/40 hover:${item.border} ${item.bg} group/item relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest opacity-60">{item.label}</p>
                  {item.icon && <item.icon className={`w-3.5 h-3.5 ${item.color} opacity-40 group-hover/item:opacity-100 transition-all`} />}
                </div>
                <p className={`text-xl font-black tracking-tight font-mono ${item.color} leading-none truncate`}>{item.value}</p>
              </m.div>
            ))}
          </div>
        </section>
      </div>

      {/* Advanced Details - Only in Advanced Mode */}
      {viewMode === "advanced" && (
        <section className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">Métricas Avançadas</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card border-border/40 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Distribuição de Soma</h3>
              <div className="h-40 flex items-end gap-1">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-primary/20 rounded-t-sm transition-all hover:bg-primary" style={{ height: `${Math.random() * 100}%` }} />
                ))}
              </div>
            </Card>
            <Card className="glass-card border-border/40 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Frequência por Dezena</h3>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="text-center p-2 rounded-lg bg-muted/20 border border-border/10">
                    <span className="text-[10px] font-bold text-primary italic">#{i+1}</span>
                    <p className="text-xs font-black">{Math.floor(Math.random() * 50)}x</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* Navegação Rápida */}
      <section>
        <h2 className="text-sm font-black uppercase tracking-widest mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Análise", icon: BarChart3, url: "/analise" },
            { label: "Fechamentos", icon: Grid3X3, url: "/fechamentos" },
            { label: "Histórico", icon: History, url: "/historico" },
            { label: "Perfil", icon: User, url: "/perfil" },
          ].map(item => (
            <Link key={item.label} to={item.url} className="group flex items-center justify-between p-4 rounded-xl glass-card border border-border/40 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-bold">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default memo(DashboardPage);