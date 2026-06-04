import { useMemo, useState, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, Brain, Target, Zap, Clock, TrendingUp, 
  Search, Crown, History, Activity, Sparkles, LayoutGrid,
  Filter, Award, Database, RefreshCw, Layers, Loader2,
  TrendingDown, Shield, FileText, Share2 as Share, Play,
  Cpu, Terminal as TerminalIcon, AlertCircle, CheckCircle2,
  Table2, Save, FileSpreadsheet
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/common/StatsCard";
import { StrategyBriefingPanel } from "@/components/StrategyBriefingPanel";
import { BettingBudgetPlanner } from "@/components/BettingBudgetPlanner";
import { InsightsCenter } from "@/components/InsightsCenter";
import { ROIQuickView } from "@/components/ROIQuickView";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { RecentDraws } from "@/components/RecentDraws";
import { cn } from "@/lib/utils";
import { HeatmapIntensity } from "@/components/lottery/HeatmapIntensity";
import { CorrelationNetwork } from "@/components/lottery/CorrelationNetwork";
import { computeMatrixAnalysis } from "@/engine/matrix-analysis";
import { MatrizAnaliseTable } from "@/components/MatrizAnaliseTable";
import { FarolDezenas } from "@/components/FarolDezenas";
import { useSavedBets } from "@/hooks/useSavedBets";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  analyzeWorksheetGames,
  generateWorksheetMatrixGames,
  getPresetInputSize,
  LOTOFACIL_WORKSHEET_PRESETS,
  selectTopLotofacilNumbers,
} from "@/engine/worksheet-matrices";

const IntelligentGeneratorPanel = lazy(() => import("@/components/IntelligentGeneratorPanel").then(m => ({ default: m.IntelligentGeneratorPanel })));
const EvolutiveGeneratorPanel = lazy(() => import("@/components/EvolutiveGeneratorPanel").then(m => ({ default: m.EvolutiveGeneratorPanel })));
const AIPredictionPanel = lazy(() => import("@/components/AIPredictionPanel").then(m => ({ default: m.AIPredictionPanel })));
const ProfessionalGeneratorPanel = lazy(() => import("@/components/ProfessionalGeneratorPanel").then(m => ({ default: m.ProfessionalGeneratorPanel })));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-12 text-muted-foreground bg-secondary/5 rounded-2xl border border-dashed border-border/40">
    <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
    <span className="text-xs font-black uppercase tracking-widest italic">Iniciando Motor Neural...</span>
  </div>
);

