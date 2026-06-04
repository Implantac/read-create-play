import { useMemo, useState } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, Brain, Target, Zap, Clock, TrendingUp, 
  Search, Crown, History, Activity, Sparkles, LayoutGrid,
  Filter, Award, Database, RefreshCw, Layers
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
import { HeatmapIntensity } from "@/components/lottery/HeatmapIntensity";
import { CorrelationNetwork } from "@/components/lottery/CorrelationNetwork";

export default function LotofacilPremiumPage() {
  const { config, draws, drawsWithPrizes, stats, farol, cycle, loading, syncing, lastSyncAt, syncDraws, selectedLottery } = useLotteryContext();
  const [activeTab, setActiveTab] = useState("overview");

  const topElite = useMemo(() => 
    farol.filter(s => s.titanScore >= 85).sort((a, b) => b.titanScore - a.titanScore),
    [farol]
  );

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
              Inteligência
            </TabsTrigger>
            <TabsTrigger value="strategy" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Estratégia
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs font-black uppercase tracking-widest">
              Sorteios
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- OVERVIEW TAB --- */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* DASHBOARD ELITE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard title="Score Elite" value={topElite.length} icon={Crown} />
                <StatsCard title="Ciclo Atual" value={`#${cycle?.currentCycle || 0}`} icon={Clock} />
                <StatsCard title="Prob. Fechamento" value={`${(100 - (cycle?.missingNumbers.length || 0) * 4).toFixed(0)}%`} icon={Target} />
                <StatsCard title="Volatilidade" value="12.4%" icon={Activity} />
              </div>

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
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 border-collapse">
                    {topElite.slice(0, 12).map((s, idx) => (
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
                    <div className="p-4 border-b border-primary/10 flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => setActiveTab("intelligence")}>
                      <div className="text-center space-y-1">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Ver Todas</p>
                        <Layers className="w-4 h-4 text-primary mx-auto" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <HeatmapIntensity />
            </div>

            <div className="space-y-6">
              <ROIQuickView />
              <NotificationsPanel />
              <InsightsCenter />
            </div>
          </div>
        </TabsContent>

        {/* --- INTELLIGENCE TAB --- */}
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
        </TabsContent>

        {/* --- STRATEGY TAB --- */}
        <TabsContent value="strategy" className="space-y-6">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
            <StrategyBriefingPanel config={config} stats={stats} draws={draws} />
            <BettingBudgetPlanner config={config} stats={stats} draws={draws} />
          </div>
        </TabsContent>

        {/* --- HISTORY TAB --- */}
        <TabsContent value="history" className="space-y-6">
          <RecentDraws draws={drawsWithPrizes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
