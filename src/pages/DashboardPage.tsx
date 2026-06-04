import { useCallback, useState, memo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedBets } from "@/hooks/useSavedBets";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import { m } from "framer-motion";
import { Sparkles, Bot, Target, Zap, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";

const DashboardPage = () => {
  const { config, stats, draws, selectedLottery } = useLotteryContext();
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
        const gameData = { numbers: bet, score: quality.overall, strategy: "Equilíbrio Neural" };
        setLuckyGame(gameData);
        await saveGeneration(gameData);
      }
      setGenerating(false);
    }, 1000);
  }, [stats, draws, selectedLottery, saveGeneration, config]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tighter">Olá, Titan!</h1>
        <p className="text-muted-foreground">Bem-vindo ao seu assistente de decisões lotéricas.</p>
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
          { label: "Dezenas Quentes", value: "05, 12, 23", color: "text-rose-400" },
          { label: "Dezenas Frias", value: "01, 19, 25", color: "text-blue-400" },
        ].map((item) => (
          <Card key={item.label} className="glass-card border-border/40 p-4">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">{item.label}</p>
            <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
          </Card>
        ))}
      </section>

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