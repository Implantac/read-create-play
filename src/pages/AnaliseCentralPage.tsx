import { useState, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, Zap, Grid3X3, Brain, Bot, 
  BarChart3, Activity, TrendingUp, Search, Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { m, AnimatePresence } from "framer-motion";

// Lazy imports for sub-pages components
const EstatisticasView = lazy(() => import("@/pages/EstatisticasPage"));
const FarolView = lazy(() => import("@/pages/FarolEstatisticoPage"));
const MatrizView = lazy(() => import("@/pages/MatrizAnalisePage"));
const IAAutonomaView = lazy(() => import("@/pages/IAAutonomaPage"));
const AIAnalystView = lazy(() => import("@/pages/AIAnalystPage"));

const LazyFallback = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-[200px] w-full rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Skeleton className="h-[100px] rounded-xl" />
      <Skeleton className="h-[100px] rounded-xl" />
      <Skeleton className="h-[100px] rounded-xl" />
      <Skeleton className="h-[100px] rounded-xl" />
    </div>
    <Skeleton className="h-[400px] w-full rounded-2xl" />
  </div>
);

const AnaliseCentralPage = () => {
  const { config } = useLotteryContext();
  const [activeTab, setActiveTab] = useState("farol");

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <PageHeader
        title="Central de Análise"
        description="Inteligência de dados, estatísticas e visão neural completa"
        icon={BarChart3}
        badge="TITAN ANALYTICS"
      />
      
      <LotteryContextBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide mb-6 p-1 bg-muted/30 rounded-2xl border border-border/40">
          <TabsList className="bg-transparent h-auto p-0 flex gap-1">
            <TabsTrigger value="farol" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest transition-all gap-2 shrink-0">
              <Zap className="w-3.5 h-3.5" />
              Farol Neural
            </TabsTrigger>
            <TabsTrigger value="estatisticas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest transition-all gap-2 shrink-0">
              <PieChart className="w-3.5 h-3.5" />
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="matriz" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest transition-all gap-2 shrink-0">
              <Grid3X3 className="w-3.5 h-3.5" />
              Matriz HP
            </TabsTrigger>
            <TabsTrigger value="ia" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest transition-all gap-2 shrink-0">
              <Bot className="w-3.5 h-3.5" />
              IA Analista
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<LazyFallback />}>
                <TabsContent value="farol" className="m-0 border-none p-0 focus-visible:ring-0">
                  <FarolView />
                </TabsContent>
                <TabsContent value="estatisticas" className="m-0 border-none p-0 focus-visible:ring-0">
                  <EstatisticasView />
                </TabsContent>
                <TabsContent value="matriz" className="m-0 border-none p-0 focus-visible:ring-0">
                  <MatrizView />
                </TabsContent>
                <TabsContent value="ia" className="m-0 border-none p-0 focus-visible:ring-0">
                  <div className="space-y-8">
                    <AIAnalystView />
                    <div className="pt-10 border-t border-border/40">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black uppercase tracking-tighter">Motor Neural Autônomo</h3>
                          <p className="text-xs text-muted-foreground">Detecção de anomalias e padrões de alta frequência</p>
                        </div>
                      </div>
                      <IAAutonomaView />
                    </div>
                  </div>
                </TabsContent>
              </Suspense>
            </m.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
};

export default AnaliseCentralPage;