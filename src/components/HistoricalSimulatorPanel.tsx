import { useState, useMemo } from "react";
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
import { History, Play, Trophy, BarChart3, Lightbulb, Plus, Trash2, Shuffle, FileDown } from "lucide-react";
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
                  <TabsTrigger value="prizes" className="text-xs"><BarChart3 className="w-3 h-3 mr-1" />Premiações</TabsTrigger>
                  <TabsTrigger value="distribution" className="text-xs">📊 Distribuição</TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs"><Lightbulb className="w-3 h-3 mr-1" />Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="ranking" className="mt-2">
                  <div className="max-h-80 overflow-auto rounded border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs w-10">#</TableHead>
                          <TableHead className="text-xs">Jogo</TableHead>
                          <TableHead className="text-xs">Números</TableHead>
                          <TableHead className="text-xs text-center">Melhor</TableHead>
                          <TableHead className="text-xs text-center">Média</TableHead>
                          <TableHead className="text-xs text-center">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simResults.results.slice(0, 50).map((r, i) => (
                          <TableRow key={r.gameId} className={i < 3 ? "bg-primary/5" : ""}>
                            <TableCell className="text-xs font-mono">
                              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                            </TableCell>
                            <TableCell className="text-xs">{r.label}</TableCell>
                            <TableCell className="text-xs font-mono text-primary">
                              {r.gameNumbers.map(n => String(n).padStart(2, "0")).join(" ")}
                            </TableCell>
                            <TableCell className="text-xs text-center font-bold">{r.bestHits}</TableCell>
                            <TableCell className="text-xs text-center">{r.averageHits}</TableCell>
                            <TableCell className="text-xs text-center">
                              <Badge
                                variant={r.score >= 70 ? "default" : r.score >= 40 ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {r.score}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="prizes" className="mt-2">
                  {prizeChartData.length > 0 ? (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={prizeChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Bar dataKey="count" name="Ocorrências" radius={[4, 4, 0, 0]}>
                            {prizeChartData.map((_, i) => (
                              <Cell key={i} fill={`hsl(var(--primary) / ${1 - i * 0.15})`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma premiação detectada nesta simulação
                    </p>
                  )}
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
