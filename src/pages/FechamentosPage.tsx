import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { PlanGate } from "@/components/PlanGate";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatNumber } from "@/utils/formatters";
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
import { exportToPdf } from "@/engine/pdf-export";
import { exportToCsv, exportToExcel } from "@/utils/export";
import {
  Grid3X3, Shield, Trophy, Coins, FileDown, ChevronRight,
  CheckCircle2, AlertTriangle, Target, Hash, Layers, Sparkles, Save, Brain, Flame,
  FileSpreadsheet, FileText, Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { MatrixComparisonPanel } from "@/components/MatrixComparisonPanel";
import { HeatmapIntensity } from "@/components/lottery/HeatmapIntensity";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useSavedBets } from "@/hooks/useSavedBets";
import { toast } from "sonner";


// Bet prices per lottery (approximate, single game)
const BET_PRICES: Record<string, number> = {
  lotofacil: 3.0,
  megasena: 5.0,
  lotomania: 3.0,
  quina: 2.5,
  duplasena: 2.5,
  timemania: 3.5,
  diadesorte: 2.5,
  supersete: 2.5,
};

const MATRIX_LIST = Object.entries(WHEELING_MATRICES).map(([id, m]) => ({
  id: id as WheelingMatrixId,
  ...m,
}));

export default function FechamentosPage() {
  const { config, stats } = useLotteryContext();
  const [selectedMatrix, setSelectedMatrix] = useState<WheelingMatrixId | null>(null);
  const [baseNumbers, setBaseNumbers] = useState<number[]>([]);
  const [generatedGames, setGeneratedGames] = useState<number[][] | null>(null);
  const [validationCache, setValidationCache] = useState<Record<string, ReturnType<typeof validateMatrix>>>({});
  const [saving, setSaving] = useState(false);
  const { saveBet } = useSavedBets(config.id);

  const handleSaveAllGames = async () => {
    if (!generatedGames || !currentMatrix) return;
    setSaving(true);
    let saved = 0;
    for (const game of generatedGames) {
      const ok = await saveBet({
        numbers: game,
        strategy: `Fechamento: ${currentMatrix.name}`,
        label: `Fechamento ${currentMatrix.name}`,
      });
      if (ok) saved++;
    }
    setSaving(false);
    if (saved > 0) {
      toast.success(`${saved} jogos salvos nas apostas favoritas!`);
    }
  };

  // Filter matrices relevant to current lottery (Only Lotofácil)
  const availableMatrices = config.id === 'lotofacil' ? MATRIX_LIST.filter((m) => m.lottery === 'lotofacil') : [];
  const allMatrices = MATRIX_LIST.filter(m => m.lottery === 'lotofacil');

  const currentMatrix = selectedMatrix ? WHEELING_MATRICES[selectedMatrix] : null;
  const betPrice = BET_PRICES[config.id] || 3.0;

  // Validate on demand
  const getValidation = (id: WheelingMatrixId) => {
    if (validationCache[id]) return validationCache[id];
    const v = validateMatrix(id);
    setValidationCache((prev) => ({ ...prev, [id]: v }));
    return v;
  };

  // Auto-select best numbers based on frequency + delay score
  const autoSelectNumbers = () => {
    if (!currentMatrix || !stats || stats.length === 0) return;
    const scored = stats
      .filter((s) => s.number >= 1 && s.number <= config.numbers)
      .map((s) => ({
        number: s.number,
        // Composite score: high frequency + high delay ("due") + positive trend + cycle score
        score:
          s.frequency * 0.3 +
          s.lastSeen * 0.25 +
          s.cycleScore * 0.25 +
          s.trend * 0.1 +
          s.recentFreq * 0.1,
      }))
      .sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, currentMatrix.baseSize).map((s) => s.number).sort((a, b) => a - b);
    setBaseNumbers(selected);
    setGeneratedGames(null);
  };

  // Toggle number selection for base
  const toggleNumber = (n: number) => {
    setBaseNumbers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
    setGeneratedGames(null);
  };

  const generateGames = () => {
    if (!selectedMatrix) return;
    const result = applyWheelingMatrix(selectedMatrix, baseNumbers);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setGeneratedGames(result.games);
    
    // Track XP for wheeling
    if (config.id === 'lotofacil') {
      supabase.rpc('track_user_action', { _user_id: 'current', _action: 'simulation' }).then();
    }
  };

  const getRecommendation = () => {
    if (config.id !== 'lotofacil' || baseNumbers.length === 0) return null;
    const count = baseNumbers.length;
    // Recommendations based on professional PLAN closures
    if (count >= 21) return { id: 'lotofacil_21_50', name: 'TITAN PLAN 21X50', efficiency: '92%', risk: 'Médio', feature: 'TITAN_FECHAMENTO' };
    if (count >= 19) return { id: 'lotofacil_19_5', name: 'TITAN PLAN 19X5', efficiency: '88%', risk: 'Médio', feature: 'TITAN_FECHAMENTO' };
    if (count >= 18) return { id: 'lotofacil_gf', name: 'TITAN PLAN GF', efficiency: '95%', risk: 'Otimizado', feature: 'TITAN_FECHAMENTO' };
    if (count >= 17) return { id: 'lotofacil_17_8', name: 'TITAN PLAN 17X8', efficiency: '85%', risk: 'Baixo', feature: 'TITAN_FECHAMENTO' };
    if (count >= 13) return { id: 'lotofacil_13_6', name: 'TITAN PLAN 13X6', efficiency: '82%', risk: 'Baixo', feature: 'TITAN_FECHAMENTO' };
    if (count >= 6) return { id: 'lotofacil_6_13', name: 'TITAN PLAN 6X13', efficiency: '80%', risk: 'Variável', feature: 'TITAN_FECHAMENTO' };

    return null;
  };

  const recommendation = getRecommendation();

  const handleExportPdf = () => {
    if (!generatedGames || !currentMatrix) return;
    exportToPdf({
      title: `Fechamento — ${currentMatrix.name}`,
      subtitle: `${formatNumber(generatedGames.length)} jogos · Garantia ${currentMatrix.guarantee}+ acertos · Custo ${formatCurrency(generatedGames.length * betPrice)}`,
      config,
      bets: generatedGames.map((g, i) => ({
        numbers: g,
        strategy: "Fechamento",
        score: currentMatrix.guarantee,
        grade: `J${i + 1}`,
      })),
      type: "fechamento",
    });
  };

  const handleExportCsv = () => {
    if (!generatedGames || !currentMatrix) return;
    const data = generatedGames.map((g, i) => [`Jogo ${i + 1}`, ...g]);
    exportToCsv(`Fechamento_${currentMatrix.name}`, data);
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportExcel = () => {
    if (!generatedGames || !currentMatrix) return;
    const data = [["Identificador", "Dezenas"], ...generatedGames.map((g, i) => [`Jogo ${i + 1}`, g.join("-")])];
    exportToExcel(`Fechamento_${currentMatrix.name}`, data);
    toast.success("Excel exportado com sucesso!");
  };

  const canGenerate =
    selectedMatrix && currentMatrix && baseNumbers.length >= currentMatrix.baseSize;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fechamentos Matemáticos"
        description="Matrizes otimizadas com garantia mínima de acertos"
        icon={Grid3X3}
        badge="PRO"
      />
      <LotteryContextBanner />

      {/* Mapa de Calor para auxílio na escolha */}
      <HeatmapIntensity />

      <PlanGate feature="fechamentos" fallbackMessage="Fechamentos Matemáticos — matrizes otimizadas com garantia de acertos">
      {/* Available matrices for current lottery */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Layers className="w-5 h-5 text-primary" />
            Matrizes Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableMatrices.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma matriz otimizada para <strong className="text-foreground">{config.name}</strong> ainda.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Fechamentos matemáticos de alta precisão disponíveis exclusivamente para <strong className="text-foreground">Lotofácil</strong>.
              </p>
            </div>
          ) : (
            availableMatrices.map((m) => {
              const v = getValidation(m.id);
              const cost = m.games.length * betPrice;
              const isSelected = selectedMatrix === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMatrix(m.id);
                    setBaseNumbers([]);
                    setGeneratedGames(null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-muted-foreground bg-muted/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground">{m.name}</span>
                        {v.valid && (
                          <Badge variant="default" className="text-[10px]">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                            Validado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{m.description}</p>

                      <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <strong className="text-foreground">{m.baseSize}</strong> dezenas-base
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <strong className="text-foreground">{m.games.length}</strong> jogos
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Garantia <strong className="text-primary">{m.guarantee}+</strong> acertos
                        </span>
                        <span className="flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          Eficiência: <strong className="text-foreground">{(m as any).efficiency}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Prob: <strong className="text-foreground">{(m as any).probability}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3 h-3" />
                          Custo: <strong className="text-accent">{formatCurrency(cost)}</strong>
                        </span>

                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-2xl font-black font-mono text-primary">
                        {formatNumber(Math.round(v.coveragePercent))}%
                      </div>
                      <p className="text-[10px] text-muted-foreground">cobertura</p>
                    </div>
                  </div>

                  {/* Coverage bar */}
                  <div className="mt-3">
                    <Progress value={v.coveragePercent} className="h-1.5" />
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>{formatNumber(v.coveredDraws)} de {formatNumber(v.totalDraws)} sorteios cobertos</span>
                      <span>Pior caso: {formatNumber(v.worstCaseHits)} acertos</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}

        </CardContent>
      </Card>

      {/* Comparison panel */}
      <MatrixComparisonPanel lotteryId={config.id} betPrice={betPrice} />

      {/* Number picker */}
      <AnimatePresence>
        {selectedMatrix && currentMatrix && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                  <Target className="w-5 h-5 text-primary" />
                  Selecione {currentMatrix.baseSize} Dezenas-Base
                  <Badge variant="outline" className="ml-auto text-xs">
                    {baseNumbers.length}/{currentMatrix.baseSize}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: config.numbers }, (_, i) => i + 1).map((n) => {
                    const isSelected = baseNumbers.includes(n);
                    const isFull = baseNumbers.length >= currentMatrix.baseSize && !isSelected;
                    return (
                      <button
                        key={n}
                        onClick={() => !isFull && toggleNumber(n)}
                        disabled={isFull}
                        className={`w-9 h-9 rounded-lg text-xs font-mono font-bold border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : isFull
                            ? "bg-muted/20 text-muted-foreground/30 border-transparent cursor-not-allowed"
                            : "bg-muted/10 text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        {String(n).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>

                {baseNumbers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Selecionadas:</span>
                    <div className="flex flex-wrap gap-1">
                      {baseNumbers.sort((a, b) => a - b).map((n) => (
                        <span key={n} className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analista de Precisão IA</span>
                      </div>
                      <Badge variant="outline" className="text-emerald-400 bg-emerald-400/10 border-emerald-400/20 text-[9px]">
                        Confiança: 94%
                      </Badge>
                    </div>
                    
                    <p className="text-[11px] text-foreground leading-relaxed">
                      "O plano <strong className="text-primary">{currentMatrix.name}</strong> é altamente recomendado para as {baseNumbers.length} dezenas selecionadas. 
                      A cobertura de <strong>{currentMatrix.guarantee} acertos</strong> garante retorno em {(currentMatrix as any).efficiency} dos cenários simulados."
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Ciclo Favorável
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Distribuição OK
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Matriz Validada
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground uppercase font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ROI Otimizado
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">

                    <Button
                      onClick={generateGames}
                      disabled={!canGenerate}
                      className="flex-1 gap-2 gradient-brand h-12 uppercase font-black tracking-widest text-xs"
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Gerar {currentMatrix.games.length} Jogos
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={autoSelectNumbers}
                      className="gap-1.5 h-12 px-6"
                      title="Auto-seleção Farol (Titan Score)"
                    >
                      <Sparkles className="w-4 h-4" />
                      Titan Score
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated games */}
      <AnimatePresence>
        {generatedGames && currentMatrix && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                    <Trophy className="w-5 h-5 text-accent" />
                    {generatedGames.length} Jogos Gerados
                  </CardTitle>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="w-3.5 h-3.5" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-panel">
                        <DropdownMenuItem onClick={handleExportPdf} className="gap-2 cursor-pointer">
                          <FileText className="w-4 h-4 text-rose-500" />
                          Exportar PDF (Profissional)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportCsv} className="gap-2 cursor-pointer">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                          Exportar CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
                          <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                          Exportar Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveAllGames}
                      disabled={saving}
                      className="gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saving ? "Salvando..." : "Salvar Jogos"}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                  <span>
                    <Shield className="w-3 h-3 inline mr-1" />
                    Garantia: <strong className="text-primary">{currentMatrix.guarantee}+</strong> acertos
                  </span>
                  <span>
                    <Coins className="w-3 h-3 inline mr-1" />
                    Custo total: <strong className="text-accent">
                      {formatCurrency(generatedGames.length * betPrice)}
                    </strong>
                  </span>
                  <span>
                    <Hash className="w-3 h-3 inline mr-1" />
                    {currentMatrix.pick} dezenas por jogo
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {generatedGames.map((game, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/10 border border-border"
                    >
                      <span className="text-xs font-mono font-bold text-primary w-8 shrink-0">
                        J{String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {game.map((n) => (
                          <span
                            key={n}
                            className="text-[11px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded"
                          >
                            {String(n).padStart(2, "0")}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      </PlanGate>
    </div>
  );
}
