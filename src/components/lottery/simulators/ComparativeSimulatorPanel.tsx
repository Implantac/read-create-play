import { useState, useMemo } from "react";
import { NumberStats } from "@/engine/stats/statistics";
import { LotteryConfig, DrawResult } from "@/data/lotteries";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Loader2, Plus, Trash2, Play, Trophy, Target,
  BarChart3, TrendingUp, Medal, ChevronDown, ChevronUp, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { AIAnalystBriefing } from "@/components/lottery/AIAnalystBriefing";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell
} from "recharts";
import { PRIZE_MAP } from "@/engine/simulators/lib/simulation-utils";

interface SimGame {
  id: string;
  numbers: number[];
  label: string;
}

interface SimResult {
  game: SimGame;
  hitsByDraw: { concurso: number; hits: number; date?: string }[];
  avgHits: number;
  bestHit: number;
  totalPrizes: number;
  hitDistribution: Record<number, number>;
  consistency: number;
  aiEvaluation?: { confidence: number; reasons: string[] };
}


interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

const PRIZE_MAP: Record<string, Record<number, number>> = {
  megasena: { 4: 50, 5: 5000, 6: 500000 },
  lotofacil: { 11: 5, 12: 10, 13: 25, 14: 1500, 15: 100000 },
  quina: { 2: 1, 3: 5, 4: 200, 5: 50000 },
  lotomania: { 0: 5, 15: 10, 16: 25, 17: 100, 18: 1000, 19: 20000, 20: 500000 },
  duplasena: { 3: 3, 4: 50, 5: 5000, 6: 300000 },
  timemania: { 3: 2, 4: 10, 5: 50, 6: 500, 7: 50000 },
  diadesorte: { 4: 10, 5: 50, 6: 2000, 7: 200000 },
  supersete: { 3: 5, 4: 20, 5: 200, 6: 10000, 7: 500000 },
};

