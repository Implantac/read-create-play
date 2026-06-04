import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { PageHeader } from "@/components/PageHeader";
import { PlanGate } from "@/components/PlanGate";
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
import {
  Grid3X3, Shield, Trophy, Coins, FileDown, ChevronRight,
  CheckCircle2, AlertTriangle, Target, Hash, Layers, Sparkles, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MatrixComparisonPanel } from "@/components/MatrixComparisonPanel";
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

  // Filter matrices relevant to current lottery
  const availableMatrices = MATRIX_LIST.filter((m) => m.lottery === config.id);
  const allMatrices = MATRIX_LIST;

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
    if (count >= 21) return { id: 'lotofacil_21_50', name: 'PLAN 21X50', efficiency: '92%', risk: 'Médio' };
    if (count >= 19) return { id: 'lotofacil_19_5', name: 'PLAN 19X5', efficiency: '88%', risk: 'Médio' };
    if (count >= 17) return { id: 'lotofacil_17_8', name: 'PLAN 17X8', efficiency: '85%', risk: 'Baixo' };
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
                Matrizes disponíveis para: Lotofácil, Mega-Sena, Quina, Dupla Sena, Timemania, Lotomania
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

          {/* Other lotteries matrices (collapsed) */}
          {availableMatrices.length < allMatrices.length && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Ver matrizes de outras loterias ({allMatrices.length - availableMatrices.length})
              </summary>
              <div className="mt-2 space-y-2 opacity-60">
                {allMatrices
                  .filter((m) => m.lottery !== config.id)
                  .map((m) => (
                    <div key={m.id} className="p-3 rounded-lg border border-border bg-muted/5 text-sm">
                      <span className="font-semibold text-foreground">{m.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({m.games.length} jogos · garantia {m.guarantee}+)
                      </span>
                    </div>
                  ))}
              </div>
            </details>
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

                <div className="flex gap-2">
                  <Button
                    onClick={generateGames}
                    disabled={!canGenerate}
                    className="flex-1 gap-2"
                  >
                    <Grid3X3 className="w-4 h-4" />
                    Gerar {currentMatrix.games.length} Jogos
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={autoSelectNumbers}
                    className="gap-1.5"
                    title="Selecionar automaticamente as melhores dezenas com base em frequência, atraso e tendência"
                  >
                    <Sparkles className="w-4 h-4" />
                    Auto-Seleção
                  </Button>
                  {baseNumbers.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBaseNumbers([]);
                        setGeneratedGames(null);
                      }}
                    >
                      Limpar
                    </Button>
                  )}
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
                    <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5">
                      <FileDown className="w-3.5 h-3.5" />
                      Exportar PDF
                    </Button>
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
