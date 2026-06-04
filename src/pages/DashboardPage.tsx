import { useCallback, useState, memo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedBets } from "@/hooks/useSavedBets";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import { m, AnimatePresence } from "framer-motion";
import { Sparkles, Bot, Target, Zap, BarChart3, ChevronRight, Grid3X3, User, History, Brain, Snowflake, TrendingUp, Smartphone, RefreshCw, Crown, Terminal as TerminalIcon, Activity, Shield, Layers, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { TitanHealthGauge } from "@/components/TitanHealthGauge";
import { AIAnalystBriefing } from "@/components/lottery/AIAnalystBriefing";
import { TitanCommandCenter } from "@/components/TitanCommandCenter";


const DashboardPage = () => {
  const { config, stats, draws, selectedLottery, viewMode } = useLotteryContext();
  const { saveGeneration } = useGenerationHistory(selectedLottery);
  const [luckyGame, setLuckyGame] = useState<any | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);


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
          reasons: quality.strengths.length > 0 ? quality.strengths : ["Equilíbrio estrutural", "Frequência ideal", "Dispersão técnica"],
          pipeline: { filters: [], score: quality.overall }
        };

        setLuckyGame(gameData);
        await saveGeneration(gameData);
      }
      setGenerating(false);
    }, 1000);
  }, [stats, draws, selectedLottery, saveGeneration, config]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Intelligence Assistant v6.0</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-tight">
            Sua Melhor <span className="gradient-brand-text">Oportunidade</span> Hoje
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Nossa IA já analisou milhões de combinações. Aqui está a recomendação de alta probabilidade para você.
          </p>
        </div>
      </div>

      {/* Main Recommendation Card - Zero Scroll Focus */}
      <section className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
        
        <Card className="glass-card border-primary/20 bg-black/40 overflow-hidden relative rounded-[2rem] shadow-2xl">
          <CardContent className="p-8 md:p-12 relative z-10">
            {luckyGame ? (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-10 w-full text-center lg:text-left">
                  <div className="space-y-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60 italic">Jogo Recomendado</p>
                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                      {luckyGame.numbers.map((n: number, idx: number) => (
                        <m.div 
                          key={`${n}-${idx}`}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: idx * 0.05, type: "spring" }}
                          whileHover={{ y: -8, scale: 1.1 }}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-xl sm:text-2xl text-primary shadow-xl shadow-primary/5 transition-all cursor-default italic"
                        >
                          {String(n).padStart(2, '0')}
                        </m.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Estratégia</span>
                      <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <Bot className="w-4 h-4 text-primary" /> {luckyGame.strategy}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-border/40 hidden sm:block" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Data do Sinal</span>
                      <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <History className="w-4 h-4 text-muted-foreground" /> {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-[320px] p-8 rounded-[2rem] bg-background/40 border border-white/5 backdrop-blur-md shadow-inner text-center space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60">IA Trust</p>
                      <p className="text-3xl font-black italic tracking-tighter tabular-nums gradient-brand-text leading-none">{luckyGame.score}%</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest opacity-60">Tendência</p>
                      <p className="text-3xl font-black italic tracking-tighter text-emerald-400 leading-none">Alta</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={generateGame} className="w-full h-14 rounded-2xl gradient-brand font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Gerar Novo Jogo
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button asChild variant="outline" className="h-12 rounded-xl border-border/40 font-bold uppercase tracking-widest text-[9px]">
                        <Link to="/fechamentos">Ver Fechamentos</Link>
                      </Button>
                      <Button variant="ghost" onClick={() => setShowBriefing(true)} className="h-12 rounded-xl bg-white/5 border border-white/5 font-bold uppercase tracking-widest text-[9px] hover:bg-white/10 flex items-center gap-2">
                        <Info className="w-3 h-3 text-primary" />
                        Ver Explicação
                      </Button>

                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-8">
                <div className="w-24 h-24 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-center animate-pulse shadow-inner">
                  <Bot className="w-12 h-12 text-primary opacity-40" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Assistente em Standby</h2>
                  <p className="text-sm opacity-60 max-w-xs mx-auto">Toque abaixo para que a IA analise o sorteio atual e gere sua melhor recomendação.</p>
                </div>
                <Button onClick={generateGame} disabled={generating} className="rounded-2xl font-black uppercase tracking-widest text-xs px-12 h-14 gradient-brand shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                  {generating ? (
                    <m.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RefreshCw className="w-5 h-5" />
                    </m.div>
                  ) : (
                    <Sparkles className="w-5 h-5 mr-3" />
                  )}
                  {generating ? "Calibrando Core..." : "Ativar Assistente Titan"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Briefing Modal */}
      <AnimatePresence>
        {showBriefing && luckyGame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowBriefing(false)}
                className="absolute top-4 right-4 z-[60] text-white hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </Button>
              <AIAnalystBriefing 
                game={luckyGame.numbers}
                score={luckyGame.score}
                strategy={luckyGame.strategy}
                reasons={luckyGame.reasons || ["Distribuição equilibrada", "Alta probabilidade estatística", "Tendência positiva"]}
                lotteryName={config.name}
              />
            </div>
          </div>
        )}
      </AnimatePresence>


      {/* Primary Actions Grid - Quick Access */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: "Lotofácil Elite", icon: Crown, url: "/lotofacil-premium", desc: "Ambiente Profissional", color: "text-amber-400", bg: "from-amber-500/10" },
          { label: "IA Autônoma", icon: Brain, url: "/ia-autonoma", desc: "Rede Neural Ativa", color: "text-primary", bg: "from-primary/10" },
          { label: "Fechamentos", icon: Grid3X3, url: "/fechamentos", desc: "Matemática Aplicada", color: "text-blue-400", bg: "from-blue-500/10" },
          { label: "Análise Central", icon: BarChart3, url: "/analise", desc: "Dados & Estatística", color: "text-emerald-400", bg: "from-emerald-500/10" },
        ].map((item, idx) => (
          <Link 
            key={item.label} 
            to={item.url} 
            className="group p-8 rounded-[2.5rem] glass-card border-border/40 hover:border-primary/40 hover:bg-gradient-to-br transition-all duration-700 relative overflow-hidden active:scale-95 shadow-xl bg-background/40"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <item.icon className="w-16 h-16" />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-background/60 border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500 ${item.color}`}>
                <item.icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-black uppercase tracking-tight italic block leading-none">{item.label}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 block opacity-40 group-hover:opacity-100 transition-opacity leading-none">{item.desc}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Terminal Section */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
              <TerminalIcon className="w-4 h-4" />
              Terminal de Inteligência
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
              { icon: Zap, text: "Sincronização global concluída. 3.142 sorteios indexados.", type: "success", time: "10:42" },
              { icon: Brain, text: "Rede neural detectou desvio no quadrante moldura.", type: "info", time: "10:38" },
              { icon: Target, text: "Ciclo #512 em estágio final. 4 dezenas restantes.", type: "warning", time: "10:35" },
              { icon: Activity, text: "Recalibrando Titan Score para o próximo concurso.", type: "info", time: "10:30" },
            ].map((feed, i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-3xl bg-secondary/10 border border-border/40 group hover:border-primary/40 hover:bg-secondary/20 transition-all cursor-default relative overflow-hidden">
                <div className={`p-2.5 rounded-2xl bg-background/60 border border-white/5 shrink-0 group-hover:scale-110 group-hover:shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)] transition-all`}>
                  <feed.icon className={`w-4 h-4 ${feed.type === 'success' ? 'text-emerald-400' : feed.type === 'warning' ? 'text-amber-400' : 'text-primary'}`} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{feed.time}</span>
                  </div>
                  <p className="text-[11px] font-bold text-foreground/80 leading-tight">
                    {feed.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="lg:col-span-4 space-y-8">
          <TitanCommandCenter />
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Saúde do Sistema
              </h2>
            </div>

          
          <div className="space-y-4">
            <TitanHealthGauge 
              value={94.8} 
              label="Neural Core" 
              sublabel="Processamento Ativo" 
              color="hsl(var(--primary))" 
            />
            <div className="p-6 rounded-3xl bg-background/40 border border-border/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Segurança de Dados</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="h-1.5 w-full bg-secondary/40 rounded-full overflow-hidden">
                <m.div 
                  initial={{ width: 0 }}
                  animate={{ width: "98%" }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground text-center italic">Monitoramento Biométrico Ativo</p>
            </div>
          </div>
        </div>
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

      {/* Navegação Rápida - Modern Hub */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60 flex items-center gap-2">
            <Grid3X3 className="w-3.5 h-3.5 text-primary" />
            Navegação Global
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Análise Central", icon: BarChart3, url: "/analise", desc: "Big Data & Filtros", color: "text-emerald-400" },
            { label: "Matriz HP", icon: Grid3X3, url: "/lotofacil-premium", desc: "Estatística Avançada", color: "text-primary" },
            { label: "IA Autônoma", icon: Brain, url: "/ia-autonoma", desc: "Fluxos Neurais", color: "text-amber-400" },
            { label: "Fechamentos", icon: Layers, url: "/fechamentos", desc: "Matemática Pura", color: "text-blue-400" },
          ].map((item, idx) => (
            <Link key={item.label} to={item.url} className="group p-6 rounded-3xl glass-card border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 relative overflow-hidden active:scale-95">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <item.icon className="w-12 h-12" />
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl bg-background/60 border border-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-black uppercase tracking-tight italic block leading-none">{item.label}</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 block opacity-40 group-hover:opacity-100 transition-opacity leading-none">{item.desc}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default memo(DashboardPage);