export default function LotofacilPremiumPage() {
  const { config, draws, drawsWithPrizes, stats, farol, cycle, loading, syncing, lastSyncAt, syncDraws, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);
  const [activeTab, setActiveTab] = useState("overview");
  const [presetId, setPresetId] = useState(LOTOFACIL_WORKSHEET_PRESETS[0].id);
  const [worksheetNumbers, setWorksheetNumbers] = useState<number[]>([]);
  const [worksheetDrawConcurso, setWorksheetDrawConcurso] = useState<string>("latest");
  const [worksheetSaving, setWorksheetSaving] = useState(false);

  const handleSaveBet = (numbers: number[], strategy?: string, score?: number, grade?: string) => {
    saveBet({ numbers, strategy, score, grade });
  };

  const topElite = useMemo(() => 
    farol.filter(s => s.titanScore >= 85).sort((a, b) => b.titanScore - a.titanScore),
    [farol]
  );

  const matrixData = useMemo(
    () => computeMatrixAnalysis(draws, config.numbers),
    [draws, config.numbers]
  );

  const rankedNumbers = useMemo(() => matrixData.map((row) => row.number), [matrixData]);
  const preset = LOTOFACIL_WORKSHEET_PRESETS.find((item) => item.id === presetId) ?? LOTOFACIL_WORKSHEET_PRESETS[0];
  const worksheetInputSize = getPresetInputSize(preset);

  const worksheetSelectedDraw = useMemo(() => {
    if (worksheetDrawConcurso === "latest") return draws[0] ?? null;
    return draws.find((draw) => String(draw.concurso) === worksheetDrawConcurso) ?? draws[0] ?? null;
  }, [draws, worksheetDrawConcurso]);

  const worksheetPreviousDraw = useMemo(() => {
    if (!worksheetSelectedDraw) return null;
    const idx = draws.findIndex((draw) => draw.concurso === worksheetSelectedDraw.concurso);
    return idx >= 0 ? draws[idx + 1] ?? null : null;
  }, [draws, worksheetSelectedDraw]);

  const generatedWorksheetGames = useMemo(
    () => generateWorksheetMatrixGames(preset, worksheetNumbers),
    [preset, worksheetNumbers],
  );

  const worksheetAnalysis = useMemo(
    () => analyzeWorksheetGames(generatedWorksheetGames, worksheetSelectedDraw, worksheetPreviousDraw),
    [generatedWorksheetGames, worksheetSelectedDraw, worksheetPreviousDraw],
  );

  const canGenerateWorksheet = worksheetNumbers.length >= worksheetInputSize && generatedWorksheetGames.length > 0;

  const autoSelectWorksheet = () => {
    const numbers = selectTopLotofacilNumbers(rankedNumbers, worksheetInputSize);
    setWorksheetNumbers(numbers);
  };

  const toggleWorksheetNumber = (number: number) => {
    setWorksheetNumbers((prev) => {
      if (prev.includes(number)) return prev.filter((item) => item !== number);
      if (prev.length >= worksheetInputSize) return prev;
      return [...prev, number].sort((a, b) => a - b);
    });
  };

  const saveAllWorksheetGames = async () => {
    if (!canGenerateWorksheet) return;
    setWorksheetSaving(true);
    let saved = 0;
    for (const game of generatedWorksheetGames) {
      const ok = await saveBet({
        numbers: game,
        strategy: `Planilha Matriz: ${preset.label}`,
        label: `${preset.sheetName} J${saved + 1}`,
      });
      if (ok) saved++;
    }
    setWorksheetSaving(false);
    if (saved > 0) toast.success(`${saved} jogos salvos.`);
  };

  if (selectedLottery !== "lotofacil") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Experiência Premium Indisponível</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          A interface de alta performance Titan está atualmente otimizada exclusivamente para a Lotofácil.
        </p>
        <Button 
          variant="outline" 
          className="mt-6 border-primary/20 hover:bg-primary/10"
          onClick={() => window.location.href = "/"}
        >
          Voltar ao Terminal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
              Titan Neural Core v5.3
            </div>
            <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-black text-amber-500 uppercase tracking-widest">
              Top Tier Optimization
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter italic uppercase flex items-baseline gap-2">
            Lotofácil <span className="text-primary text-xl md:text-2xl not-italic">Premium</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-2xl">
            Ambiente unificado de inteligência preditiva, fechamentos matemáticos e análise de fluxo neural para máxima performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => syncDraws()}
            disabled={syncing}
            className="h-11 px-5 rounded-xl border-primary/20 bg-primary/5 text-xs font-black uppercase tracking-widest gap-2"
          >
            {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? "Sincronizando" : "Sincronizar"}
          </Button>
          <Button className="h-11 px-8 rounded-xl gradient-brand text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
            Exportar BI
          </Button>
        </div>
      </div>

      <LotteryContextBanner />

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="bg-secondary/20 border border-border/40 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Overview
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="strategy" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Finanças
            </TabsTrigger>
            <TabsTrigger value="matrix" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Análise HP
            </TabsTrigger>
            <TabsTrigger value="generation" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Geradores
            </TabsTrigger>
            <TabsTrigger value="spreadsheets" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Planilhas
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Sorteios
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- OVERVIEW TAB --- */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Score Elite" value={topElite.length} icon={Crown} />
            <StatsCard title="Ciclo Atual" value={`#${cycle?.currentCycle || 0}`} icon={Clock} />
            <StatsCard title="Prob. Fechamento" value={`${(100 - (cycle?.missingNumbers.length || 0) * 4).toFixed(0)}%`} icon={Target} />
            <StatsCard title="Estabilidade" value="98.2%" icon={Shield} />
          </div>

          <div className="grid xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              {/* TITAN COMMAND CENTER (COMPACT) */}
              <Card className="glass-card border-primary/20 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <CardHeader className="pb-2 border-b border-primary/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <TerminalIcon className="w-4 h-4" />
                      Titan Command Center (Neural Feed)
                    </CardTitle>
                    <Badge variant="outline" className="animate-pulse border-emerald-500/50 text-emerald-400 bg-emerald-500/5 text-[8px] font-black uppercase">
                      SYSTEM ACTIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {[
                      { icon: Zap, text: "Sincronização global concluída. 3.142 sorteios indexados.", type: "success" },
                      { icon: Brain, text: "Rede neural detectou desvio de 12% na frequência das dezenas moldura.", type: "info" },
                      { icon: Target, text: "Ciclo #512 em estágio final. 4 dezenas restantes para fechamento.", type: "warning" },
                      { icon: Activity, text: "Titan Score recalibrado para o concurso #3121.", type: "info" },
                    ].map((feed, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/10 border border-border/40 group hover:border-primary/20 transition-all">
                        <div className={`p-1.5 rounded-lg bg-background/50 border border-border/40 shrink-0 group-hover:scale-110 transition-transform`}>
                          <feed.icon className={`w-3.5 h-3.5 ${feed.type === 'success' ? 'text-emerald-400' : feed.type === 'warning' ? 'text-amber-400' : 'text-primary'}`} />
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                          <span className="text-foreground/80 font-black uppercase tracking-widest text-[8px] mr-2 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                          {feed.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAROL SUMMARY */}
              <Card className="glass-card border-primary/20 bg-primary/5 overflow-hidden">
                <CardHeader className="pb-2 border-b border-primary/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                      <Zap className="w-4 h-4 animate-pulse" />
                      Dezenas de Elite (Titan Score ≥ 85)
                    </CardTitle>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[9px] font-black uppercase">
                      Alpha Signal
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 border-collapse">
                    {topElite.slice(0, 11).map((s, idx) => (
                      <div key={s.number} className="p-4 border-r border-b border-primary/10 hover:bg-primary/10 transition-colors group">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground font-mono font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                            {String(s.number).padStart(2, "0")}
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] font-black text-foreground tracking-tighter">{s.titanScore} pts</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">{s.titanGrade}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 border-b border-primary/10 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => setActiveTab("matrix")}>
                      <div className="text-center space-y-1">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Matriz HP</p>
                        <LayoutGrid className="w-4 h-4 text-primary mx-auto" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <HeatmapIntensity />
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-background to-secondary/10 border border-primary/30 shadow-2xl shadow-primary/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                  <Cpu className="w-20 h-20" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-4 italic">
                  <Brain className="w-4 h-4 text-primary" />
                  Titan Core Briefing
                </h4>
                <div className="space-y-4 relative z-10">
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium italic border-l-2 border-primary/40 pl-3">
                    "Identificamos um padrão de compensação no quadrante superior direito. 
                    Recomendamos priorizar dezenas de transição para o próximo sorteio."
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Frequência +", "Delay Low", "Momentum S"].map(t => (
                      <Badge key={t} variant="secondary" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black uppercase tracking-tighter">{t}</Badge>
                    ))}
                  </div>
                </div>
                <Button className="w-full mt-6 h-10 rounded-xl gradient-brand text-primary-foreground font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20" onClick={() => setActiveTab("generation")}>
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  Iniciar Geração Elite
                </Button>
              </div>

              <ROIQuickView />
              <NotificationsPanel />
              <InsightsCenter />
            </div>
          </div>
        </TabsContent>

        {/* --- STATISTICS TAB --- */}
        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <CorrelationNetwork />
            <div className="space-y-6">
              <Card className="glass-panel border-accent/20 bg-accent/5">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent" />
                    Análise Preditiva Neural
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-background/50 border border-accent/10">
                    <p className="text-sm font-medium leading-relaxed italic text-foreground/90">
                      "O modelo de regressão não-linear aponta para uma concentração de 
                      dezenas na moldura (pares) para o próximo concurso. A saturação 
                      de ciclo sugere que os números [05, 12, 18, 24] têm 84% de chance 
                      de reaparecer."
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Confiança do Motor</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-accent/10 border border-accent/20 overflow-hidden">
                          <div className="h-full bg-accent animate-pulse" style={{ width: '87%' }} />
                        </div>
                        <span className="text-xs font-black text-accent">87%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Qualidade dos Dados</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '99%' }} />
                        </div>
                        <span className="text-xs font-black text-emerald-500">99%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/20">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4">Mapeamento de Tendências</h4>
                <div className="space-y-4">
                  {[
                    { label: "Dezenas da Moldura", val: 9, max: 15, color: "bg-primary" },
                    { label: "Dezenas do Miolo", val: 6, max: 9, color: "bg-accent" },
                    { label: "Números Primos", val: 5, max: 9, color: "bg-emerald-500" },
                    { label: "Sequência Fibbonaci", val: 4, max: 7, color: "bg-orange-500" },
                  ].map(item => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-foreground">{item.val} de {item.max}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full", item.color)} style={{ width: `${(item.val / item.max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <HeatmapIntensity />
            <InsightsCenter />
          </div>
        </TabsContent>

        {/* --- FINANCE TAB --- */}
        <TabsContent value="strategy" className="space-y-6">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
            <div className="space-y-6">
              <BettingBudgetPlanner config={config} stats={stats} draws={draws} />
              <ROIQuickView />
            </div>
            <div className="space-y-6">
              <StrategyBriefingPanel config={config} stats={stats} draws={draws} />
              <NotificationsPanel />
            </div>
          </div>
        </TabsContent>

        {/* --- HP ANALYSIS TAB --- */}
        <TabsContent value="matrix" className="space-y-6">
          <Card className="glass-card border-primary/20 overflow-hidden">
            <CardHeader className="border-b border-primary/10 bg-primary/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                  Matriz de Alta Performance
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30">SCORE V9.0</Badge>
                  <Badge className="bg-accent/20 text-accent border-accent/30">QUANTUM STATS</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                <FarolDezenas
                  data={matrixData}
                  totalNumbers={config.numbers}
                  pickSize={config.pick}
                  onSaveBet={(numbers, strategy, score) => handleSaveBet(numbers, strategy, score)}
                />
                <div className="pt-4">
                  <MatrizAnaliseTable data={matrixData} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- GENERATORS TAB --- */}
        <TabsContent value="generation" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Suspense fallback={<LazyFallback />}>
              <IntelligentGeneratorPanel stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />
            </Suspense>
            <Suspense fallback={<LazyFallback />}>
              <AIPredictionPanel config={config} stats={stats} draws={draws} onSaveBet={handleSaveBet} />
            </Suspense>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Suspense fallback={<LazyFallback />}>
              <EvolutiveGeneratorPanel stats={stats} config={config} draws={draws} lotteryId={selectedLottery} />
            </Suspense>
            <Suspense fallback={<LazyFallback />}>
              <ProfessionalGeneratorPanel stats={stats} config={config} draws={draws} onSaveBet={handleSaveBet} />
            </Suspense>
          </div>
        </TabsContent>

        {/* --- SPREADSHEETS TAB --- */}
        <TabsContent value="spreadsheets" className="space-y-6">
          <div className="grid xl:grid-cols-[0.8fr_1.2fr] gap-6">
            <Card className="glass-card border-border/60 bg-card/40">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Modelos de Planilha (Farol)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Modelo Selecionado</span>
                    <Select
                      value={preset.id}
                      onValueChange={(value) => {
                        setPresetId(value);
                        setWorksheetNumbers([]);
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOTOFACIL_WORKSHEET_PRESETS.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label} - {item.gameCount} jogos
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">{preset.description}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Conferir contra Concurso</span>
                    <Select value={worksheetDrawConcurso} onValueChange={setWorksheetDrawConcurso}>
                      <SelectTrigger className="h-11 rounded-xl bg-background/50 border-border/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="latest">Último concurso ({draws[0]?.concurso})</SelectItem>
                        {draws.slice(0, 30).map((draw) => (
                          <SelectItem key={draw.concurso} value={String(draw.concurso)}>
                            #{draw.concurso} - {new Date(draw.date).toLocaleDateString("pt-BR")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-background/40 border border-border/40 text-center">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Escolher</p>
                    <p className="text-xl font-black text-foreground">{worksheetInputSize}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40 border border-border/40 text-center">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Jogos</p>
                    <p className="text-xl font-black text-foreground">{preset.gameCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/40 border border-border/40 text-center">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Custo</p>
                    <p className="text-sm font-black text-accent">R$ {(preset.gameCount * 3).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={autoSelectWorksheet} className="gap-2 flex-1 rounded-xl h-11 gradient-brand font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                    <Sparkles className="w-4 h-4" />
                    Auto-seleção Neural
                  </Button>
                  <Button variant="outline" className="rounded-xl h-11 px-5 border-border/40 text-[10px] font-black uppercase tracking-widest" onClick={() => setWorksheetNumbers([])}>
                    Limpar
                  </Button>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/10 border border-border/40">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Seletor de Dezenas</span>
                    <Badge variant={worksheetNumbers.length === worksheetInputSize ? "default" : "outline"} className="font-mono h-5">
                      {worksheetNumbers.length}/{worksheetInputSize}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {Array.from({ length: 25 }, (_, i) => i + 1).map((number) => {
                      const selected = worksheetNumbers.includes(number);
                      const disabled = !selected && worksheetNumbers.length >= worksheetInputSize;
                      return (
                        <button
                          key={number}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleWorksheetNumber(number)}
                          className={`aspect-square rounded-xl border-2 text-xs font-black font-mono transition-all duration-300 ${
                            selected
                              ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                              : disabled
                                ? "bg-muted/20 text-muted-foreground/20 border-transparent cursor-not-allowed"
                                : "bg-background/50 border-border/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {String(number).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="glass-card border-border/60 bg-card/40 overflow-hidden">
                <CardHeader className="border-b border-border/10 bg-secondary/5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Auditoria de Matriz
                    </CardTitle>
                    <Button size="sm" onClick={saveAllWorksheetGames} disabled={!canGenerateWorksheet || worksheetSaving} className="h-9 px-6 rounded-xl gradient-brand text-primary-foreground font-black uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 gap-2">
                      <Save className="w-3.5 h-3.5" />
                      {worksheetSaving ? "Salvando..." : "Salvar todos os jogos"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {!canGenerateWorksheet ? (
                    <div className="p-20 text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-muted/20 border border-dashed border-border/40 flex items-center justify-center mx-auto opacity-40">
                        <Target className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-medium text-muted-foreground max-w-xs mx-auto leading-relaxed">
                        Configure o modelo e selecione as dezenas para processar a auditoria em tempo real.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/20 hover:bg-secondary/20 border-b border-border/40">
                            <TableHead className="w-12 py-4 px-4 font-black text-[9px] uppercase tracking-widest">ID</TableHead>
                            <TableHead className="py-4 px-4 font-black text-[9px] uppercase tracking-widest">Matriz Combinatória</TableHead>
                            <TableHead className="text-center py-4 px-4 font-black text-[9px] uppercase tracking-widest">Hits</TableHead>
                            <TableHead className="text-center py-4 px-4 font-black text-[9px] uppercase tracking-widest hidden md:table-cell">Soma</TableHead>
                            <TableHead className="text-center py-4 px-4 font-black text-[9px] uppercase tracking-widest hidden md:table-cell">P/I</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {worksheetAnalysis.games.map((game) => (
                            <TableRow key={game.index} className="hover:bg-primary/5 transition-colors border-b border-border/20 group">
                              <TableCell className="font-black text-[10px] text-muted-foreground px-4 italic opacity-40">
                                J{String(game.index).padStart(2, "0")}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {game.numbers.map((number) => {
                                    const hit = worksheetSelectedDraw?.numbers.includes(number);
                                    return (
                                      <span
                                        key={number}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black font-mono transition-all group-hover:scale-105 ${
                                          hit 
                                            ? "bg-primary border border-primary/50 text-primary-foreground shadow-sm shadow-primary/20" 
                                            : "bg-muted/40 border border-border/20 text-muted-foreground opacity-80"
                                        }`}
                                      >
                                        {String(number).padStart(2, "0")}
                                      </span>
                                    );
                                  })}
                                </div>
                              </TableCell>
                              <TableCell className="text-center px-4">
                                <Badge className={`font-black font-mono text-[11px] h-6 px-2 italic ${
                                  game.hits >= 13 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" :
                                  game.hits >= 11 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                  "bg-muted/30 text-muted-foreground border border-border/40"
                                }`}>
                                  {game.hits}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center font-mono text-[10px] font-black text-muted-foreground px-4 hidden md:table-cell opacity-60">
                                {game.sum}
                              </TableCell>
                              <TableCell className="text-center font-mono text-[10px] font-black text-muted-foreground px-4 hidden md:table-cell opacity-60">
                                {game.even}/{game.odd}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {canGenerateWorksheet && (
                <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <Table2 className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Distribuição Neural</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Object.entries(worksheetAnalysis.hitDistribution)
                          .sort(([a], [b]) => Number(b) - Number(a))
                          .map(([hits, count]) => (
                            <Badge key={hits} variant="outline" className="text-[9px] font-black border-accent/30 text-accent bg-accent/5 px-2">
                              {hits} acertos: {count}x
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">Melhor Resultado</p>
                    <p className="text-2xl font-black text-accent italic">{worksheetAnalysis.bestHits} acertos</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <RecentDraws draws={drawsWithPrizes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
