import { useState, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { m, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronRight, ChevronLeft, Target, Settings2, Hash, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSavedBets } from "@/hooks/useSavedBets";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import { toast } from "sonner";

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const GeradorPage = () => {
  const { config, stats, draws, selectedLottery, setSelectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);
  const { saveGeneration } = useGenerationHistory(selectedLottery);
  const location = useLocation();
  
  const [step, setStep] = useState(1);
  const [strategy, setStrategy] = useState<string>("balance");

  useEffect(() => {
    if (location.state?.fromOnboarding) {
      if (location.state.lotteryId && location.state.lotteryId !== selectedLottery) {
        setSelectedLottery(location.state.lotteryId);
      }
      setStep(2);
    }
  }, [location.state, selectedLottery, setSelectedLottery]);




  const [quantity, setQuantity] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const STRATEGIES = [
    { id: "balance", name: "Equilíbrio Neural", desc: "Melhor distribuição estatística" },
    { id: "frequency", name: "Alta Frequência", desc: "Foco nas dezenas mais sorteadas" },
    { id: "delay", name: "Atraso Crítico", desc: "Dezenas que não saem há tempo" },
    { id: "coverage", name: "Cobertura Total", desc: "Máxima diversificação" },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    // Artificial delay for premium feel
    setTimeout(async () => {
      try {
        const result = runIntelligentPipeline(stats, draws, selectedLottery, strategy, quantity);
        if (result.games.length > 0) {
          const processedResults = result.games.map(bet => {
            const quality = evaluateBetQuality(bet, stats, config, draws);
            return {
              numbers: bet,
              score: quality.overall,
              strategy: STRATEGIES.find(s => s.id === strategy)?.name || "Personalizada",
              grade: quality.grade,
              description: result.strategy.description,
              pipeline: result.pipeline
            };
          });
          setResults(processedResults);
          
          // Save only the first one to history automatically
          await saveGeneration(processedResults[0]);
          
          setStep(4);
        }
      } catch (error) {
        toast.error("Erro ao gerar jogos. Tente novamente.");
      } finally {
        setGenerating(false);
      }
    }, 1500);
  };

  const handleSaveAll = async () => {
    for (const res of results) {
      await saveBet({
        numbers: res.numbers,
        strategy: res.strategy,
        score: res.score,
        grade: res.grade
      });
    }
    toast.success(`${results.length} jogos salvos no seu portfólio!`);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-1">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Neural Generator v6.0</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-tight">
            Assistente de <span className="gradient-brand-text">Geração</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Configure seu fluxo de predição. O motor Titan utiliza heurísticas avançadas para maximizar a convergência matemática.
          </p>
        </div>
      </div>

      
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
        <LotteryContextBanner />
      </div>

      <div className="flex justify-between items-center mb-10 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-3 relative z-10">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${
              step >= i ? "bg-primary text-primary-foreground shadow-premium shadow-primary/20 scale-110" : "bg-secondary text-muted-foreground border border-border/40"
            }`}>
              {i}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${step >= i ? "text-primary" : "text-muted-foreground opacity-40"}`}>
              {i === 1 ? "Loteria" : i === 2 ? "Estratégia" : i === 3 ? "Volume" : "Resultado"}
            </span>
            {i < 4 && <div className={`absolute top-6 left-16 w-full h-[1px] hidden md:block ${step > i ? "bg-primary" : "bg-border/40"}`} style={{ width: 'calc(100% + 1rem)' }} />}
          </div>
        ))}

      </div>

      <AnimatePresence mode="wait">
        <m.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <Card className="p-10 text-center space-y-8 max-w-2xl mx-auto border-primary/20 bg-primary/5">
              <div className="w-24 h-24 rounded-3xl gradient-brand flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 rotate-3">
                <span className="text-5xl drop-shadow-lg">{config.icon}</span>
              </div>
              <div className="space-y-3">
                <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest italic mb-2">Step 01: Dataset Definition</Badge>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Dataset: {config.name}</h3>
                <p className="text-muted-foreground text-base max-w-md mx-auto">O motor USE AI está pronto para processar dezenas {config.name} com as melhores métricas de convergência para o próximo SKU de mercado.</p>
              </div>
              <Button onClick={nextStep} variant="premium" className="h-16 px-16 group rounded-full shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                Configurar Motor de Predição
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>

          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center space-y-3 mb-10">
                <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest italic mb-2">Step 02: Engine Selection</Badge>
                <h3 className="text-xl font-black uppercase tracking-tighter">Selecione o Motor de Predição</h3>
                <p className="text-muted-foreground text-sm opacity-60 max-w-sm mx-auto">Escolha a heurística que governará a síntese da sua nova coleção de jogos.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStrategy(s.id); nextStep(); }}
                    className={`p-8 rounded-[2.5rem] glass-card border transition-all text-left flex items-start gap-6 hover:border-primary/60 group relative overflow-hidden ${
                      strategy === s.id ? "border-primary/60 bg-primary/10 ring-2 ring-primary/20 shadow-premium-hover" : "border-border/40"
                    }`}
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 relative z-10 ${
                      strategy === s.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 rotate-6" : "bg-secondary group-hover:bg-primary/20 group-hover:text-primary"
                    }`}>
                      <Settings2 className="w-7 h-7" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-black text-xl uppercase tracking-tight italic mb-1">{s.name}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-start">
                <Button variant="ghost" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <Card className="glass-panel border-primary/20 p-10 space-y-10 rounded-[2.5rem]">
              <div className="text-center space-y-3">
                <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest italic mb-2">Step 03: Production Volume</Badge>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Volume de Produção</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">Quantas combinações de elite você deseja que a IA gere para esta estratégia?</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 5, 10, 20].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`p-6 rounded-xl border-2 transition-all font-black text-2xl ${
                      quantity === q ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-border/40 hover:border-primary/20"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex flex-col items-center gap-6 pt-6">
                <Button 
                  size="lg" 
                  onClick={handleGenerate} 
                  disabled={generating}
                  variant="premium"
                  className="px-16 h-20 group rounded-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin mr-3" />
                      Sintetizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 mr-3 fill-current" />
                      Iniciar Síntese Neural
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={prevStep} className="gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 italic">
                  <ChevronLeft className="w-3 h-3" /> Redefinir Engine
                </Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in zoom-in duration-500">
              <div className="text-center space-y-4">
                <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest italic mb-2">Step 04: Synthesis Output</Badge>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/40 mb-6 shadow-2xl shadow-emerald-500/20">
                  <Target className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Coleção Sintetizada!</h3>
                <p className="text-muted-foreground font-medium opacity-60">O Quality Score médio das combinações é superior a 85%.</p>
              </div>

              <div className="space-y-4">
                {results.map((res, i) => (
                  <Card key={i} className="glass-panel border-border/40 hover:border-primary/30 transition-all overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {res.numbers.map((n: number) => (
                            <div key={n} className="lottery-ball">
                              {String(n).padStart(2, '0')}
                            </div>

                          ))}
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Efficiency</p>
                            <p className="text-2xl font-black text-primary italic">{res.score}%</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                              saveBet({ numbers: res.numbers, strategy: res.strategy, score: res.score, grade: res.grade });
                              toast.success("Jogo salvo!");
                            }}
                            className="rounded-xl hover:bg-primary/10"
                          >
                            <Save className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" className="rounded-xl px-12 font-black gap-2" onClick={handleSaveAll}>
                  Salvar Todos no Portfólio
                </Button>
                <Button variant="outline" size="lg" className="rounded-xl px-12 font-black" onClick={() => setStep(1)}>
                  Novo Ciclo de Geração
                </Button>
              </div>
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
};

export default GeradorPage;