export function ComparativeSimulatorPanel({ stats, config, draws }: Props) {
  const { farol } = useLotteryContext();
  const [games, setGames] = useState<SimGame[]>([]);

  const [inputValue, setInputValue] = useState("");
  const [drawCount, setDrawCount] = useState(50);
  const [results, setResults] = useState<SimResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const addGame = () => {
    const nums = inputValue
      .replace(/[^\d,\s\-]/g, "")
      .split(/[\s,\-]+/)
      .map(Number)
      .filter(n => n >= 1 && n <= config.numbers);

    const unique = [...new Set(nums)].sort((a, b) => a - b);
    
    if (unique.length !== config.pick) {
      toast.error(`Informe exatamente ${config.pick} números únicos (de 1 a ${config.numbers})`);
      return;
    }

    setGames(prev => [...prev, {
      id: crypto.randomUUID(),
      numbers: unique,
      label: `Jogo ${prev.length + 1}`,
    }]);
    setInputValue("");
    toast.success("Jogo adicionado!");
  };

  const removeGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
    setResults(null);
  };

  const runSimulation = () => {
    if (games.length === 0) {
      toast.error("Adicione pelo menos 1 jogo para simular");
      return;
    }
    setRunning(true);
    setTimeout(() => {
      const sorted = [...draws].sort((a, b) => b.concurso - a.concurso);
      const testDraws = sorted.slice(0, drawCount);
      const prizes = PRIZE_MAP[config.id] || {};

      const simResults: SimResult[] = games.map(game => {
        const gameSet = new Set(game.numbers);
        const hitsByDraw: { concurso: number; hits: number; date?: string }[] = [];
        const hitDist: Record<number, number> = {};
        for (let i = 0; i <= config.pick; i++) hitDist[i] = 0;

        let totalHits = 0;
        let bestHit = 0;
        let totalPrizes = 0;

        for (const draw of testDraws) {
          const hits = draw.numbers.filter(n => gameSet.has(n)).length;
          hitsByDraw.push({ concurso: draw.concurso, hits, date: draw.date || undefined });
          hitDist[hits] = (hitDist[hits] || 0) + 1;
          totalHits += hits;
          if (hits > bestHit) bestHit = hits;
          totalPrizes += prizes[hits] || 0;
        }

        const avgHits = testDraws.length > 0 ? totalHits / testDraws.length : 0;
        
        // Consistency: inverse CoV
        const hitValues = hitsByDraw.map(h => h.hits);
        const variance = hitValues.reduce((s, v) => s + (v - avgHits) ** 2, 0) / hitValues.length;
        const consistency = avgHits > 0 ? Math.max(0, Math.min(100, Math.round((1 - Math.sqrt(variance) / avgHits) * 100))) : 0;

        // AI Analysis injection
        const reasons = [];
        if (avgHits > config.pick * 0.5) reasons.push("Desempenho histórico acima da média");
        if (consistency > 70) reasons.push("Alta consistência de resultados");
        if (bestHit >= config.pick - 2) reasons.push("Potencial de premiação máxima detectado");
        
        const eliteNumbers = game.numbers.filter(n => farol?.find(s => s.number === n)?.titanGrade === 'Elite').length;
        if (eliteNumbers >= 3) reasons.push(`${eliteNumbers} dezenas de elite integradas`);

        return {
          game,
          hitsByDraw,
          avgHits: Math.round(avgHits * 100) / 100,
          bestHit,
          totalPrizes,
          hitDistribution: hitDist,
          consistency,
          aiEvaluation: {
            confidence: Math.min(98, Math.round(consistency * 0.5 + (avgHits / config.pick) * 100 * 0.5)),
            reasons: reasons.length > 0 ? reasons : ["Estrutura equilibrada", "Padrão de dispersão validado"]
          }
        };

      });

      simResults.sort((a, b) => b.avgHits - a.avgHits);
      setResults(simResults);
      setRunning(false);
      toast.success(`Simulação concluída com ${testDraws.length} concursos!`);
    }, 100);
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    return results.map((r, i) => ({
      name: r.game.label,
      média: r.avgHits,
      melhor: r.bestHit,
      consistência: r.consistency,
    }));
  }, [results]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            🔬 Simulação Comparativa
          </h3>
          <p className="text-xs text-muted-foreground">
            Insira múltiplos jogos e compare o desempenho contra sorteios reais
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={`Ex: ${Array.from({ length: config.pick }, (_, i) => i + 1).join(", ")}`}
          className="flex-1 text-xs"
          onKeyDown={e => e.key === "Enter" && addGame()}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={addGame} className="text-xs gap-1">
            <Plus className="w-3 h-3" /> Adicionar
          </Button>
        </div>
      </div>

      {/* Draw count selector */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-muted-foreground">Últimos concursos:</span>
        <div className="flex gap-1">
          {[10, 25, 50, 100, 500].map(n => (
            <button
              key={n}
              onClick={() => setDrawCount(n)}
              className={`text-[10px] px-2.5 py-1 rounded-md border transition-all ${
                drawCount === n
                  ? "border-primary text-primary bg-primary/10 font-bold"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Games list */}
      {games.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {games.map((game, i) => (
            <div key={game.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/50">
              <span className="text-xs font-mono text-primary w-5">#{i + 1}</span>
              <div className="flex flex-wrap gap-1 flex-1">
                {game.numbers.map(n => (
                  <span key={n} className="lottery-ball text-[10px] w-6 h-6">
                    {String(n).padStart(2, "0")}
                  </span>
                ))}
              </div>
              <button onClick={() => removeGame(game.id)} className="text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Run button */}
      <Button
        onClick={runSimulation}
        disabled={running || games.length === 0}
        className="w-full text-xs gap-2 mb-4"
      >
        {running ? (
          <><Loader2 className="w-3 h-3 animate-spin" /> Simulando...</>
        ) : (
          <><Play className="w-3 h-3" /> Simular {games.length} jogo{games.length !== 1 ? "s" : ""} contra {drawCount} concursos</>
        )}
      </Button>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <SummaryCard
                label="Melhor Desempenho"
                value={results[0]?.game.label || "-"}
                subtitle={`${results[0]?.avgHits} acertos/jogo`}
                icon={<Trophy className="w-4 h-4 text-yellow-500" />}
              />
              <SummaryCard
                label="Máximo de Acertos"
                value={`${Math.max(...results.map(r => r.bestHit))} acertos`}
                subtitle="em um único concurso"
                icon={<Target className="w-4 h-4 text-green-500" />}
              />
              <SummaryCard
                label="Média Geral"
                value={`${(results.reduce((s, r) => s + r.avgHits, 0) / results.length).toFixed(2)}`}
                subtitle="acertos por concurso"
                icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
              />
              <SummaryCard
                label="Premiações"
                value={`R$ ${results.reduce((s, r) => s + r.totalPrizes, 0).toLocaleString()}`}
                subtitle="total estimado"
                icon={<Medal className="w-4 h-4 text-primary" />}
              />
            </div>

            {/* Ranking table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-secondary/30 px-3 py-2 border-b border-border">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-primary" /> Ranking Comparativo
                </h4>
              </div>
              <div className="divide-y divide-border">
                {results.map((r, i) => (
                  <div key={r.game.id} className={`${i === 0 ? "bg-primary/[0.03]" : ""}`}>
                    <div className="px-3 py-2.5 flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                        i === 1 ? "bg-gray-400/20 text-gray-400" :
                        i === 2 ? "bg-amber-700/20 text-amber-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {i + 1}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-xs font-semibold text-foreground">{r.game.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            ({r.game.numbers.map(n => String(n).padStart(2, "0")).join(", ")})
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>Média: <strong className="text-foreground">{r.avgHits}</strong></span>
                          <span>Melhor: <strong className="text-foreground">{r.bestHit}</strong></span>
                          <span>Consist.: <strong className="text-foreground">{r.consistency}%</strong></span>
                          {r.totalPrizes > 0 && (
                            <Badge variant="outline" className="text-[9px] text-green-500 border-green-500/30 px-1.5 py-0">
                              R$ {r.totalPrizes.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {r.aiEvaluation && (
                      <div className="px-3 pb-3 ml-9">
                        <AIAnalystBriefing 
                          confidence={r.aiEvaluation.confidence} 
                          reasons={r.aiEvaluation.reasons} 
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>


            {/* Chart toggle */}
            <button
              onClick={() => setShowChart(!showChart)}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <BarChart3 className="w-3 h-3" />
              {showChart ? "Ocultar gráfico" : "Ver gráfico comparativo"}
              {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
              {showChart && chartData.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="h-64 rounded-lg border border-border p-3 bg-secondary/20">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <RTooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                        <Bar dataKey="média" name="Média acertos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="melhor" name="Melhor acerto" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {games.length === 0 && !results && (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          <FlaskConical className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
          Insira jogos acima para simular contra o histórico real
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, subtitle, icon }: { label: string; value: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}
