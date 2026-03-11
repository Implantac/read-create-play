import { useState, useMemo } from "react";
import { NumberStats } from "@/engine/statistics";
import { exportToPdf } from "@/engine/pdf-export";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import {
  generateProfessionalBets,
  ProfessionalBet,
  getClosurePresetsForLottery,
  generateClosure,
  selectBaseNumbersForClosure,
} from "@/engine/professional-generator";
import { GenerationFilters, DEFAULT_FILTERS, betMatchesFilters } from "@/engine/generation-filters";
import { GeneratorFiltersPanel } from "@/components/GeneratorFiltersPanel";
import { HistoricalValidationBadge } from "@/components/HistoricalValidationBadge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Sparkles, Target, Layers, Copy, Check, ChevronDown, ChevronUp,
  Zap, Brain, TrendingUp, Clock, Shuffle, Grid3X3, BarChart3, Loader2, Download,
  Shield, Star, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const GRADE_COLORS: Record<string, string> = {
  S: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  A: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  B: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  C: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  D: "text-red-400 bg-red-400/10 border-red-400/30",
  F: "text-red-600 bg-red-600/10 border-red-600/30",
};

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  frequencia: TrendingUp,
  atraso: Clock,
  ia: Brain,
  simulacao: BarChart3,
  hibrido: Shuffle,
};

