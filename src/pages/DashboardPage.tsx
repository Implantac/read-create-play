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

      {/* Jogo Recomendado Hoje */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Recomendação IA
          </h2>
          <Button onClick={generateGame} disabled={generating} className="gap-2 rounded-xl font-bold">
            {generating ? "Processando..." : "Gerar Aposta"}
          </Button>
        </div>

        <Card className="glass-panel border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-8">
            {luckyGame ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-wrap gap-2 justify-center">
                  {luckyGame.numbers.map((n: number) => (
                    <div key={n} className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-lg text-primary shadow-lg shadow-primary/5">
                      {String(n).padStart(2, '0')}
                    </div>
                  ))}
                </div>
                <div className="text-center md:text-right space-y-2">
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-2xl font-black">{luckyGame.score}</span>
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Score Titan</span>
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">Estratégia: {luckyGame.strategy}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-4">
                <Bot className="w-12 h-12 opacity-20" />
                <p>Clique em "Gerar Aposta" para ver a recomendação da IA para hoje.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Resumo Executivo */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tendência", value: "Alta", color: "text-emerald-400" },
          { label: "Ciclo", value: "32", color: "text-primary" },
          { label: "Quentes", value: "05, 12, 23", color: "text-rose-400" },
          { label: "Frias", value: "01, 19, 25", color: "text-blue-400" },
        ].map((item) => (
          <Card key={item.label} className="glass-card border-border/40 p-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
          </Card>
        ))}
      </section>

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