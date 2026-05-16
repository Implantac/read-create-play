import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NumberStats } from "@/engine/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { STRATEGIES, Strategy } from "@/engine/strategies";
import { runBacktest, BacktestResult } from "@/engine/backtesting";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Play, Trophy, Zap, FileDown, History, Eye, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

interface BacktestHistoryEntry {
  id: string;
  timestamp: number;
  lotteryId: string;
  lotteryName: string;
  testWindow: number;
  betsPerDraw: number;
  strategies: Strategy[];
  results: BacktestResult[];
}

const HISTORY_KEY = "titan_backtest_history_v1";
const MAX_HISTORY = 30;

const COLORS = [
  "hsl(142, 70%, 45%)", "hsl(200, 90%, 50%)", "hsl(280, 70%, 55%)",
  "hsl(45, 95%, 55%)", "hsl(0, 80%, 55%)", "hsl(170, 70%, 45%)",
];

function loadHistory(): BacktestHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(entries: BacktestHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch (e) {
    console.error("Failed to save backtest history", e);
  }
}

function exportCSV(entry: BacktestHistoryEntry) {
  const headers = ["Modelo/AI", "Estratégia", "Loteria", "Janela", "Apostas/Sorteio", "Média Acertos", "Melhor Acerto", "Win Rate (%)", "ROI", "Consistência (%)"];
  const rows = entry.results.map(r => {
    const strategyInfo = STRATEGIES.find(s => s.id === r.strategy);
    const modelLabel = strategyInfo?.category === "ai" ? "Machine Learning" : "Estatística";
    
    return [
      `"${modelLabel}"`,
      `"${r.label}"`,
      `"${entry.lotteryName}"`,
      `"${entry.testWindow} sorteios"`,
      `"${entry.betsPerDraw}"`,
      r.avgHits,
      r.bestHit,
      r.winRate,
      r.profit,
      Math.round(r.consistency * 100),
    ];
  });
  const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const fileName = `relatorio-backtest-${entry.lotteryId}-${entry.id}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success(`CSV "${fileName}" exportado!`);
}

function exportPDF(entry: BacktestHistoryEntry) {
  const date = new Date(entry.timestamp).toLocaleString("pt-BR");
  const fileName = `relatorio-backtest-${entry.lotteryId}-${entry.id}.pdf`;
  const rowsHtml = entry.results.map((r, i) => {
    const strategyInfo = STRATEGIES.find(s => s.id === r.strategy);
    const modelLabel = strategyInfo?.category === "ai" ? "Machine Learning" : "Estatística";
    
    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 8px; text-align: center;">${i + 1}</td>
        <td style="padding: 8px;">${modelLabel}</td>
        <td style="padding: 8px; font-weight: bold;">${r.label}</td>
        <td style="padding: 8px; text-align: center;">${r.avgHits}</td>
        <td style="padding: 8px; text-align: center;">${r.bestHit}</td>
        <td style="padding: 8px; text-align: center;">${r.winRate}%</td>
        <td style="padding: 8px; text-align: center;">${r.profit}x</td>
        <td style="padding: 8px; text-align: center;">${Math.round(r.consistency * 100)}%</td>
      </tr>
    `;
  }).join("");
  
  const html = `
    <html><head><title>${fileName}</title>
    <style>
      body { font-family: sans-serif; color: #333; padding: 20px; }
      h1 { color: #22c55e; margin-bottom: 5px; }
      .header { border-bottom: 2px solid #22c55e; padding-bottom: 10px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #f8f9fa; padding: 10px 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #ddd; }
      td { font-size: 11px; padding: 8px; }
      .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
      .filename { font-family: monospace; font-size: 10px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
    </style></head><body>
      <div class="header">
        <h1>Titan Loterias - Relatório de Backtest</h1>
        <p>Gerado em ${date}</p>
      </div>
      <div class="meta">
        <strong>Arquivo:</strong> ${fileName}<br>
        <strong>Loteria:</strong> ${entry.lotteryName}<br>
        <strong>Janela:</strong> ${entry.testWindow} sorteios<br>
        <strong>Apostas por sorteio:</strong> ${entry.betsPerDraw}<br>
        <strong>Estratégias testadas:</strong> ${entry.strategies.length}
      </div>
      <table>
        <thead><tr>
          <th>#</th><th>Modelo</th><th>Estratégia</th><th>Média</th><th>Melhor</th><th>Win Rate</th><th>ROI</th><th>Consistência</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="filename">ID do Documento: ${entry.id} | Nome do Arquivo Sugerido: ${fileName}</div>
    </body></html>
  `;
  const win = window.open("", "_blank");
  win?.document.write(html);
  win?.document.close();
  setTimeout(() => win?.print(), 500);
  toast.success("Preparando PDF...");
}

