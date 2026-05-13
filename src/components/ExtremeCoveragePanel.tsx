import { useState, useMemo, useCallback } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  runExtremeCoverage,
  CoverageConfig,
  CoverageResult,
  CoverageProfile,
  CoverageObjective,
  CoveragePriority,
} from "@/engine/extreme-coverage";
import { useSavedBets } from "@/hooks/useSavedBets";
import { exportToPdf } from "@/engine/pdf-export";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Target, Shield, Coins, FileDown, Save,
  Layers, TrendingUp, BarChart3, Info, ChevronDown, ChevronUp,
  Sparkles, AlertTriangle, CheckCircle2, Cpu,
} from "lucide-react";

const BET_PRICES: Record<string, number> = {
  lotofacil: 3.0, megasena: 5.0, lotomania: 3.0, quina: 2.5,
  duplasena: 2.5, timemania: 3.5, diadesorte: 2.5, supersete: 2.5,
};

const PROFILE_INFO: Record<CoverageProfile, { label: string; desc: string; icon: string }> = {
  economico: { label: "Econômico", desc: "Menos jogos, menor custo", icon: "💰" },
  equilibrado: { label: "Equilibrado", desc: "Melhor custo-benefício", icon: "⚖️" },
  agressivo: { label: "Agressivo", desc: "Alta cobertura", icon: "🔥" },
  extremo: { label: "Extremo", desc: "Cobertura máxima", icon: "⚡" },
};

const OBJECTIVE_OPTIONS: { value: CoverageObjective; label: string }[] = [
  { value: "geral", label: "Cobertura Geral" },
  { value: "pares", label: "Focada em Pares" },
  { value: "trincas", label: "Focada em Trincas" },
  { value: "quadras", label: "Focada em Quadras" },
  { value: "hibrido", label: "Híbrida" },
];

const PRIORITY_OPTIONS: { value: CoveragePriority; label: string }[] = [
  { value: "melhor_equilibrio", label: "Melhor Equilíbrio" },
  { value: "menor_custo", label: "Menor Custo" },
  { value: "maior_cobertura", label: "Maior Cobertura" },
  { value: "maior_diversidade", label: "Maior Diversidade" },
];

