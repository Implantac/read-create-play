import { useState, useMemo, useEffect, useRef } from "react";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import {
  GameEntry,
  GameResult,
  SimulationSummary,
  generateGames,
  runHistoricalSimulation,
} from "@/engine/historical-simulator";
import { motion, AnimatePresence } from "framer-motion";
import { History, Play, Trophy, BarChart3, Lightbulb, Plus, Trash2, Shuffle, FileDown, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { getPrizeTiers } from "@/services/lotteryApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { toast } from "sonner";

function exportSimulationPdf(simResults: { results: GameResult[]; summary: SimulationSummary }, config: LotteryConfig) {
  const date = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const top = simResults.results.slice(0, 50);
  const rows = top.map((r, i) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:8px;text-align:center;font-family:monospace;font-size:12px;color:#6b7280;">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
      <td style="padding:8px;font-size:12px;">${r.label}</td>
      <td style="padding:8px;font-family:monospace;font-size:11px;color:#16a34a;">${r.gameNumbers.map(n => String(n).padStart(2, "0")).join(" ")}</td>
      <td style="padding:8px;text-align:center;font-weight:700;font-size:13px;">${r.bestHits}</td>
      <td style="padding:8px;text-align:center;font-size:12px;">${r.averageHits}</td>
      <td style="padding:8px;text-align:center;font-size:12px;"><span style="background:${r.score >= 70 ? '#dcfce7' : r.score >= 40 ? '#fef9c3' : '#f3f4f6'};padding:2px 8px;border-radius:10px;font-weight:600;">${r.score}</span></td>
    </tr>
  `).join("");

  const prizeRows = Object.entries(simResults.summary.prizeDistribution).filter(([, v]) => v > 0).map(([label, count]) =>
    `<tr><td style="padding:6px 12px;font-size:12px;">${label}</td><td style="padding:6px 12px;font-size:12px;font-weight:600;text-align:right;">${count}x</td></tr>`
  ).join("");

  const insightsHtml = simResults.summary.insights.map(i => `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;font-size:12px;margin-bottom:6px;">${i}</div>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Simulação - ${config.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',sans-serif;background:#fff;color:#111}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}@page{margin:12mm}}
</style></head><body>
<div style="max-width:900px;margin:0 auto;padding:24px 16px;">
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #22c55e;padding-bottom:14px;margin-bottom:20px;">
    <div><h1 style="font-size:20px;font-weight:800;">⚡ Titan <span style="color:#22c55e;">Loterias</span></h1><p style="font-size:10px;color:#6b7280;">Motor Estatístico v4.0 • Simulação Histórica</p></div>
    <div style="text-align:right;"><p style="font-size:12px;font-weight:600;">${config.name} ${config.icon}</p><p style="font-size:10px;color:#6b7280;">${date}</p></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;text-align:center;"><p style="font-size:10px;color:#6b7280;">Jogos</p><p style="font-size:22px;font-weight:800;color:#16a34a;">${simResults.summary.totalGames}</p></div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;text-align:center;"><p style="font-size:10px;color:#6b7280;">Concursos</p><p style="font-size:22px;font-weight:800;color:#2563eb;">${simResults.summary.totalConcursos}</p></div>
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:12px;text-align:center;"><p style="font-size:10px;color:#6b7280;">Comparações</p><p style="font-size:22px;font-weight:800;color:#ca8a04;">${simResults.summary.totalComparisons.toLocaleString()}</p></div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;text-align:center;"><p style="font-size:10px;color:#6b7280;">Score Médio</p><p style="font-size:22px;font-weight:800;color:#16a34a;">${simResults.summary.averageScore}/100</p></div>
  </div>
  <h2 style="font-size:15px;font-weight:700;margin-bottom:10px;">🏆 Ranking dos Melhores Jogos</h2>
  <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;">
    <thead><tr style="background:#f9fafb;"><th style="padding:8px;font-size:10px;color:#6b7280;text-align:center;">#</th><th style="padding:8px;font-size:10px;color:#6b7280;text-align:left;">Jogo</th><th style="padding:8px;font-size:10px;color:#6b7280;text-align:left;">Números</th><th style="padding:8px;font-size:10px;color:#6b7280;text-align:center;">Melhor</th><th style="padding:8px;font-size:10px;color:#6b7280;text-align:center;">Média</th><th style="padding:8px;font-size:10px;color:#6b7280;text-align:center;">Score</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${prizeRows ? `<h2 style="font-size:15px;font-weight:700;margin-bottom:10px;">🎰 Distribuição de Premiações</h2><table style="width:100%;max-width:400px;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;"><tbody>${prizeRows}</tbody></table>` : ''}
  ${insightsHtml ? `<h2 style="font-size:15px;font-weight:700;margin-bottom:10px;">💡 Insights</h2>${insightsHtml}` : ''}
  <div style="margin-top:20px;padding-top:14px;border-top:1px solid #e5e7eb;"><p style="font-size:8px;color:#9ca3af;">Gerado por Titan Loterias • Os resultados são baseados em análise estatística e não garantem premiação.</p></div>
  <div class="no-print" style="text-align:center;margin-top:24px;"><button onclick="window.print()" style="background:#22c55e;color:#fff;border:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">🖨️ Imprimir / Salvar PDF</button></div>
</div></body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) w.onload = () => URL.revokeObjectURL(url);
}

interface Props {
  config: LotteryConfig;
  draws: DrawResult[];
  stats: NumberStats[];
}

const CONCURSO_OPTIONS = [
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
  { value: 200, label: "200" },
  { value: 500, label: "500" },
  { value: "all" as const, label: "Todos" },
];

const GAME_COUNT_OPTIONS = [10, 50, 100, 500, 1000];

const MODES = [
  { value: "random" as const, label: "Aleatório", icon: "🎲" },
  { value: "balanced" as const, label: "Equilibrado", icon: "⚖️" },
  { value: "frequency" as const, label: "Frequência", icon: "📈" },
  { value: "delayed" as const, label: "Atrasados", icon: "⏰" },
  { value: "ai" as const, label: "IA", icon: "🤖" },
];

export function HistoricalSimulatorPanel({ config, draws, stats }: Props) {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [concursoLimit, setConcursoLimit] = useState<number | "all">(100);
  const [mode, setMode] = useState<"random" | "balanced" | "frequency" | "delayed" | "ai">("ai");
  const [gameCount, setGameCount] = useState(50);
  const [manualInput, setManualInput] = useState("");
  const [running, setRunning] = useState(false);
  const [simResults, setSimResults] = useState<{ results: GameResult[]; summary: SimulationSummary } | null>(null);

  // Reset state when lottery changes
  const prevLotteryId = useRef(config.id);
  useEffect(() => {
    if (prevLotteryId.current !== config.id) {
      prevLotteryId.current = config.id;
      setGames([]);
      setManualInput("");
      setSimResults(null);
    }
  }, [config.id]);

  const handleGenerate = () => {
    const generated = generateGames(gameCount, config, stats, mode);
    setGames(generated);
    setSimResults(null);
    toast.success(`${gameCount} jogos gerados no modo ${MODES.find(m => m.value === mode)?.label}`);
  };

  const handleAddManual = () => {
    const nums = manualInput
      .split(/[\s,;]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 1 && n <= config.numbers);

    if (nums.length !== config.pick) {
      toast.error(`Insira exatamente ${config.pick} números (1-${config.numbers})`);
      return;
    }

    const unique = [...new Set(nums)];
    if (unique.length !== config.pick) {
      toast.error("Números duplicados não são permitidos");
      return;
    }

    setGames(prev => [
      ...prev,
      { id: prev.length + 1, numbers: unique.sort((a, b) => a - b), label: `Manual #${prev.length + 1}` },
    ]);
    setManualInput("");
    setSimResults(null);
  };

  const handleSimulate = () => {
    if (games.length === 0) {
      toast.error("Gere ou adicione jogos primeiro");
      return;
    }
    setRunning(true);
    // Use setTimeout to keep UI responsive for large simulations
    setTimeout(() => {
      const result = runHistoricalSimulation(games, draws, config, concursoLimit);
      setSimResults(result);
      setRunning(false);
      toast.success(
        `Simulação concluída: ${result.summary.totalComparisons.toLocaleString()} comparações processadas`
      );
    }, 50);
  };

  const hitsChartData = useMemo(() => {
    if (!simResults) return [];
    return Object.entries(simResults.summary.hitsDistribution)
      .map(([hits, count]) => ({ hits: Number(hits), count }))
      .sort((a, b) => a.hits - b.hits);
  }, [simResults]);

  const prizeChartData = useMemo(() => {
    if (!simResults) return [];
    return Object.entries(simResults.summary.prizeDistribution)
      .filter(([, v]) => v > 0)
      .map(([label, count]) => ({ label, count }));
  }, [simResults]);

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" />
          Simulador Histórico de Jogos
          <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary">
            {config.name}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Teste jogos contra concursos passados • {draws.length} concursos disponíveis
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controls Row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Mode */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Modo de geração</label>
            <div className="flex flex-wrap gap-1">
              {MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`text-xs px-2 py-1 rounded border transition-all ${
                    mode === m.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Game count */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Quantidade de jogos</label>
            <div className="flex gap-1">
              {GAME_COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setGameCount(n)}
                  className={`text-xs font-mono px-2 py-1 rounded border transition-all ${
                    gameCount === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Concurso limit */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Concursos a analisar</label>
            <div className="flex flex-wrap gap-1">
              {CONCURSO_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  onClick={() => setConcursoLimit(opt.value)}
                  className={`text-xs font-mono px-2 py-1 rounded border transition-all ${
                    concursoLimit === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1">
            <Button size="sm" variant="outline" onClick={handleGenerate} className="text-xs">
              <Shuffle className="w-3 h-3 mr-1" />
              Gerar {gameCount} jogos
            </Button>
            <Button
              size="sm"
              onClick={handleSimulate}
              disabled={running || games.length === 0}
              className="text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
            >
              <Play className="w-3 h-3 mr-1" />
              {running ? "Simulando..." : `Simular (${games.length} jogos)`}
            </Button>
          </div>
        </div>

        {/* Manual input */}
        <div className="flex gap-2 items-center">
          <input
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder={`Insira ${config.pick} números separados por espaço (1-${config.numbers})`}
            className="flex-1 h-8 text-xs rounded border border-border bg-secondary/50 px-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button size="sm" variant="ghost" onClick={handleAddManual} className="text-xs h-8">
            <Plus className="w-3 h-3 mr-1" /> Adicionar
          </Button>
          {games.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setGames([]); setSimResults(null); }}
              className="text-xs h-8 text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Limpar
            </Button>
          )}
        </div>

        {/* Games preview */}
        {games.length > 0 && !simResults && (
          <div className="text-xs text-muted-foreground border border-border rounded p-2 max-h-32 overflow-y-auto">
            {games.slice(0, 20).map(g => (
              <div key={g.id} className="flex gap-1 items-center mb-0.5">
                <span className="font-mono text-foreground w-20 shrink-0">{g.label}:</span>
                <span className="font-mono text-primary">
                  {g.numbers.map(n => String(n).padStart(2, "0")).join(" ")}
                </span>
              </div>
            ))}
            {games.length > 20 && (
              <p className="text-muted-foreground mt-1">... e mais {games.length - 20} jogos</p>
            )}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {simResults && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Export button */}
              <div className="flex justify-end mb-3">
                <Button size="sm" variant="outline" onClick={() => exportSimulationPdf(simResults, config)} className="text-xs">
                  <FileDown className="w-3 h-3 mr-1" />
                  Exportar PDF
                </Button>
              </div>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <SummaryCard label="Jogos" value={simResults.summary.totalGames} color="text-primary" />
                <SummaryCard label="Concursos" value={simResults.summary.totalConcursos} color="text-primary" />
                <SummaryCard
                  label="Comparações"
                  value={simResults.summary.totalComparisons.toLocaleString()}
                  color="text-accent-foreground"
                />
                <SummaryCard label="Score médio" value={`${simResults.summary.averageScore}/100`} color="text-primary" />
              </div>

              <Tabs defaultValue="ranking" className="w-full">
                <TabsList className="w-full grid grid-cols-4 h-8">
                  <TabsTrigger value="ranking" className="text-xs"><Trophy className="w-3 h-3 mr-1" />Ranking</TabsTrigger>
                  <TabsTrigger value="details" className="text-xs"><Eye className="w-3 h-3 mr-1" />Detalhes</TabsTrigger>
                  <TabsTrigger value="distribution" className="text-xs">📊 Distribuição</TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs"><Lightbulb className="w-3 h-3 mr-1" />Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="ranking" className="mt-2">
                  <div className="max-h-[420px] overflow-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead className="text-xs w-10">#</TableHead>
                          <TableHead className="text-xs">Jogo</TableHead>
                          <TableHead className="text-xs">Números</TableHead>
                          <TableHead className="text-xs text-center">Melhor</TableHead>
                          <TableHead className="text-xs text-center">Média</TableHead>
                          <TableHead className="text-xs text-center">Prêmios</TableHead>
                          <TableHead className="text-xs text-center">💰 Valor Est.</TableHead>
                          <TableHead className="text-xs text-center">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simResults.results.slice(0, 50).map((r, i) => {
                          const totalPrizes = Object.values(r.totalPrizes).reduce((s, v) => s + v, 0);
                          const prizeTiers = getPrizeTiers(config.id);
                          // Find highest prize tier achieved
                          const bestPrizeTier = prizeTiers.find(t => t.hits === r.bestHits);
                          return (
                            <TableRow key={r.gameId} className={i < 3 ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-secondary/30"}>
                              <TableCell className="text-xs font-mono">
                                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                              </TableCell>
                              <TableCell className="text-xs font-medium">{r.label}</TableCell>
                              <TableCell className="text-xs font-mono text-primary">
                                {r.gameNumbers.map(n => String(n).padStart(2, "0")).join(" ")}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <span className={`font-bold ${r.bestHits >= config.pick - 1 ? "text-primary" : r.bestHits >= config.pick - 2 ? "text-chart-4" : "text-foreground"}`}>
                                  {r.bestHits}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-center text-muted-foreground">{r.averageHits}</TableCell>
                              <TableCell className="text-xs text-center">
                                {totalPrizes > 0 ? (
                                  <Badge variant="default" className="text-[10px] px-1.5 h-5 bg-primary/20 text-primary border border-primary/30">
                                    🏆 {totalPrizes}x
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                {bestPrizeTier?.estimatedPrize ? (
                                  <span className="font-semibold text-primary text-[11px]">
                                    {bestPrizeTier.estimatedPrize}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-[10px]">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-center">
                                <Badge
                                  variant={r.score >= 70 ? "default" : r.score >= 40 ? "secondary" : "outline"}
                                  className="text-[10px] h-5"
                                >
                                  {r.score}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="mt-2">
                  <GameDetailsList results={simResults.results} config={config} />
                </TabsContent>

                <TabsContent value="distribution" className="mt-2">
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hitsChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="hits"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          label={{ value: "Acertos", position: "bottom", fontSize: 10 }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" name="Frequência" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="mt-2">
                  <div className="space-y-2">
                    {simResults.summary.insights.map((insight, i) => (
                      <div key={i} className="text-sm bg-secondary/50 border border-border rounded-lg p-3">
                        {insight}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>

        {!simResults && games.length === 0 && !running && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Gere jogos ou insira manualmente, depois clique em Simular
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

function GameDetailsList({ results, config }: { results: GameResult[]; config: LotteryConfig }) {
  const [expandedGame, setExpandedGame] = useState<number | null>(null);
  const prizeTiers = getPrizeTiers(config.id);

  const getPrizeForHits = (hits: number) => {
    return prizeTiers.find(t => t.hits === hits);
  };

  return (
    <div className="max-h-[500px] overflow-auto space-y-2">
      {results.slice(0, 30).map((r, i) => {
        const isExpanded = expandedGame === r.gameId;
        const prizeDraws = r.results.filter(cr => prizeTiers.some(t => cr.hits >= t.hits));
        const totalPrizes = Object.values(r.totalPrizes).reduce((s, v) => s + v, 0);

        return (
          <div key={r.gameId} className="border border-border rounded-lg overflow-hidden">
            {/* Game header */}
            <button
              onClick={() => setExpandedGame(isExpanded ? null : r.gameId)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-secondary/30 transition-colors"
            >
              <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-foreground">{r.label}</span>
                  <span className="text-xs font-mono text-primary">
                    {r.gameNumbers.map(n => String(n).padStart(2, "0")).join(" ")}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">Melhor: <strong className="text-foreground">{r.bestHits}</strong></span>
                  <span className="text-[10px] text-muted-foreground">Média: <strong className="text-foreground">{r.averageHits}</strong></span>
                  {totalPrizes > 0 && (
                    <span className="text-[10px] text-primary font-semibold">🏆 {totalPrizes} premiações</span>
                  )}
                  <Badge variant={r.score >= 70 ? "default" : r.score >= 40 ? "secondary" : "outline"} className="text-[10px] h-4 px-1.5">
                    Score {r.score}
                  </Badge>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="border-t border-border bg-secondary/20 px-3 py-2">
                {/* Prize summary */}
                {totalPrizes > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(r.totalPrizes)
                      .filter(([, v]) => v > 0)
                      .map(([label, count]) => {
                        const tier = prizeTiers.find(t => t.label === label);
                        return (
                          <div key={label} className="bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1.5 text-xs">
                            <span className="font-semibold text-primary">{count}x</span>
                            <span className="text-foreground ml-1">{label}</span>
                            {tier?.estimatedPrize && (
                              <span className="text-muted-foreground ml-1">≈ {tier.estimatedPrize}</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Draw-by-draw results with prizes */}
                <p className="text-[10px] text-muted-foreground mb-1 font-medium">Concursos com melhor desempenho:</p>
                <div className="max-h-48 overflow-auto space-y-1">
                  {r.results
                    .filter(cr => cr.hits >= Math.max(2, r.bestHits - 2))
                    .sort((a, b) => b.hits - a.hits)
                    .slice(0, 20)
                    .map(cr => {
                      const prize = getPrizeForHits(cr.hits);
                      return (
                        <div key={cr.concurso} className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-card border border-border">
                          <span className="font-mono text-muted-foreground w-16 shrink-0">#{cr.concurso}</span>
                          <span className="text-muted-foreground w-20 shrink-0">{cr.date}</span>
                          <span className={`font-bold w-20 shrink-0 ${prize ? "text-primary" : "text-foreground"}`}>
                            {cr.hits} acertos
                          </span>
                          <span className="font-mono text-primary/80 text-[10px] flex-1">
                            {cr.matchedNumbers.map(n => String(n).padStart(2, "0")).join(" ")}
                          </span>
                          {prize && (
                            <Badge variant="default" className="text-[10px] h-4 px-1.5 shrink-0">
                              {prize.label} {prize.estimatedPrize ? `≈ ${prize.estimatedPrize}` : ""}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                </div>

                {r.results.filter(cr => cr.hits >= Math.max(2, r.bestHits - 2)).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">Nenhum acerto significativo neste jogo</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {results.length > 30 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Mostrando os 30 melhores de {results.length} jogos
        </p>
      )}
    </div>
  );
}
