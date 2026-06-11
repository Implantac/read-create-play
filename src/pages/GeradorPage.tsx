import { useState, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { m, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronRight, ChevronLeft, Target, Settings2, Hash, Play, Save, History as HistoryIcon } from "lucide-react";
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
    { id: "balance", name: "Aposta Equilibrada", desc: "Distribuição estatística otimizada por rede neural." },
    { id: "predictive", name: "Estatística Preditiva", desc: "Foco em tendências de alta probabilidade baseadas em IA." },
    { id: "aggressive", name: "Aposta IA Premium", desc: "Modelos avançados para busca de convergência máxima." },
    { id: "conservative", name: "Aposta Conservadora", desc: "Baseada em frequência histórica estável e ciclos de retorno." },
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
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Titan Engine v4.0 Alpha</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-tight">
            Motor de <span className="gradient-brand-text">Geração</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-lg leading-relaxed">
            Análises baseadas em dados históricos, estatística, probabilidade e inteligência artificial para auxiliar na sua tomada de decisão estratégica.
          </p>
        </div>
      </div>

      
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
        <LotteryContextBanner />
      </div>

      <div className="mb-10 px-4 space-y-6">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          <div className="flex gap-8">
            <span className={step >= 1 ? "text-primary" : ""}>01. Dataset</span>
            <span className={step >= 2 ? "text-primary" : ""}>02. Engine</span>
            <span className={step >= 3 ? "text-primary" : ""}>03. Volume</span>
            <span className={step >= 4 ? "text-primary" : ""}>04. Resultado</span>
          </div>
          <span>{Math.round((step / 4) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <m.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
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
            <Card className="p-10 space-y-8 max-w-3xl mx-auto border-white/5 glass-card relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <HistoryIcon className="w-32 h-32 rotate-12" />
              </div>
              
              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="w-24 h-24 rounded-3xl gradient-brand flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
                  <span className="text-5xl drop-shadow-lg">{config.icon}</span>
                </div>
                
                <div className="space-y-3">
                  <Badge variant="outline" className="px-3 py-1 text-[10px] font-black tracking-widest uppercase border-primary/30 text-primary">Etapa 01: Validação de Dataset</Badge>
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic">Sincronização: {config.name}</h3>
                  <p className="text-muted-foreground text-base max-w-lg mx-auto">
                    Base de dados oficial atualizada com {draws.length} concursos. O motor está pronto para processar milhões de combinações.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status Base</p>
                    <p className="text-sm font-black text-emerald-400">100% Sincronizada</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Último Processo</p>
                    <p className="text-sm font-black">Concurso #{draws[0]?.concurso || '---'}</p>
                  </div>
                </div>

                <Button onClick={nextStep} variant="premium" className="h-16 px-16 group w-full sm:w-auto">
                  Configurar Engine Analítica
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>

          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <Badge variant="outline" className="px-3 py-1 text-[10px] font-black tracking-widest uppercase border-primary/30 text-primary mb-2">Etapa 02: Seleção de Engine</Badge>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Configurar Algoritmo</h3>
                <p className="text-muted-foreground">O motor Titan utilizará o modelo escolhido para processar milhões de possibilidades.</p>
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
            <Card className="glass-panel border-primary/20 p-8 space-y-8">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="px-3 py-1 text-[10px] font-black tracking-widest uppercase border-primary/30 text-primary mb-2">Etapa 03: Dimensionamento</Badge>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Volume de Processamento</h3>
                <p className="text-muted-foreground">Quantas combinações de alta convergência você deseja gerar agora?</p>
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
                  className="px-16 h-16 group"

                >
                  {generating ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 fill-current" />
                      Gerar {quantity} Jogo{quantity > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
                <Button variant="ghost" onClick={prevStep} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Alterar Estratégia
                </Button>
              </div>
            </Card>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in zoom-in duration-500">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/40 mb-4">
                  <Target className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Predições Finalizadas</h3>
                <p className="text-muted-foreground">As combinações abaixo apresentam as maiores probabilidades estatísticas baseadas no Titan Score.</p>
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
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Titan Score</p>
                            <p className={`text-2xl font-black italic leading-none ${res.score >= 90 ? 'text-emerald-400' : res.score >= 75 ? 'text-primary' : 'text-amber-400'}`}>{res.score}/100</p>
                            <p className="text-[8px] font-black uppercase text-emerald-400 tracking-widest mt-1">{res.score >= 90 ? 'Excelente Oportunidade' : res.score >= 75 ? 'Alta Convergência' : 'Estatística Estável'}</p>
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