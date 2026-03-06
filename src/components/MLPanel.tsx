import { useState } from "react";
import { NumberStats } from "@/engine/statistics";
import { LotteryConfig } from "@/data/lotteries";
import { runAllModels, getConsensusRanking, ModelResult, MLPrediction } from "@/engine/ml-models";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Play, Trophy, Target, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  stats: NumberStats[];
  config: LotteryConfig;
}

export function MLPanel({ stats, config }: Props) {
  const [models, setModels] = useState<ModelResult[] | null>(null);
  const [consensus, setConsensus] = useState<MLPrediction[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const results = runAllModels(stats, config);
      setModels(results);
      setConsensus(getConsensusRanking(results));
      setRunning(false);
    }, 1500);
  };

  const renderChart = (predictions: MLPrediction[], color: string) => {
    const top20 = predictions.slice(0, 20);
    return (
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top20} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="number" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(210, 20%, 92%)",
              }}
              formatter={(value: number) => [`${value}%`, "Score"]}
            />
            <Bar dataKey="score" radius={[3, 3, 0, 0]}>
              {top20.map((_, i) => (
                <Cell key={i} fill={`hsl(${color}, ${80 - i * 2}%)`} fillOpacity={1 - i * 0.02} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-neon-purple" />
            Modelos de Machine Learning
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Random Forest, XGBoost e LSTM para ranking probabilístico
          </p>
        </div>
        <Button
          size="sm"
          onClick={run}
          disabled={running}
          className="bg-neon-purple/20 text-neon-purple border border-neon-purple/30 hover:bg-neon-purple/30"
        >
          <Play className="w-3 h-3 mr-1" />
          {running ? "Processando..." : "Executar Modelos"}
        </Button>
      </div>

      {running && (
        <div className="flex flex-col items-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Treinando modelos...</p>
        </div>
      )}

      {models && !running && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Model stats cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {models.map((model, i) => (
                <div key={model.name} className="rounded-lg bg-secondary/50 border border-border p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">{model.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Target className="w-3 h-3" />
                    Acurácia: <span className="text-foreground font-mono">{model.accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Percent className="w-3 h-3" />
                    Confiança: <span className="text-foreground font-mono">{model.confidence.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <Tabs defaultValue="consensus" className="w-full">
              <TabsList className="w-full bg-secondary/50 border border-border">
                <TabsTrigger value="consensus" className="flex-1 text-xs">
                  <Trophy className="w-3 h-3 mr-1" /> Consenso
                </TabsTrigger>
                {models.map(m => (
                  <TabsTrigger key={m.name} value={m.name} className="flex-1 text-xs">
                    {m.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="consensus" className="mt-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Top 20 números por média ponderada de todos os modelos:
                </p>
                {consensus && renderChart(consensus, "270, 70%")}
              </TabsContent>

              {models.map((model, mi) => {
                const colors = ["142, 70%", "200, 90%", "0, 72%"];
                return (
                  <TabsContent key={model.name} value={model.name} className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1">{model.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">Top 20 números mais prováveis:</p>
                    {renderChart(model.predictions, colors[mi])}
                  </TabsContent>
                );
              })}
            </Tabs>
          </motion.div>
        </AnimatePresence>
      )}

      {!models && !running && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Clique em "Executar Modelos" para rodar os algoritmos de ML
        </div>
      )}
    </div>
  );
}
