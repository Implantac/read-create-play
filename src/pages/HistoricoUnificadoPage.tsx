import { useState, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  History, ClipboardCheck, Star, 
  Calendar, Trophy, Search, FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { m, AnimatePresence } from "framer-motion";

// Lazy imports for sub-pages components
const ResultadosView = lazy(() => import("@/pages/HistoricoPage"));
const MinhasApostasView = lazy(() => import("@/pages/HistoricoApostasPage"));
const JogosSalvosView = lazy(() => import("@/pages/JogosSalvosPage"));

const LazyFallback = () => (
  <div className="space-y-6 animate-pulse">
    <Skeleton className="h-[100px] w-full rounded-xl" />
    <Skeleton className="h-[400px] w-full rounded-2xl" />
  </div>
);

const HistoricoUnificadoPage = () => {
  const { config } = useLotteryContext();
  const [activeTab, setActiveTab] = useState("resultados");

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      <PageHeader
        title="Histórico e Registros"
        description="Acompanhe resultados, suas apostas e performance acumulada"
        icon={History}
        badge="CENTRAL DE REGISTROS"
      />
      
      <LotteryContextBanner />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide mb-6 p-1 bg-muted/30 rounded-2xl border border-border/40">
          <TabsList className="bg-transparent h-auto p-0 flex gap-1">
            <TabsTrigger value="resultados" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest transition-all gap-2 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              Sorteios Oficiais
            </TabsTrigger>
            <TabsTrigger value="apostas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest transition-all gap-2 shrink-0">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Conferidor / Auditoria
            </TabsTrigger>
            <TabsTrigger value="salvos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl py-3 px-6 text-xs font-black uppercase tracking-widest transition-all gap-2 shrink-0">
              <Star className="w-3.5 h-3.5" />
              Ativos / Jogos Salvos
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
                <TabsContent value="resultados" className="m-0 border-none p-0 focus-visible:ring-0">
                  <ResultadosView />
                </TabsContent>
                <TabsContent value="apostas" className="m-0 border-none p-0 focus-visible:ring-0">
                  <MinhasApostasView />
                </TabsContent>
                <TabsContent value="salvos" className="m-0 border-none p-0 focus-visible:ring-0">
                  <JogosSalvosView />
                </TabsContent>
              </Suspense>
            </m.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
};

export default HistoricoUnificadoPage;