import { useState } from "react";
import { NumberStats, runMonteCarloSimulation } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { motion } from "framer-motion";
import { Cpu, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
}

export function MonteCarloPanel({ stats, config }: Props) {
  const [results, setResults] = useState<{ number: number; wins: number }[] | null>(null);
  const [running, setRunning] = useState(false);
  const [iterations, setIterations] = useState(10000);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const r = runMonteCarloSimulation(config, stats, iterations);
      setResults(r.slice(0, 20));
      setRunning(false);
    }, 100);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-neon-blue" />
            Simulação Monte Carlo
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Simule milhares de sorteios para encontrar padrões</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {[1000, 10000, 50000, 100000].map(n => (
          <button
            key={n}
            onClick={() => setIterations(n)}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-all ${
              iterations === n
                ? "border-neon-blue text-neon-blue bg-neon-blue/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {n >= 1000 ? `${n / 1000}K` : n}
          </button>
        ))}
        <Button size="sm" onClick={run} disabled={running} className="ml-auto bg-neon-blue/20 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/30">
          <Play className="w-3 h-3 mr-1" />
          {running ? "Simulando..." : "Executar"}
        </Button>
      </div>

      {results && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-xs text-muted-foreground mb-3">Top 20 números com mais acertos em {iterations.toLocaleString()} simulações:</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
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
                <Bar dataKey="wins" radius={[3, 3, 0, 0]}>
                  {results.map((_, i) => (
                    <Cell key={i} fill={`hsl(200, 90%, ${35 + (i / results.length) * 25}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {!results && !running && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Selecione o número de iterações e clique em Executar
        </div>
      )}
    </div>
  );
}
