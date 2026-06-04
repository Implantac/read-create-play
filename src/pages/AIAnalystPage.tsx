import { useState, useCallback, useRef, useEffect } from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/formatters";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PlanGate } from "@/components/PlanGate";
import { PageHeader } from "@/components/PageHeader";
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
import { generateWheeling } from "@/ai/engines/wheelingEngine";
import { STRATEGIES } from "@/ai/knowledge/strategiesKnowledge";
import { getLotteryRules } from "@/ai/knowledge/lotteriesKnowledge";
import type { AIResponse, ScoredGame, RiskProfile } from "@/ai/core/aiTypes";
import {
  Brain, Send, Sparkles, Shield, BarChart3, FlaskConical,
  Trophy, Loader2, Copy, Check, Target, Zap, TrendingUp,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useSavedBets } from "@/hooks/useSavedBets";

const AIAnalystPage = () => {
  const { config, draws, stats, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);
  const [activeTab, setActiveTab] = useState("chat");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; content: string; response?: AIResponse }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generator state
  const [genStrategy, setGenStrategy] = useState<RiskProfile>("balanced");
  const [genCount, setGenCount] = useState(10);
  const [genResult, setGenResult] = useState<AIResponse | null>(null);

  // Wheeling state
  const [wheelBase, setWheelBase] = useState(18);
  const [wheelResult, setWheelResult] = useState<AIResponse | null>(null);
  const [expandedGame, setExpandedGame] = useState<number | null>(null);

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

  const handleWheeling = useCallback(async () => {
    setLoading(true);
    try {
      const response = await nativeAI.process({
        input: `fechamento de ${wheelBase} dezenas base`,
        lotteryId: selectedLottery, draws, stats, config,
      });
      setWheelResult(response);
    } catch { toast.error("Erro no fechamento"); }
    finally { setLoading(false); }
  }, [wheelBase, selectedLottery, draws, stats, config]);

  const handleSimulate = useCallback(async () => {
    setLoading(true);
    try {
      const response = await nativeAI.process({
        input: `simule ${simCount} concursos`,
        lotteryId: selectedLottery, draws, stats, config,
      });
      setSimResult(response);
    } catch { toast.error("Erro na simulação"); }
    finally { setLoading(false); }
  }, [simCount, selectedLottery, draws, stats, config]);

  const copyGame = (numbers: number[], idx: number) => {
    navigator.clipboard.writeText(numbers.join(" - "));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success("Jogo copiado!");
  };

  const saveGame = (game: ScoredGame) => {
    saveBet({ numbers: game.numbers, strategy: `IA Nativa (${genStrategy})`, score: game.totalScore, grade: game.grade });
    toast.success("Jogo salvo!");
  };

  const rules = getLotteryRules(selectedLottery);
  const wheelOptions = getWheelingOptions(selectedLottery);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Analyst"
        description="IA nativa especialista em loterias brasileiras — geração, análise, simulação e fechamentos"
        icon={Brain}
        badge="NATIVA"
      />
      <LotteryContextBanner />

      <PlanGate feature="ai_analyst" fallbackMessage="AI Analyst — IA nativa com geração, análise e simulação">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="chat" className="gap-1.5"><Send className="h-3.5 w-3.5" />Chat IA</TabsTrigger>
          <TabsTrigger value="generator" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" />Gerador</TabsTrigger>
          <TabsTrigger value="wheeling" className="gap-1.5"><Shield className="h-3.5 w-3.5" />Fechamento</TabsTrigger>
          <TabsTrigger value="simulation" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" />Simulação</TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Análise</TabsTrigger>
        </TabsList>

        {/* ═══ CHAT TAB ═══ */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-primary" />
                Converse com a IA Analyst
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  "Gere 10 jogos equilibrados",
                  "Analise os últimos 50 concursos",
                  "Crie fechamento de 18 dezenas",
                  "Simule 10000 concursos",
                  "Qual a melhor estratégia?",
                ].map(q => (
                  <Button key={q} variant="outline" size="sm" onClick={() => { setChatInput(q); }}
                    className="text-xs">{q}</Button>
                ))}
              </div>

              <ScrollArea className="h-[400px] border rounded-lg p-4">
                {chatHistory.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                    <Brain className="h-10 w-10 mb-3 opacity-30" />
                    <p>Pergunte algo ou use um atalho acima</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`mb-4 ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block max-w-[85%] p-3 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                      {msg.response?.games && msg.response.games.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.response.games.slice(0, 5).map((g, gi) => (
                            <div key={gi} className="flex items-center gap-2 bg-background/50 rounded-lg p-2">
                              <Badge variant="outline" className="shrink-0">{g.grade}</Badge>
                              <span className="text-xs font-mono">{g.numbers.join("-")}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{formatNumber(g.totalScore)}pts</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.response?.suggestions && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {msg.response.suggestions.map((s, si) => (
                            <Button key={si} variant="ghost" size="sm" className="text-xs h-6"
                              onClick={() => setChatInput(s)}>{s}</Button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.response?.metadata && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatNumber(msg.response.metadata.processingTimeMs)}ms • {msg.response.metadata.enginesUsed.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processando...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChat()}
                  placeholder="Ex: gere 5 jogos conservadores da Lotofácil..."
                  disabled={loading}
                />
                <Button onClick={handleChat} disabled={loading || !chatInput.trim()}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ GENERATOR TAB ═══ */}
        <TabsContent value="generator">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Gerador Inteligente — {config.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Estratégia</label>
                  <Select value={genStrategy} onValueChange={v => setGenStrategy(v as RiskProfile)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(STRATEGIES).map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantidade: {formatNumber(genCount)}</label>
                  <Slider value={[genCount]} onValueChange={v => setGenCount(v[0])}
                    min={1} max={50} step={1} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleGenerate} disabled={loading || draws.length === 0} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                    Gerar Jogos
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {STRATEGIES[genStrategy]?.description}
              </p>

              {genResult?.games && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{formatNumber(genResult.games.length)} jogos gerados</h3>
                    <Badge variant="outline" className="text-xs">
                      {formatNumber(genResult.metadata?.processingTimeMs)}ms
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {genResult.games.map((game, i) => (
                      <GameCard key={i} game={game} index={i} copiedIdx={copiedIdx}
                        onCopy={() => copyGame(game.numbers, i)}
                        onSave={() => saveGame(game)}
                        expanded={expandedGame === i}
                        onToggle={() => setExpandedGame(expandedGame === i ? null : i)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ WHEELING TAB ═══ */}
        <TabsContent value="wheeling">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Fechamento Inteligente — {config.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Dezenas Base: {formatNumber(wheelBase)}</label>
                  <Slider value={[wheelBase]} onValueChange={v => setWheelBase(v[0])}
                    min={rules.pick + 1} max={Math.min(rules.totalNumbers, 22)} step={1} />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleWheeling} disabled={loading || draws.length === 0} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                    Gerar Fechamento
                  </Button>
                </div>
              </div>

              {wheelOptions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {wheelOptions.map(opt => (
                    <Button key={opt.base} variant={wheelBase === opt.base ? "default" : "outline"} size="sm"
                      onClick={() => setWheelBase(opt.base)} className="text-xs">
                      {formatNumber(opt.base)} dez → ~{formatNumber(opt.estimatedGames)} jogos
                    </Button>
                  ))}
                </div>
              )}

              {wheelResult?.wheeling && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatBox icon={Target} label="Jogos" value={formatNumber(wheelResult.wheeling.totalGames)} />
                    <StatBox icon={Shield} label="Garantia" value={`${formatNumber(wheelResult.wheeling.guarantee)} pts`} />
                    <StatBox icon={TrendingUp} label="Cobertura"
                      value={`${formatNumber(Math.round(wheelResult.wheeling.coverageValidation.coveragePercent))}%`} />
                    <StatBox icon={Trophy} label="Custo"
                      value={formatCurrency(wheelResult.wheeling.estimatedCost)} />
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-xs">
                    <p className="font-semibold mb-1">Base: {wheelResult.wheeling.baseNumbers.join(", ")}</p>
                    <pre className="whitespace-pre-wrap text-muted-foreground">{wheelResult.wheeling.explanation}</pre>
                  </div>

                  <ScrollArea className="h-[300px]">
                    <div className="grid gap-1">
                      {wheelResult.wheeling.games.map((game, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded bg-background hover:bg-muted/50 transition-colors">
                          <span className="text-xs text-muted-foreground w-8">#{i + 1}</span>
                          <span className="font-mono text-xs">{game.join(" - ")}</span>
                          <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0"
                            onClick={() => { navigator.clipboard.writeText(game.join(" - ")); toast.success("Copiado!"); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SIMULATION TAB ═══ */}
        <TabsContent value="simulation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="h-5 w-5 text-primary" />
                Simulador — {config.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Simulações: {formatNumber(simCount)}</label>
                  <div className="flex gap-2">
                    {[1000, 10000, 50000, 100000].map(n => (
                      <Button key={n} variant={simCount === n ? "default" : "outline"} size="sm"
                        onClick={() => setSimCount(n)} className="text-xs">
                        {n >= 1000 ? `${n / 1000}k` : n}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSimulate} disabled={loading || draws.length === 0} className="w-full">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FlaskConical className="h-4 w-4 mr-2" />}
                    Simular
                  </Button>
                </div>
              </div>

              {simResult?.simulation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatBox icon={BarChart3} label="Total" value={formatNumber(simResult.simulation.totalSimulations)} />
                    <StatBox icon={TrendingUp} label="Média Acertos" value={formatNumber(simResult.simulation.avgHits)} />
                    <StatBox icon={Trophy} label="Melhor" value={formatNumber(simResult.simulation.bestGame.avgHits)} />
                    <StatBox icon={Target} label="Jogos" value={formatNumber(simResult.simulation.games.length)} />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Distribuição de Acertos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(simResult.simulation.hitDistribution)
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .slice(0, 8)
                        .map(([hits, count]) => (
                          <div key={hits} className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-lg font-bold text-primary">{formatNumber(Number(hits))}</p>
                            <p className="text-[10px] text-muted-foreground">acertos</p>
                            <p className="text-xs font-mono">{formatPercent(count / simResult.simulation!.totalSimulations)}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Ranking por Desempenho</h4>
                    {simResult.simulation.games.slice(0, 10).map((g, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-background text-xs">
                        <Badge variant={i < 3 ? "default" : "outline"} className="w-6 h-6 p-0 flex items-center justify-center shrink-0">
                          {i + 1}
                        </Badge>
                        <span className="font-mono">{g.numbers.join("-")}</span>
                        <span className="ml-auto text-muted-foreground">avg: {formatNumber(g.avgHits)}</span>
                        <Badge variant="outline" className="text-[10px]">estabilidade: {formatNumber(g.stabilityScore)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ ANALYSIS TAB ═══ */}
        <TabsContent value="analysis">
          <AnalysisTab draws={draws} lotteryId={selectedLottery} stats={stats} config={config} />
        </TabsContent>
      </Tabs>
      </PlanGate>
    </div>
  );
};

// ═══ Sub-components ═══

function GameCard({ game, index, copiedIdx, onCopy, onSave, expanded, onToggle }: {
  game: ScoredGame; index: number; copiedIdx: number | null;
  onCopy: () => void; onSave: () => void; expanded: boolean; onToggle: () => void;
}) {
  const gradeColor = {
    S: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    A: "bg-green-500/20 text-green-400 border-green-500/30",
    B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    C: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    D: "bg-red-500/20 text-red-400 border-red-500/30",
    F: "bg-red-700/20 text-red-600 border-red-700/30",
  }[game.grade];

  return (
    <div className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2">
        <Badge className={`${gradeColor} shrink-0 font-bold`}>{game.grade}</Badge>
        <span className="font-mono text-sm flex-1">{game.numbers.join(" - ")}</span>
        <span className="text-sm font-semibold text-primary">{formatNumber(game.totalScore)}pts</span>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onCopy}>
          {copiedIdx === index ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onSave}>Salvar</Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggle}>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2 text-xs">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <ScoreItem label="Estatístico" value={formatNumber(game.scores.statistical)} />
            <ScoreItem label="Estrutural" value={formatNumber(game.scores.structural)} />
            <ScoreItem label="Cobertura" value={formatNumber(game.scores.coverage)} />
            <ScoreItem label="Diversidade" value={formatNumber(game.scores.diversity)} />
            <ScoreItem label="Estratégia" value={formatNumber(game.scores.strategyFit)} />
            <ScoreItem label="Probabilidade" value={formatNumber(game.scores.probability)} />
          </div>
          <div className="space-y-1 text-muted-foreground">
            {game.explanation.map((line, i) => <p key={i}>{line}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreItem({ label, value }: { label: string; value: string | number }) {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  const color = numValue >= 70 ? "text-green-500" : numValue >= 40 ? "text-amber-500" : "text-red-500";
  return (
    <div className="text-center">
      <p className={`font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 text-center border">
      <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function AnalysisTab({ draws, lotteryId, stats, config }: any) {
  const [result, setResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [window, setWindow] = useState(100);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await nativeAI.process({
        input: `analise os últimos ${window} concursos`,
        lotteryId, draws, stats, config,
      });
      setResult(response);
    } catch { toast.error("Erro na análise"); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Análise Histórica — {config.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Janela: {formatNumber(window)} concursos</label>
            <Slider value={[window]} onValueChange={v => setWindow(v[0])} min={10} max={500} step={10} />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAnalyze} disabled={loading || draws.length === 0} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
              Analisar
            </Button>
          </div>
        </div>

        {result?.analysis && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="bg-muted/30 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">🔥 Números Quentes</p>
                <p className="font-mono text-sm">{result.analysis.hotNumbers.slice(0, 8).join(", ")}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">❄️ Números Frios</p>
                <p className="font-mono text-sm">{result.analysis.coldNumbers.slice(0, 8).join(", ")}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">⏰ Atrasados</p>
                <p className="font-mono text-sm">{result.analysis.dueNumbers.slice(0, 8).join(", ")}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <StatBox icon={TrendingUp} label="Soma Média" value={formatNumber(result.analysis.avgSum)} />
              <StatBox icon={BarChart3} label="Pares Médio" value={formatNumber(result.analysis.avgEven)} />
              <StatBox icon={Target} label="Repetição Média" value={formatNumber(result.analysis.avgRepeat)} />
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
              <h4 className="font-semibold">Padrões:</h4>
              {result.analysis.patterns.map((p, i) => <p key={i} className="text-muted-foreground">• {p}</p>)}
              <h4 className="font-semibold mt-3">Recomendações:</h4>
              {result.analysis.recommendations.map((r, i) => <p key={i} className="text-muted-foreground">• {r}</p>)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AIAnalystPage;
