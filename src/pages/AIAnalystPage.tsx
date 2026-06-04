import { useState, useCallback, useRef, useEffect } from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/formatters";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { nativeAI } from "@/ai/core/nativeAIOrchestrator";
import { getWheelingOptions } from "@/ai/engines/wheelingEngine";
import { STRATEGIES } from "@/ai/knowledge/strategiesKnowledge";
import { getLotteryRules } from "@/ai/knowledge/lotteriesKnowledge";
import type { AIResponse, ScoredGame, RiskProfile } from "@/ai/core/aiTypes";
import { Brain, Send, Sparkles, Shield, BarChart3, FlaskConical, Trophy, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useSavedBets } from "@/hooks/useSavedBets";
import { NeuralMapVisualization } from "@/components/NeuralMapVisualization";
import { FarolEstatistico } from "@/components/FarolEstatistico";
import { HeatmapInteligente } from "@/components/HeatmapInteligente";
import { EliteGameCard } from "@/components/lottery/EliteGameCard";

const AIAnalystPage = () => {
  const { config, draws, stats, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; content: string; response?: AIResponse }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generator state
  const [genStrategy, setGenStrategy] = useState<RiskProfile>("balanced");
  const [genCount, setGenCount] = useState(10);
  const [genResult, setGenResult] = useState<AIResponse | null>(null);

  // Wheeling state
  const [wheelBase, setWheelBase] = useState(18);
  const [wheelResult, setWheelResult] = useState<AIResponse | null>(null);

  // Simulation state
  const [simCount, setSimCount] = useState(10000);
  const [simResult, setSimResult] = useState<AIResponse | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleChat = useCallback(async () => {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await nativeAI.process({
        input: userMsg,
        lotteryId: selectedLottery,
        draws, stats, config,
      });
      setChatHistory(prev => [...prev, { role: "ai", content: response.explanation, response }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: "ai", content: "Erro ao processar. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  }, [chatInput, loading, selectedLottery, draws, stats, config]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await nativeAI.process({
        input: `gere ${genCount} jogos com perfil ${genStrategy}`,
        lotteryId: selectedLottery, draws, stats, config,
      });
      setGenResult(response);
    } catch { toast.error("Erro na geração"); }
    finally { setLoading(false); }
  }, [genCount, genStrategy, selectedLottery, draws, stats, config]);

  const saveGame = (game: ScoredGame) => {
    saveBet({ numbers: game.numbers, strategy: `IA Nativa (${genStrategy})`, score: game.totalScore, grade: game.grade });
    toast.success("Jogo salvo!");
  };

  const rules = getLotteryRules(selectedLottery);
  const wheelOptions = getWheelingOptions(selectedLottery);

  return (
    <div className=\"space-y-6 max-w-5xl mx-auto pb-20\">
      <div className=\"text-center space-y-4 pt-10\">
        <div className=\"inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary\">
          <Brain className=\"w-4 h-4\" />
          <span className=\"text-xs font-black uppercase tracking-[0.2em]\">Titan Analyst v7.0</span>
        </div>
        <h1 className=\"text-4xl md:text-5xl font-black tracking-tighter uppercase italic\">
          Painel de <span className=\"gradient-brand-text\">Estratégia</span>
        </h1>
        <p className=\"text-muted-foreground max-w-xl mx-auto\">Seu assistente neural configurado para <span className=\"text-foreground font-semibold\">{config.name}</span>. Otimize seus resultados com inteligência de dados.</p>
      </div>

      <LotteryContextBanner />

      <PlanGate feature=\"ai_analyst\" fallbackMessage=\"AI Analyst — IA nativa com geração, análise e simulação\">
      <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
        <TabsList className=\"grid grid-cols-5 w-full bg-secondary/20 p-1.5 rounded-2xl mb-8\">
          <TabsTrigger value=\"chat\" className=\"data-[state=active]:bg-card rounded-xl py-2.5 font-bold uppercase tracking-tight text-xs\"><Send className=\"h-4 w-4 mr-2\" />Concierge</TabsTrigger>
          <TabsTrigger value=\"generator\" className=\"data-[state=active]:bg-card rounded-xl py-2.5 font-bold uppercase tracking-tight text-xs\"><Sparkles className=\"h-4 w-4 mr-2\" />Gerador</TabsTrigger>
          <TabsTrigger value=\"wheeling\" className=\"data-[state=active]:bg-card rounded-xl py-2.5 font-bold uppercase tracking-tight text-xs\"><Shield className=\"h-4 w-4 mr-2\" />Blindagem</TabsTrigger>
          <TabsTrigger value=\"simulation\" className=\"data-[state=active]:bg-card rounded-xl py-2.5 font-bold uppercase tracking-tight text-xs\"><FlaskConical className=\"h-4 w-4 mr-2\" />Simular</TabsTrigger>
          <TabsTrigger value=\"farol\" className=\"data-[state=active]:bg-card rounded-xl py-2.5 font-bold uppercase tracking-tight text-xs\"><Zap className=\"h-4 w-4 mr-2\" />Farol</TabsTrigger>
        </TabsList>

        <TabsContent value=\"chat\">
          <Card className=\"border-border/40 shadow-xl\">
            <CardHeader><CardTitle className=\"flex items-center gap-2\"><Brain className=\"h-5 w-5\" />Titan Concierge</CardTitle></CardHeader>
            <CardContent className=\"space-y-4\">
              <ScrollArea className=\"h-[450px] border rounded-2xl p-6 bg-secondary/10\">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={\`mb-4 \${msg.role === \"user\" ? \"text-right\" : \"\"}\`}>
                    <div className={\`inline-block max-w-[85%] p-4 rounded-2xl text-sm \${msg.role === \"user\" ? \"bg-primary text-primary-foreground\" : \"bg-card border\"}\`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </ScrollArea>
              <div className=\"flex gap-2\">
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === \"Enter\" && handleChat()} placeholder=\"O que deseja analisar hoje?\" />
                <Button onClick={handleChat} disabled={loading} className=\"gradient-brand\"><Send className=\"h-4 w-4\" /></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"generator\">
          <Card className=\"border-border/40 shadow-xl\">
            <CardHeader><CardTitle className=\"flex items-center gap-2\"><Sparkles className=\"h-5 w-5\" />Gerador Inteligente</CardTitle></CardHeader>
            <CardContent className=\"space-y-6\">
              <div className=\"grid sm:grid-cols-3 gap-4\">
                <Select value={genStrategy} onValueChange={v => setGenStrategy(v as RiskProfile)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(STRATEGIES).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Slider value={[genCount]} onValueChange={v => setGenCount(v[0])} min={1} max={50} step={1} />
                <Button onClick={handleGenerate} className=\"w-full gradient-brand\">Gerar Jogos</Button>
              </div>
              <div className=\"grid gap-3\">
                {genResult?.games?.map((game, i) => (
                  <EliteGameCard key={i} numbers={game.numbers} score={game.totalScore} grade={game.grade} index={i} onSave={() => saveGame(game)} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"farol\">
            <FarolEstatistico />
        </TabsContent>
      </Tabs>
      </PlanGate>
    </div>
  );
};

export default AIAnalystPage;
