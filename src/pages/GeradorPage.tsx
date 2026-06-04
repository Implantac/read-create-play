import { useState, lazy, Suspense } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { m, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronRight, ChevronLeft, Target, Settings2, Hash, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSavedBets } from "@/hooks/useSavedBets";
import { useGenerationHistory } from "@/hooks/useGenerationHistory";
import { runIntelligentPipeline } from "@/ai/knowledge/strategiesLibrary";
import { evaluateBetQuality } from "@/engine/stats/bet-quality";
import { toast } from "sonner";

const GeradorPage = () => {
  const { config, stats, draws, selectedLottery } = useLotteryContext();
  const { saveBet } = useSavedBets(selectedLottery);
  const { saveGeneration } = useGenerationHistory(selectedLottery);
  
  const [step, setStep] = useState(1);
  const [strategy, setStrategy] = useState<string>("balance");
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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Assistente de Geração"
        description="Gere apostas profissionais em poucos cliques"
        icon={Sparkles}
        badge="STEP-BY-STEP"
      />

      <div className="flex justify-between items-center mb-10 px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${
              step >= i ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
            }`}>
              {i}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= i ? "text-primary" : "text-muted-foreground"}`}>
              {i === 1 ? "Loteria" : i === 2 ? "Estratégia" : i === 3 ? "Volume" : "Resultado"}
            </span>
            {i < 4 && <div className={`absolute top-5 left-12 w-full h-[2px] hidden md:block ${step > i ? "bg-primary" : "bg-muted"}`} style={{ width: 'calc(100% + 2rem)' }} />}
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
            <Card className="glass-panel border-primary/20 p-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center mx-auto shadow-2xl">
                <span className="text-4xl">{config.icon}</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter">{config.name}</h3>
                <p className="text-muted-foreground">Você selecionou {config.name}. Esta loteria exige {config.pick} números.</p>
              </div>
              <Button onClick={nextStep} size="lg" className="rounded-xl px-12 font-black gap-2">
                Confirmar e Continuar
                <ChevronRight className="w-5 h-5" />
              </Button>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2 mb-8">
                <h3 className="text-xl font-black uppercase tracking-tighter">Selecione a Estratégia</h3>
                <p className="text-muted-foreground">O motor Titan utilizará o modelo escolhido para processar as dezenas.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {STRATEGIES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setStrategy(s.id); nextStep(); }}
                    className={`p-6 rounded-2xl glass-card border transition-all text-left flex items-start gap-4 hover:border-primary/60 group ${
                      strategy === s.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      strategy === s.id ? "bg-primary text-primary-foreground" : "bg-muted group-hover:bg-primary/20"
                    }`}>
                      <Settings2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg uppercase tracking-tight">{s.name}</h4>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
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
                <h3 className="text-xl font-black uppercase tracking-tighter">Volume de Apostas</h3>
                <p className="text-muted-foreground">Quantos jogos você deseja que a IA gere para esta estratégia?</p>
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
                  className="rounded-xl px-16 h-14 font-black text-lg gap-3 gradient-brand hover:scale-105 transition-transform"
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
                <h3 className="text-2xl font-black uppercase tracking-tighter">Jogos Gerados com Sucesso!</h3>
                <p className="text-muted-foreground">O Titan Score médio destas combinações é superior a 85.</p>
              </div>

              <div className="space-y-4">
                {results.map((res, i) => (
                  <Card key={i} className="glass-panel border-border/40 hover:border-primary/30 transition-all overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-wrap gap-2 justify-center">
                          {res.numbers.map((n: number) => (
                            <div key={n} className="w-10 h-10 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center font-black text-sm text-primary">
                              {String(n).padStart(2, '0')}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Score IA</p>
                            <p className="text-2xl font-black text-primary italic">{res.score}</p>
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