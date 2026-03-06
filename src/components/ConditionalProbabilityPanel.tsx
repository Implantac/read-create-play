import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import {
  DrawConditions,
  ConditionalProbability,
  computeConditionalProbabilities,
  detectLastDrawConditions,
  getCommonConditionPresets,
} from "@/engine/conditional-probability";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Target, TrendingUp, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  draws: DrawResult[];
  config: LotteryConfig;
}

export function ConditionalProbabilityPanel({ draws, config }: Props) {
  const presets = useMemo(() => getCommonConditionPresets(config), [config]);
  const autoConditions = useMemo(() => detectLastDrawConditions(draws), [draws]);

  const [conditions, setConditions] = useState<DrawConditions>(autoConditions);
  const [results, setResults] = useState<ConditionalProbability[] | null>(null);

  const maxSum = config.numbers * config.pick;

  const handleRun = () => {
    const res = computeConditionalProbabilities(draws, config, conditions);
    setResults(res);
  };

  const handleAutoDetect = () => {
    const detected = detectLastDrawConditions(draws);
    setConditions(detected);
    const res = computeConditionalProbabilities(draws, config, detected);
    setResults(res);
  };

  const handlePreset = (preset: DrawConditions) => {
    setConditions(preset);
    const res = computeConditionalProbabilities(draws, config, preset);
    setResults(res);
  };

  const top20 = results?.slice(0, 20) ?? [];
  const chartData = top20.map(r => ({
    name: `${r.number}`,
    prob: Math.round(r.probability * 1000) / 10,
    lift: Math.round(r.lift * 100) / 100,
    signal: r.signal,
  }));

  const signalColor = (s: string) => {
    if (s === "forte") return "hsl(var(--primary))";
    if (s === "moderado") return "hsl(var(--accent-foreground))";
    if (s === "fraco") return "hsl(var(--destructive))";
    return "hsl(var(--muted-foreground))";
  };

  const signalBadge = (s: string) => {
    if (s === "forte") return "default";
    if (s === "moderado") return "secondary";
    return "outline";
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Brain className="w-5 h-5 text-primary" />
          Motor de Probabilidade Condicional
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          P(número | condições do sorteio anterior) — Identifica quais dezenas têm maior chance dado um cenário específico
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="default" onClick={handleAutoDetect} className="gap-1">
            <Zap className="w-3 h-3" /> Auto (último sorteio)
          </Button>
          {presets.map(p => (
            <Button key={p.label} size="sm" variant="outline" onClick={() => handlePreset(p.conditions)}>
              {p.label}
            </Button>
          ))}
        </div>

        {/* Condition Controls */}
        <div className="grid sm:grid-cols-3 gap-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Filter className="w-3 h-3" /> Números Pares: {conditions.evenCount[0]}–{conditions.evenCount[1]}
            </label>
            <Slider
              min={0} max={config.pick} step={1}
              value={conditions.evenCount}
              onValueChange={(v) => setConditions(prev => ({ ...prev, evenCount: v as [number, number] }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> Soma: {conditions.sumRange[0]}–{conditions.sumRange[1]}
            </label>
            <Slider
              min={0} max={maxSum} step={5}
              value={conditions.sumRange}
              onValueChange={(v) => setConditions(prev => ({ ...prev, sumRange: v as [number, number] }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Sequências: {conditions.consecutivePairs[0]}–{conditions.consecutivePairs[1]}
            </label>
            <Slider
              min={0} max={Math.min(config.pick - 1, 10)} step={1}
              value={conditions.consecutivePairs}
              onValueChange={(v) => setConditions(prev => ({ ...prev, consecutivePairs: v as [number, number] }))}
            />
          </div>
        </div>

        <Button onClick={handleRun} className="w-full gap-2">
          <Brain className="w-4 h-4" /> Calcular Probabilidades Condicionais
        </Button>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{results[0]?.totalMatching || 0} sorteios atendem às condições</span>
                <span>{results.filter(r => r.signal === "forte").length} sinais fortes</span>
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} unit="%" />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          color: "hsl(var(--foreground))",
                          fontSize: 12,
                        }}
                        formatter={(val: number, name: string) => {
                          if (name === "prob") return [`${val}%`, "Probabilidade"];
                          return [val, name];
                        }}
                      />
                      <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={signalColor(entry.signal)} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                {top20.map(r => (
                  <div
                    key={r.number}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border"
                  >
                    <span className="font-mono font-bold text-sm text-foreground w-7 text-right">
                      {String(r.number).padStart(2, "0")}
                    </span>
                    <div className="flex-1 text-xs text-muted-foreground">
                      {(r.probability * 100).toFixed(1)}%
                    </div>
                    <Badge variant={signalBadge(r.signal) as any} className="text-[10px] px-1">
                      {r.lift.toFixed(1)}x
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
