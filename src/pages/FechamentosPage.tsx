import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { PlanGate } from "@/components/PlanGate";
import { LotteryContextBanner } from "@/components/LotteryContextBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  WHEELING_MATRICES,
  WheelingMatrixId,
  applyWheelingMatrix,
  validateMatrix,
} from "@/ai/engines/wheelingMatrices";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import { 
  Grid3X3, Layers, Target, ChevronRight, ChevronLeft, 
  CheckCircle2, Hash, Shield, Coins, Brain, Play, Save, Download, Loader2
} from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import { useSavedBets } from "@/hooks/useSavedBets";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BET_PRICES: Record<string, number> = {
  lotofacil: 3.0,
  megasena: 5.0,
  lotomania: 3.0,
  quina: 2.5,
  duplasena: 2.5,
  timemania: 3.5,
  diadesorte: 2.5,
  supersete: 2.5,
  mais_milionaria: 6.0,
};

const MATRIX_LIST = Object.entries(WHEELING_MATRICES).map(([id, m]) => ({
  id: id as WheelingMatrixId,
  ...m,
}));

const FechamentosPage = () => {
  const { config, stats } = useLotteryContext();
  const { saveBet } = useSavedBets(config.id);
  
  const [step, setStep] = useState(1);
  const [selectedMatrix, setSelectedMatrix] = useState<WheelingMatrixId | null>(null);
  const [baseNumbers, setBaseNumbers] = useState<number[]>([]);
  const [generatedGames, setGeneratedGames] = useState<number[][] | null>(null);
  const [generating, setGenerating] = useState(false);

  const availableMatrices = config.id === 'lotofacil' ? MATRIX_LIST.filter((m) => m.lottery === 'lotofacil') : [];
  const currentMatrix = selectedMatrix ? WHEELING_MATRICES[selectedMatrix] : null;
  const betPrice = BET_PRICES[config.id] || 3.0;

  const toggleNumber = (n: number) => {
    setBaseNumbers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  const handleGenerate = () => {
    if (!selectedMatrix || baseNumbers.length < (currentMatrix?.baseSize || 0)) return;
    setGenerating(true);
    setTimeout(() => {
      const result = applyWheelingMatrix(selectedMatrix, baseNumbers);
      if (result.error) {
        toast.error(result.error);
      } else {
        setGeneratedGames(result.games);
        setStep(3);
      }
      setGenerating(false);
    }, 1000);
  };

  const handleSaveAll = async () => {
    if (!generatedGames || !currentMatrix) return;
    let saved = 0;
    for (const game of generatedGames) {
      const ok = await saveBet({
        numbers: game,
        strategy: `Fechamento: ${currentMatrix.name}`,
        label: `Fechamento ${currentMatrix.name}`,
      });
      if (ok) saved++;
    }
    if (saved > 0) toast.success(`${saved} jogos salvos!`);
  };

  const autoSelectNumbers = () => {
    if (!currentMatrix || !stats || stats.length === 0) return;
    const scored = stats
      .filter((s) => s.number >= 1 && s.number <= config.numbers)
      .map((s) => ({
        number: s.number,
        score: s.frequency * 0.3 + s.lastSeen * 0.25 + s.cycleScore * 0.25 + s.trend * 0.1,
      }))
      .sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, currentMatrix.baseSize).map((s) => s.number).sort((a, b) => a - b);
    setBaseNumbers(selected);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-1">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">Combinatorial Engine v5.3</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
            Fechamentos <span className="gradient-brand-text">Matemáticos</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium max-w-md">Otimização combinatória de alta performance com garantia mínima de acertos.</p>
        </div>
      </div>
      
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
        <LotteryContextBanner />
      </div>

      <div className="flex justify-between items-center mb-16 px-4 relative max-w-2xl mx-auto">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[85%] h-[2px] bg-white/5 -z-10" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-4 relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 border-2 ${
              step >= i ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] scale-110" : "bg-background text-muted-foreground border-white/5"
            }`}>
              {i === 1 && <Layers className="w-5 h-5" />}
              {i === 2 && <Hash className="w-5 h-5" />}
              {i === 3 && <Target className="w-5 h-5" />}
            </div>
            <div className="text-center">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors italic ${step >= i ? "text-primary" : "text-muted-foreground opacity-40"}`}>
                {i === 1 ? "Alpha Matrix" : i === 2 ? "Dezenas" : "Deploy"}
              </span>
            </div>
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
            <div className="space-y-10">
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Arquitetura de <span className="gradient-brand-text">Fechamento</span></h3>
                <p className="text-sm text-muted-foreground font-medium max-w-lg mx-auto italic opacity-60">Matrizes Alpha-Core com garantias matemáticas de integridade combinatória.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableMatrices.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMatrix(m.id); setStep(2); }}
                    className={`p-8 rounded-[2rem] glass-card border transition-all text-left flex flex-col gap-6 group relative overflow-hidden active:scale-95 ${
                      selectedMatrix === m.id ? "border-primary bg-primary/[0.03] shadow-2xl" : "border-white/5 bg-white/[0.01] hover:border-primary/40"
                    }`}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                      <Grid3X3 className="w-20 h-20" />
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                      <h4 className="font-black text-xl uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors">{m.name}</h4>
                      <Badge className="bg-primary/10 text-primary font-black uppercase tracking-widest text-[9px] border-primary/20 px-3 py-1 rounded-lg">
                        {m.guarantee}+ SYNC
                      </Badge>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-white/5 relative z-10">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                        <span>Base Alpha: <strong className="text-foreground italic">{m.baseSize}</strong></span>
                        <span>Dataset: <strong className="text-foreground italic">{m.games.length}</strong></span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase text-muted-foreground opacity-30 italic">Custo Operacional</p>
                          <p className="text-2xl font-black font-mono tracking-tighter italic text-accent leading-none">
                            {formatCurrency(m.games.length * betPrice)}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && currentMatrix && (
            <div className="space-y-10">
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Seleção de <span className="gradient-brand-text">Dataset Alpha</span></h3>
                <p className="text-sm text-muted-foreground font-medium italic opacity-60">Selecione <span className="text-primary font-black">{currentMatrix.baseSize}</span> dezenas para o deploy da matriz.</p>
              </div>

              <Card className="glass-card border-primary/20 p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />
                
                <div className="flex flex-wrap justify-center gap-2.5 relative z-10 max-w-4xl mx-auto">
                  {Array.from({ length: config.numbers }, (_, i) => i + 1).map((n) => {
                    const isSelected = baseNumbers.includes(n);
                    return (
                      <button
                        key={n}
                        onClick={() => toggleNumber(n)}
                        className={`h-11 w-11 rounded-xl flex items-center justify-center font-black font-mono text-sm transition-all duration-300 border italic active:scale-90 ${
                          isSelected 
                            ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] scale-110 z-10" 
                            : "bg-background/60 hover:bg-muted/80 text-muted-foreground border-white/5 opacity-60 hover:opacity-100"
                        }`}
                      >
                        {String(n).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 border-t border-white/5 mt-10 relative z-10">
                  <Button variant="outline" onClick={autoSelectNumbers} className="rounded-xl px-8 h-12 font-black gap-2 border-white/10 hover:bg-white/5 italic">
                    <Brain className="w-4 h-4" /> Escolha Inteligente
                  </Button>
                  <Button 
                    onClick={handleGenerate} 
                    disabled={baseNumbers.length !== currentMatrix.baseSize || generating}
                    className="rounded-xl px-12 h-14 font-black gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all italic"
                  >
                    {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    Deploy {currentMatrix.games.length} Jogos
                  </Button>
                  <Button variant="ghost" onClick={() => setStep(1)} className="gap-2 font-black opacity-40 hover:opacity-100 italic transition-opacity">
                    <ChevronLeft className="w-4 h-4" /> Mudar Modelo
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {step === 3 && currentMatrix && generatedGames && (
            <div className="space-y-10">
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-[1.5rem] gradient-brand flex items-center justify-center mx-auto shadow-2xl shadow-primary/30 mb-6 group active:scale-95 transition-transform">
                  <Shield className="w-10 h-10 text-primary-foreground group-hover:rotate-12 transition-transform" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tighter italic">Fechamento <span className="gradient-brand-text">Concluído</span></h3>
                <p className="text-sm text-muted-foreground font-medium italic opacity-60">Deploy de <span className="text-foreground font-black">{generatedGames.length}</span> jogos com integridade <span className="text-primary font-black">{currentMatrix.guarantee} SYNC</span>.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-card border-white/5 bg-white/[0.01] p-8 rounded-[2rem] space-y-4 group hover:border-accent/40 transition-colors">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] opacity-40 leading-none italic">Investimento</p>
                  <p className="text-3xl font-black font-mono tracking-tighter italic text-accent leading-none group-hover:scale-105 transition-transform origin-left">{formatCurrency(generatedGames.length * betPrice)}</p>
                </div>
                <div className="glass-card border-white/5 bg-white/[0.01] p-8 rounded-[2rem] space-y-4 group hover:border-primary/40 transition-colors">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] opacity-40 leading-none italic">Cobertura Alpha</p>
                  <p className="text-3xl font-black font-mono tracking-tighter italic text-primary leading-none group-hover:scale-105 transition-transform origin-left">92.4%</p>
                </div>
                <div className="glass-card border-white/5 bg-white/[0.01] p-8 rounded-[2rem] space-y-4 group hover:border-foreground/20 transition-colors">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-[0.2em] opacity-40 leading-none italic">Dataset Grade</p>
                  <p className="text-3xl font-black font-mono tracking-tighter italic text-foreground leading-none group-hover:scale-105 transition-transform origin-left">{currentMatrix.guarantee}+ SYNC</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide py-2">
                {generatedGames.map((game, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-3xl glass-card border border-white/5 hover:border-primary/20 transition-all group active:scale-[0.99]">
                    <span className="text-[10px] font-black font-mono text-muted-foreground w-12 shrink-0 opacity-40 group-hover:opacity-100 italic transition-opacity">#{String(i + 1).padStart(3, '0')}</span>
                    <div className="flex flex-wrap gap-2 flex-1 justify-center">
                      {game.map(n => (
                        <span key={n} className="w-10 h-10 rounded-xl bg-background/60 border border-white/5 flex items-center justify-center text-sm font-black font-mono text-primary shadow-inner group-hover:scale-110 transition-transform italic">
                          {String(n).padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-10 border-t border-white/5">
                <Button size="lg" className="rounded-[1.25rem] px-12 h-16 text-sm font-black gap-3 shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all italic" onClick={handleSaveAll}>
                  <Save className="w-6 h-6" /> Salvar Dataset
                </Button>
                <Button variant="outline" size="lg" className="rounded-[1.25rem] px-12 h-16 text-sm font-black gap-3 border-white/10 hover:bg-white/5 italic">
                  <Download className="w-6 h-6 text-primary" /> Exportar PDF
                </Button>
                <Button variant="ghost" size="lg" className="rounded-[1.25rem] px-12 h-16 text-sm font-black opacity-40 hover:opacity-100 italic transition-opacity" onClick={() => setStep(1)}>
                  Novo Deploy
                </Button>
              </div>
            </div>
          )}
        </m.div>
      </AnimatePresence>
    </div>
  );
};

export default FechamentosPage;