export function ExtremeCoveragePanel() {
  const { config, stats } = useLotteryContext();
  const { saveBet } = useSavedBets(config.id);
  const betPrice = BET_PRICES[config.id] || 3.0;

  // State
  const [baseNumbers, setBaseNumbers] = useState<number[]>([]);
  const [profile, setProfile] = useState<CoverageProfile>("equilibrado");
  const [objective, setObjective] = useState<CoverageObjective>("geral");
  const [priority, setPriority] = useState<CoveragePriority>("melhor_equilibrio");
  const [maxGames, setMaxGames] = useState(30);
  const [maxBudget, setMaxBudget] = useState(100);
  const [maxOverlap, setMaxOverlap] = useState(0);
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleNumber = useCallback((n: number) => {
    setBaseNumbers(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
    setResult(null);
  }, []);

  const autoSelect = useCallback(() => {
    if (!stats || stats.length === 0) return;
    const idealBase = Math.min(config.numbers, config.pick + 3);
    const scored = stats
      .filter(s => s.number >= 1 && s.number <= config.numbers)
      .map(s => ({
        number: s.number,
        score: s.frequency * 0.3 + s.lastSeen * 0.25 + s.cycleScore * 0.25 + s.trend * 0.1 + s.recentFreq * 0.1,
      }))
      .sort((a, b) => b.score - a.score);
    setBaseNumbers(scored.slice(0, idealBase).map(s => s.number).sort((a, b) => a - b));
    setResult(null);
  }, [stats, config]);

  const runCoverage = useCallback(() => {
    if (baseNumbers.length < config.pick) return;
    setRunning(true);
    setResult(null);

    // Run in timeout to not block UI
    setTimeout(() => {
      try {
        const coverageConfig: CoverageConfig = {
          lotteryId: config.id,
          baseNumbers: [...baseNumbers].sort((a, b) => a - b),
          pick: config.pick,
          universeSize: config.numbers,
          maxGames,
          maxBudget,
          ticketPrice: betPrice,
          profile,
          objective,
          priority,
          maxOverlap: maxOverlap > 0 ? maxOverlap : 0,
        };
        const res = runExtremeCoverage(coverageConfig);
        setResult(res);
      } catch (err) {
        console.error("Coverage error:", err);
        toast.error("Erro ao gerar cobertura");
      }
      setRunning(false);
    }, 50);
  }, [baseNumbers, config, maxGames, maxBudget, betPrice, profile, objective, priority, maxOverlap]);

  const handleSaveAll = async () => {
    if (!result) return;
    setSaving(true);
    let saved = 0;
    for (const game of result.games) {
      const ok = await saveBet({
        numbers: game,
        strategy: `Cobertura ${PROFILE_INFO[profile].label}`,
        label: `Cobertura Extrema`,
      });
      if (ok) saved++;
    }
    setSaving(false);
    if (saved > 0) toast.success(`${saved} jogos salvos!`);
  };

  const handleExportPdf = () => {
    if (!result) return;
    exportToPdf({
      title: `Cobertura Extrema — ${config.name}`,
      subtitle: `${result.games.length} jogos · Perfil ${PROFILE_INFO[profile].label} · R$ ${result.metrics.totalCost.toFixed(2)}`,
      config,
      bets: result.games.map((g, i) => ({
        numbers: g,
        strategy: "Cobertura Extrema",
        score: result.metrics.globalScore,
        grade: `J${i + 1}`,
      })),
      type: "fechamento",
    });
  };

  const canRun = baseNumbers.length >= config.pick;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                Cobertura Extrema
                <Badge variant="default" className="text-[10px]">VITALÍCIO</Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Algoritmo de 5 camadas: Geração → Greedy → Refinamento → Simulated Annealing → Pós-processamento
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile selector */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Perfil de Fechamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.keys(PROFILE_INFO) as CoverageProfile[]).map(p => (
              <button
                key={p}
                onClick={() => { setProfile(p); setResult(null); }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  profile === p
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border hover:border-muted-foreground bg-muted/5"
                }`}
              >
                <span className="text-lg">{PROFILE_INFO[p].icon}</span>
                <div className="text-xs font-bold text-foreground mt-1">{PROFILE_INFO[p].label}</div>
                <div className="text-[10px] text-muted-foreground">{PROFILE_INFO[p].desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Number selection */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Dezenas-Base
            </span>
            <Badge variant="outline" className="text-xs">
              {baseNumbers.length}/{config.pick}+ selecionadas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: config.numbers }, (_, i) => i + 1).map(n => {
              const isSelected = baseNumbers.includes(n);
              return (
                <button
                  key={n}
                  onClick={() => toggleNumber(n)}
                  className={`w-9 h-9 rounded-lg text-xs font-mono font-bold border transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/10 text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {String(n).padStart(2, "0")}
                </button>
              );
            })}
          </div>

          {baseNumbers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>Base:</span>
              {baseNumbers.sort((a, b) => a - b).map(n => (
                <span key={n} className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[11px]">
                  {String(n).padStart(2, "0")}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={autoSelect} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Auto-Seleção IA
            </Button>
            {baseNumbers.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setBaseNumbers([]); setResult(null); }}>
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced settings */}
      <Card className="bg-card/80 backdrop-blur border-border">
        <CardHeader className="pb-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full"
          >
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Configurações Avançadas
            </CardTitle>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Objetivo de Cobertura</label>
                    <Select value={objective} onValueChange={(v) => { setObjective(v as CoverageObjective); setResult(null); }}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OBJECTIVE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Prioridade</label>
                    <Select value={priority} onValueChange={(v) => { setPriority(v as CoveragePriority); setResult(null); }}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 flex justify-between">
                    <span>Máximo de Jogos</span>
                    <span className="text-primary font-mono">{maxGames}</span>
                  </label>
                  <Slider value={[maxGames]} onValueChange={([v]) => { setMaxGames(v); setResult(null); }} min={5} max={100} step={5} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 flex justify-between">
                    <span>Orçamento Máximo</span>
                    <span className="text-accent font-mono">R$ {maxBudget.toFixed(0)}</span>
                  </label>
                  <Slider value={[maxBudget]} onValueChange={([v]) => { setMaxBudget(v); setResult(null); }} min={10} max={500} step={10} />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 flex justify-between">
                    <span>Sobreposição máxima entre jogos</span>
                    <span className="font-mono">{maxOverlap === 0 ? "Sem limite" : maxOverlap}</span>
                  </label>
                  <Slider value={[maxOverlap]} onValueChange={([v]) => { setMaxOverlap(v); setResult(null); }} min={0} max={config.pick - 1} step={1} />
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Generate button */}
      <Button
        onClick={runCoverage}
        disabled={!canRun || running}
        className="w-full gap-2 h-12 text-base"
        size="lg"
      >
        {running ? (
          <>
            <Cpu className="w-5 h-5 animate-spin" />
            Processando Cobertura Extrema...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            Gerar Cobertura Extrema
          </>
        )}
      </Button>

      {!canRun && baseNumbers.length > 0 && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Selecione pelo menos {config.pick} dezenas (mínimo para formar um jogo)
        </p>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Metrics dashboard */}
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Métricas do Fechamento
                  </CardTitle>
                  <Badge className="text-[10px]">{result.elapsedMs}ms</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score */}
                <div className="text-center">
                  <div className="text-4xl font-black font-mono text-primary">
                    {result.metrics.globalScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Score Global /100</div>
                  <Badge variant={result.metrics.efficiencyLevel === "Extrema" ? "default" : "secondary"} className="mt-1">
                    Eficiência {result.metrics.efficiencyLevel}
                  </Badge>
                </div>

                {/* Key metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="Jogos" value={result.metrics.totalGames.toString()} sub={`de ${result.metrics.totalPossibleCombinations.toLocaleString()} possíveis`} />
                  <MetricCard label="Custo" value={`R$ ${result.metrics.totalCost.toFixed(2)}`} sub={`${betPrice.toFixed(2)}/jogo`} accent />
                  <MetricCard label="Redução" value={`${((1 - result.metrics.reductionRatio) * 100).toFixed(1)}%`} sub="menos jogos" />
                  <MetricCard label="Diversidade" value={`${(result.metrics.diversityIndex * 100).toFixed(0)}%`} sub="entre jogos" />
                </div>

                {/* Coverage bars */}
                <div className="space-y-2">
                  <CoverageBar label="Dezenas" value={result.metrics.numberCoverage} />
                  <CoverageBar label="Pares" value={result.metrics.pairCoverage} />
                  <CoverageBar label="Trincas" value={result.metrics.tripleCoverage} />
                  {result.metrics.quadCoverage > 0 && (
                    <CoverageBar label="Quadras" value={result.metrics.quadCoverage} />
                  )}
                  <CoverageBar label="Redundância" value={result.metrics.redundancyIndex * 100} inverted />
                </div>
              </CardContent>
            </Card>

            {/* Explanation */}
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Explicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground">{result.explanation.summary}</p>

                {result.explanation.compromises.length > 0 && (
                  <div className="space-y-1">
                    {result.explanation.compromises.map((c, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                        {c}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowTechnical(!showTechnical)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {showTechnical ? "Ocultar" : "Ver"} detalhes técnicos
                  {showTechnical ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showTechnical && (
                  <pre className="text-[11px] text-muted-foreground bg-muted/20 p-3 rounded-lg whitespace-pre-wrap font-mono">
                    {result.explanation.technical}
                  </pre>
                )}
              </CardContent>
            </Card>

            {/* Games */}
            <Card className="bg-card/80 backdrop-blur border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    {result.games.length} Jogos Gerados
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5 text-xs">
                      <FileDown className="w-3.5 h-3.5" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSaveAll} disabled={saving} className="gap-1.5 text-xs">
                      <Save className="w-3.5 h-3.5" />
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                  {result.games.map((game, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/10 border border-border">
                      <span className="text-[11px] font-mono font-bold text-primary w-7 shrink-0">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex flex-wrap gap-1 flex-1">
                        {game.map(n => (
                          <span key={n} className="w-7 h-7 flex items-center justify-center rounded bg-primary/10 text-primary text-[11px] font-mono font-bold">
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
    </div>
  );
}

// Sub-components

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="p-3 rounded-xl bg-muted/10 border border-border text-center">
      <div className={`text-lg font-black font-mono ${accent ? "text-accent" : "text-foreground"}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
      <div className="text-[9px] text-muted-foreground/60">{sub}</div>
    </div>
  );
}

function CoverageBar({ label, value, inverted }: { label: string; value: number; inverted?: boolean }) {
  const displayValue = Math.min(100, Math.max(0, value));
  const color = inverted
    ? displayValue > 50 ? "bg-destructive" : displayValue > 25 ? "bg-amber-500" : "bg-green-500"
    : displayValue > 80 ? "bg-green-500" : displayValue > 50 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${displayValue}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-foreground w-12 text-right">
        {displayValue.toFixed(1)}%
      </span>
    </div>
  );
}