export function BacktestPanel({ stats, config, draws }: Props) {
  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>(
    ["smart", "hot", "cold", "trend", "cycle", "hybrid", "quantum", "ml"]
  );
  const [testWindow, setTestWindow] = useState(50);
  const [betsPerDraw, setBetsPerDraw] = useState(3);
  const [running, setRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<BacktestHistoryEntry | null>(null);
  const [history, setHistory] = useState<BacktestHistoryEntry[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);

  const prevLotteryId = useRef(config.id);
  useEffect(() => {
    if (prevLotteryId.current !== config.id) {
      prevLotteryId.current = config.id;
      setCurrentEntry(null);
    }
  }, [config.id]);

  const toggleStrategy = (s: Strategy) => {
    setSelectedStrategies(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const run = () => {
    setRunning(true);
    setCurrentEntry(null);
    setTimeout(() => {
      const minPrizeMap: Record<string, number> = {
        megasena: 4, lotofacil: 11, quina: 2, lotomania: 15,
        duplasena: 3, timemania: 3, diadesorte: 4, supersete: 3,
      };
      const minPrize = minPrizeMap[config.id] || (config.pick <= 6 ? 4 : config.pick <= 10 ? 5 : config.pick - 4);
      const res = runBacktest(stats, config, draws, {
        strategies: selectedStrategies,
        testWindow,
        betsPerDraw,
        minPrizeHits: minPrize,
      });
      const entry: BacktestHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        lotteryId: config.id,
        lotteryName: config.name,
        testWindow,
        betsPerDraw,
        strategies: selectedStrategies,
        results: res,
      };
      setCurrentEntry(entry);
      const newHistory = [entry, ...history].slice(0, MAX_HISTORY);
      setHistory(newHistory);
      saveHistory(newHistory);
      setRunning(false);
    }, 50);
  };

  const reopenEntry = (entry: BacktestHistoryEntry) => {
    setCurrentEntry(entry);
    setShowHistory(false);
    toast.success(`Relatório de ${new Date(entry.timestamp).toLocaleString("pt-BR")} carregado`);
  };

  const deleteEntry = (id: string) => {
    const newHistory = history.filter(e => e.id !== id);
    setHistory(newHistory);
    saveHistory(newHistory);
    if (currentEntry?.id === id) setCurrentEntry(null);
    toast.info("Entrada removida do histórico");
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
    toast.info("Histórico limpo");
  };

  const results = currentEntry?.results ?? null;
  const chartData = results?.map(r => ({
    name: r.label,
    "Taxa Acerto (%)": r.winRate,
    "Média Acertos": r.avgHits,
    "Consistência (%)": Math.round(r.consistency * 100),
  })) ?? [];

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FlaskConical className="w-5 h-5 text-primary" />
            Backtesting Automático
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 gap-1.5"
            onClick={() => setShowHistory(v => !v)}
          >
            <History className="w-3 h-3" />
            Histórico ({history.length})
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Teste cada estratégia contra {draws.length} resultados históricos reais e compare desempenho
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-border bg-muted/10 p-3 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-primary" />
                    Histórico de Backtests
                  </span>
                  {history.length > 0 && (
                    <Button size="sm" variant="ghost" className="text-[10px] h-6 text-destructive" onClick={clearHistory}>
                      Limpar tudo
                    </Button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum backtest executado ainda. Os relatórios aparecerão aqui.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {history.map(entry => {
                      const date = new Date(entry.timestamp);
                      const top = entry.results[0];
                      const isActive = currentEntry?.id === entry.id;
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-2 p-2.5 rounded-md border text-xs transition-all ${
                            isActive ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/20"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{entry.lotteryName}</span>
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                {entry.testWindow} sorteios
                              </Badge>
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                {entry.strategies.length} estrat.
                              </Badge>
                              {top && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-primary border-primary/30">
                                  🏆 {top.label} {top.winRate}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Abrir relatório" onClick={() => reopenEntry(entry)}>
                              <Eye className="w-3.5 h-3.5 text-primary" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Baixar CSV" onClick={() => exportCSV(entry)}>
                              <FileDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Baixar PDF" onClick={() => exportPDF(entry)}>
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" title="Excluir" onClick={() => deleteEntry(entry.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Strategy selector */}
        <div className="flex flex-wrap gap-1.5">
          {STRATEGIES.map(s => (
            <button
              key={s.id}
              onClick={() => toggleStrategy(s.id)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                selectedStrategies.includes(s.id)
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Config */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Sorteios:</span>
            {[20, 50, 100].map(n => (
              <button
                key={n}
                onClick={() => setTestWindow(n)}
                className={`font-mono px-2 py-0.5 rounded border ${
                  testWindow === n ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Apostas/sorteio:</span>
            {[1, 3, 5].map(n => (
              <button
                key={n}
                onClick={() => setBetsPerDraw(n)}
                className={`font-mono px-2 py-0.5 rounded border ${
                  betsPerDraw === n ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={run} disabled={running || selectedStrategies.length === 0} className="w-full gap-2">
          {running ? <Zap className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
          {running ? "Executando backtesting..." : `Testar ${selectedStrategies.length} estratégias × ${testWindow} sorteios`}
        </Button>

        {currentEntry && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 gap-1.5" onClick={() => exportCSV(currentEntry)}>
              <FileDown className="w-3 h-3" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8 gap-1.5" onClick={() => exportPDF(currentEntry)}>
              <FileText className="w-3 h-3" />
              Exportar PDF
            </Button>
          </div>
        )}

        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {currentEntry && currentEntry.id !== history[0]?.id && (
                <div className="text-[10px] text-muted-foreground italic px-1">
                  📂 Visualizando relatório de {new Date(currentEntry.timestamp).toLocaleString("pt-BR")}
                </div>
              )}

              {/* Equity Curve Visualizer */}
              <div className="space-y-4">
                <div className="bg-muted/10 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Curva de Patrimônio vs Risco
                    </h3>
                    <div className="flex gap-4">
                      {results[0] && (
                        <>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase">Drawdown Máx</p>
                            <p className="text-xs font-mono text-destructive">R$ {results[0].maxDrawdown}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase">Sharpe Ratio</p>
                            <p className="text-xs font-mono text-primary">{results[0].sharpeRatio}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={results[0]?.equityCurve || []}>
                        <defs>
                          <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="x" 
                          hide 
                        />
                        <YAxis 
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `R$ ${v}`}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-card border border-border p-2 rounded-md shadow-xl text-[11px]">
                                  <p className="text-muted-foreground">Sorteio: {payload[0].payload.x}</p>
                                  <p className="font-bold text-primary">Saldo: R$ {payload[0].value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="y" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorEquity)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ranking */}
                <div className="space-y-2">
                  {results.map((r, idx) => (
                    <div key={r.strategy} className="group relative overflow-hidden flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border hover:border-primary/50 transition-all">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold font-mono text-primary/40 group-hover:text-primary transition-colors w-7 text-right">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{r.label}</span>
                            {idx === 0 && <Badge variant="default" className="text-[9px] h-4 uppercase tracking-tighter bg-primary text-primary-foreground">Top Alpha</Badge>}
                            <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary bg-primary/5">
                              {r.globalScore} pts
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:flex sm:gap-4 mt-2 text-[11px] text-muted-foreground">
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase opacity-60">Win Rate</span>
                              <span className="text-foreground font-semibold">{r.winRate}%</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase opacity-60">Fator Recuperação</span>
                              <span className="text-foreground font-semibold">{r.recoveryFactor}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase opacity-60">Max Drawdown</span>
                              <span className="text-destructive font-semibold">R$ {r.maxDrawdown}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] uppercase opacity-60">ROI Estimado</span>
                              <span className={`font-semibold ${r.profit > 1 ? 'text-green-500' : 'text-foreground'}`}>{r.profit}x</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border/50 pt-2 sm:pt-0 mt-2 sm:mt-0">
                        <p className="text-[10px] text-muted-foreground sm:mb-1 uppercase tracking-wider">Consistência</p>
                        <div className="flex items-center gap-2">
                          <Progress value={r.consistency * 100} className="w-20 h-1.5 bg-primary/10" />
                          <span className="text-xs font-mono font-bold text-foreground">{Math.round(r.consistency * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
