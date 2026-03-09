import { useState, useMemo, useEffect, useRef } from "react";
import { NumberStats, generateSmartBet } from "@/engine/statistics";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { getPrizeTiers } from "@/services/lotteryApi";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Play, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
  draws: DrawResult[];
}

interface SimResult {
  round: number;
  hits: number;
  bestHit: number;
  cumulativeHits: number;
  averageHits: number;
}

export function GameSimulator({ stats, config, draws }: Props) {
  const [simResults, setSimResults] = useState<SimResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(100);
  const [strategy, setStrategy] = useState<"smart" | "random">("smart");

  const prizeTiers = getPrizeTiers(config.id);

  const runSimulation = () => {
    setRunning(true);
    setTimeout(() => {
      const results: SimResult[] = [];
      let cumulativeHits = 0;
      let bestOverall = 0;

      for (let i = 0; i < rounds; i++) {
        // Generate bet
        let bet: number[];
        if (strategy === "smart") {
          bet = generateSmartBet(stats, config.pick);
        } else {
          bet = [];
          while (bet.length < config.pick) {
            const n = Math.floor(Math.random() * config.numbers) + 1;
            if (!bet.includes(n)) bet.push(n);
          }
        }

        // Pick a random historical draw to compare against
        const drawIndex = Math.floor(Math.random() * draws.length);
        const draw = draws[drawIndex];
        const hits = bet.filter(n => draw.numbers.includes(n)).length;

        cumulativeHits += hits;
        if (hits > bestOverall) bestOverall = hits;

        results.push({
          round: i + 1,
          hits,
          bestHit: bestOverall,
          cumulativeHits,
          averageHits: parseFloat((cumulativeHits / (i + 1)).toFixed(2)),
        });
      }

      setSimResults(results);
      setRunning(false);
    }, 300);
  };

  const summary = useMemo(() => {
    if (!simResults) return null;
    const hitDist: Record<number, number> = {};
    simResults.forEach(r => {
      hitDist[r.hits] = (hitDist[r.hits] || 0) + 1;
    });
    const best = Math.max(...simResults.map(r => r.hits));
    const avg = simResults[simResults.length - 1].averageHits;
    return { hitDist, best, avg };
  }, [simResults]);

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-neon-green" />
          Simulador de Jogos
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Simule apostas contra resultados reais e veja seu desempenho
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1">
          {[50, 100, 500, 1000].map(n => (
            <button
              key={n}
              onClick={() => setRounds(n)}
              className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-all ${
                rounds === n
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex gap-1 ml-2">
          {(["smart", "random"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                strategy === s
                  ? "border-neon-green text-neon-green bg-neon-green/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "smart" ? "Inteligente" : "Aleatório"}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={runSimulation}
          disabled={running}
          className="ml-auto bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
        >
          <Play className="w-3 h-3 mr-1" />
          {running ? "Simulando..." : "Simular"}
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Melhor resultado</p>
              <p className="text-xl font-bold font-mono text-neon-green">{summary.best} acertos</p>
            </div>
            <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Média de acertos</p>
              <p className="text-xl font-bold font-mono text-foreground">{summary.avg}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Jogos simulados</p>
              <p className="text-xl font-bold font-mono text-neon-blue">{rounds}</p>
            </div>
          </div>

          {/* Hit distribution */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(summary.hitDist)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([hits, count]) => (
                <div key={hits} className="rounded-md bg-secondary/50 border border-border px-3 py-1.5 text-xs">
                  <span className="text-foreground font-mono font-bold">{hits}</span>
                  <span className="text-muted-foreground"> acertos: </span>
                  <span className="text-primary font-mono">{count}x</span>
                  <span className="text-muted-foreground ml-1">
                    ({((count / rounds) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
          </div>

          {/* Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simResults!} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                <XAxis
                  dataKey="round"
                  tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }}
                  tickCount={10}
                />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 18%, 10%)",
                    border: "1px solid hsl(220, 14%, 18%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(210, 20%, 92%)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="averageHits"
                  stroke="hsl(142, 70%, 45%)"
                  strokeWidth={2}
                  dot={false}
                  name="Média de acertos"
                />
                <Line
                  type="stepAfter"
                  dataKey="bestHit"
                  stroke="hsl(45, 95%, 55%)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Melhor acerto"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {!simResults && !running && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Selecione a quantidade de rodadas e clique em Simular
        </div>
      )}
    </div>
  );
}