export function ProfessionalGeneratorPanel({ stats, config, draws }: Props) {
  const [bets, setBets] = useState<ProfessionalBet[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [expandedBet, setExpandedBet] = useState<number | null>(null);
  const [betsPerStrategy, setBetsPerStrategy] = useState(2);
  const [filters, setFilters] = useState<GenerationFilters>({ ...DEFAULT_FILTERS });
  // Closures
  const [closureResult, setClosureResult] = useState<number[][] | null>(null);
  const [closureGenerating, setClosureGenerating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(0);

  const closurePresets = useMemo(
    () => getClosurePresetsForLottery(config.id),
    [config.id]
  );

  const handleGenerate = () => {
    setGenerating(true);
    // Use setTimeout to avoid blocking UI
    setTimeout(() => {
      const result = generateProfessionalBets(stats, config, draws, betsPerStrategy);
      setBets(result);
      setGenerating(false);
      toast.success(`${result.length} apostas profissionais geradas!`);
    }, 50);
  };

  const handleGenerateClosure = () => {
    if (closurePresets.length === 0) return;
    setClosureGenerating(true);
    setTimeout(() => {
      const preset = closurePresets[selectedPreset];
      const baseNumbers = selectBaseNumbersForClosure(stats, preset.baseNumbers, config, draws);
      const combinations = generateClosure(baseNumbers, preset.pick, preset.guarantee);
      setClosureResult(combinations);
      setClosureGenerating(false);
      toast.success(`Fechamento gerado: ${combinations.length} jogos`);
    }, 50);
  };

  const copyBet = (bet: number[], index: number) => {
    navigator.clipboard.writeText(bet.join(" - "));
    setCopied(index);
    toast.success("Aposta copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllBets = () => {
    const text = bets.map((b, i) =>
      `#${b.rank} [${b.quality.grade}] ${b.strategyLabel}: ${b.numbers.join(" - ")} (Score: ${b.statisticalScore})`
    ).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Todas as apostas copiadas!");
  };

  const handleExportBets = () => {
    if (bets.length === 0) return;
    exportToPdf({
      title: `Apostas Profissionais - ${config.name}`,
      subtitle: `${bets.length} apostas geradas com ${betsPerStrategy} jogos por estratégia`,
      config,
      bets: bets.map(b => ({ numbers: b.numbers, strategy: b.strategyLabel, score: b.statisticalScore, grade: b.quality.grade })),
      type: "apostas",
    });
  };

  const handleExportClosure = () => {
    if (!closureResult) return;
    const preset = closurePresets[selectedPreset];
    exportToPdf({
      title: `Fechamento ${preset.name} - ${config.name}`,
      subtitle: `${preset.baseNumbers} dezenas base → ${closureResult.length} jogos`,
      config,
      bets: closureResult.map(c => ({ numbers: c })),
      type: "fechamento",
    });
  };

  const copyAllClosure = () => {
    if (!closureResult) return;
    const text = closureResult.map((c, i) => `Jogo ${i + 1}: ${c.join(" - ")}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Fechamento copiado!");
  };

  const formatProbability = (p: number): string => {
    if (p >= 0.01) return `${(p * 100).toFixed(2)}%`;
    if (p >= 0.0001) return `1 em ${Math.round(1 / p).toLocaleString()}`;
    return `1 em ${(1 / p).toExponential(1)}`;
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Gerador Profissional de Apostas
            </h3>
            <p className="text-xs text-muted-foreground">
              Múltiplas estratégias • Scoring • Ranking • Fechamentos
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="generator" className="text-xs gap-1">
            <Sparkles className="w-3 h-3" /> Gerador Pro
          </TabsTrigger>
          <TabsTrigger value="closure" className="text-xs gap-1">
            <Shield className="w-3 h-3" /> Fechamentos
          </TabsTrigger>
        </TabsList>

        {/* ═══ GERADOR PROFISSIONAL ═══ */}
        <TabsContent value="generator" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Jogos/estratégia:</span>
              {[1, 2, 3, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setBetsPerStrategy(n)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    betsPerStrategy === n
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || draws.length === 0}
              className="gap-1.5 text-xs"
              size="sm"
            >
              {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Gerar Apostas Profissionais
            </Button>
            {bets.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={copyAllBets} className="text-xs gap-1">
                  <Copy className="w-3 h-3" /> Copiar todas
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportBets} className="text-xs gap-1">
                  <Download className="w-3 h-3" /> PDF
                </Button>
              </>
            )}
          </div>

          {/* Bets list */}
          <AnimatePresence mode="wait">
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {bets.map((bet, i) => {
                const isExpanded = expandedBet === i;
                const CategoryIcon = CATEGORY_ICONS[
                  bet.strategy === "hot" ? "frequencia" :
                  bet.strategy === "lowDelay" ? "atraso" :
                  ["ml", "hybrid"].includes(bet.strategy) ? "ia" :
                  ["trend", "cycle"].includes(bet.strategy) ? "simulacao" : "hibrido"
                ] || Sparkles;

                return (
                  <motion.div
                    key={`${i}-${bet.numbers.join(",")}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-lg bg-secondary/30 border border-border overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-2 p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                      onClick={() => setExpandedBet(isExpanded ? null : i)}
                    >
                      {/* Rank */}
                      <div className="flex items-center gap-1 w-8">
                        {bet.rank <= 3 ? (
                          <Award className={`w-4 h-4 ${
                            bet.rank === 1 ? "text-yellow-400" :
                            bet.rank === 2 ? "text-gray-400" :
                            "text-amber-600"
                          }`} />
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">#{bet.rank}</span>
                        )}
                      </div>

                      {/* Grade */}
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${GRADE_COLORS[bet.quality.grade]}`}>
                        {bet.quality.grade}
                      </span>

                      {/* Strategy */}
                      <CategoryIcon className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground hidden sm:inline truncate max-w-[100px]">
                        {bet.strategyLabel}
                      </span>

                      {/* Numbers */}
                      <div className="flex flex-wrap gap-1 flex-1">
                        {bet.numbers.map(n => {
                          const stat = stats.find(s => s.number === n);
                          const ballClass =
                            stat?.status === "hot" ? "lottery-ball-hot" :
                            stat?.status === "cold" ? "lottery-ball-cold" : "";
                          return (
                            <span key={n} className={`lottery-ball text-[10px] w-7 h-7 ${ballClass}`}>
                              {String(n).padStart(2, "0")}
                            </span>
                          );
                        })}
                      </div>

                      {/* Score */}
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-bold text-foreground">{bet.statisticalScore}</div>
                        <div className="text-[9px] text-muted-foreground">score</div>
                      </div>

                      {/* Copy */}
                      <button
                        onClick={(e) => { e.stopPropagation(); copyBet(bet.numbers, i); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {copied === i ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-border"
                        >
                          <div className="p-3 space-y-3">
                            {/* Score bar */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">Score Estatístico</div>
                                <div className="text-lg font-bold text-foreground">{bet.statisticalScore}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">Qualidade</div>
                                <div className="text-lg font-bold text-foreground">{bet.quality.overall}/100</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">Probabilidade</div>
                                <div className="text-xs font-mono font-bold text-foreground mt-1">
                                  {formatProbability(bet.probabilityEstimate)}
                                </div>
                              </div>
                            </div>

                            {/* Quality dimensions */}
                            <div className="space-y-1.5">
                              {bet.quality.dimensions.map((dim, di) => (
                                <div key={di} className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-32 truncate">{dim.name}</span>
                                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        dim.score >= 70 ? "bg-primary" :
                                        dim.score >= 40 ? "bg-yellow-500" : "bg-red-500"
                                      }`}
                                      style={{ width: `${dim.score}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{dim.score}</span>
                                </div>
                              ))}
                            </div>

                            {/* Warnings & Strengths */}
                            {bet.quality.strengths.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {bet.quality.strengths.map((s, si) => (
                                  <span key={si} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                    ✓ {s}
                                  </span>
                                ))}
                              </div>
                            )}
                            {bet.quality.warnings.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {bet.quality.warnings.map((w, wi) => (
                                  <span key={wi} className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                                    ⚠ {w}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>

          {bets.length === 0 && !generating && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Star className="w-6 h-6 mx-auto mb-2 opacity-40" />
              Clique em "Gerar" para criar apostas com scoring e ranking
            </div>
          )}
        </TabsContent>

        {/* ═══ FECHAMENTOS MATEMÁTICOS ═══ */}
        <TabsContent value="closure" className="space-y-4">
          {closurePresets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Shield className="w-6 h-6 mx-auto mb-2 opacity-40" />
              Fechamentos disponíveis para: Mega Sena, Lotofácil, Quina, Lotomania
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Selecione o tipo de fechamento para <span className="text-foreground font-medium">{config.name}</span>:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {closurePresets.map((preset, pi) => (
                    <button
                      key={pi}
                      onClick={() => setSelectedPreset(pi)}
                      className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                        selectedPreset === pi
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                {closurePresets[selectedPreset] && (
                  <p className="text-[10px] text-muted-foreground">
                    {closurePresets[selectedPreset].baseNumbers} dezenas base → jogos de {closurePresets[selectedPreset].pick} →
                    garante {closurePresets[selectedPreset].guarantee} acertos se {closurePresets[selectedPreset].ifHit} saírem
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateClosure}
                  disabled={closureGenerating || draws.length === 0}
                  className="gap-1.5 text-xs"
                  size="sm"
                >
                  {closureGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
                  Gerar Fechamento
                </Button>
                {closureResult && (
                  <>
                    <Button size="sm" variant="outline" onClick={copyAllClosure} className="text-xs gap-1">
                      <Copy className="w-3 h-3" /> Copiar todos
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleExportClosure} className="text-xs gap-1">
                      <Download className="w-3 h-3" /> PDF
                    </Button>
                  </>
                )}
              </div>

              {closureResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">
                      {closureResult.length} jogos gerados
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      Custo: {closureResult.length} apostas
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {closureResult.map((combo, ci) => (
                      <motion.div
                        key={ci}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: ci * 0.02 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border"
                      >
                        <span className="text-[10px] text-muted-foreground font-mono w-8">
                          J{String(ci + 1).padStart(2, "0")}
                        </span>
                        <div className="flex flex-wrap gap-1 flex-1">
                          {combo.map(n => (
                            <span key={n} className="lottery-ball text-[10px] w-6 h-6">
                              {String(n).padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => copyBet(combo, 1000 + ci)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {copied === 1000 + ci ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
