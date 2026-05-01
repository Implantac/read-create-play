import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Zap, AlertTriangle, ShieldCheck, TrendingUp, BarChart, Activity } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Cell } from "recharts";
import { RiskProfile } from "@/ai/core/aiTypes";
import { selfCalibrateWeights, applyContextAdjustments, ContextSnapshot } from "@/ai/engines/adaptiveEngine";
import { AI_CONFIG } from "@/ai/core/aiConfig";
import { DrawResult } from "@/data/lotteries";

interface Props {
  lotteryId: string;
  draws: DrawResult[];
}

export function VolatilitySimulationPanel({ lotteryId, draws }: Props) {
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [volatility, setVolatility] = useState(0.5);
  const [regimeStability, setRegimeStability] = useState(0.6);

  // Simulate weights based on inputs
  const simulatedWeights = useMemo(() => {
    // 1. Get base adaptive weights (from real history or defaults)
    const baseWeights = selfCalibrateWeights(draws, lotteryId);
    
    // 2. Create a synthetic context snapshot based on sliders
    const syntheticContext: ContextSnapshot = {
      recentSumTrend: "stable",
      recentParityShift: 0,
      recentGapAcceleration: 0,
      volatilityIndex: volatility,
      regimeStability: regimeStability,
    };

    // 3. Apply adjustments
    const adjusted = applyContextAdjustments(baseWeights, syntheticContext, riskProfile);
    
    // Convert to chart data
    return [
      { name: "Soma", value: adjusted.sumWeight, color: "#3b82f6" },
      { name: "Paridade", value: adjusted.parityWeight, color: "#8b5cf6" },
      { name: "Dispersão", value: adjusted.dispersalWeight, color: "#ec4899" },
      { name: "Frequência", value: adjusted.frequencyWeight, color: "#f59e0b" },
      { name: "Atraso", value: adjusted.gapWeight, color: "#10b981" },
      { name: "Tendência", value: adjusted.trendWeight, color: "#ef4444" },
      { name: "Repetição", value: adjusted.repeatWeight, color: "#06b6d4" },
      { name: "Cluster", value: adjusted.clusterWeight, color: "#6366f1" },
    ];
  }, [lotteryId, draws, riskProfile, volatility, regimeStability]);

  const riskLabels: Record<RiskProfile, string> = {
    conservative: "Conservador",
    balanced: "Equilibrado",
    aggressive: "Agressivo",
    statistical: "Estatístico",
    exploratory: "Exploratório",
    max_coverage: "Máxima Cobertura",
    anti_popular: "Anti-popularidade",
    markov: "Cadeia de Markov",
    momentum: "Momento Linear",
    harmonic: "Alinhamento Harmônico",
    regression: "Regressão à Média",
  };

  const volatilityStatus = volatility > 0.8 ? "Crítica" : volatility > 0.5 ? "Alta" : volatility > 0.3 ? "Normal" : "Estável";
  const volatilityColor = volatility > 0.8 ? "text-red-500" : volatility > 0.5 ? "text-orange-500" : "text-green-500";

  return (
    <Card className="bg-card/80 backdrop-blur border-border overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-black tracking-tight">
              Simulador de Volatilidade e Risco
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            Laboratório IA
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Explore como as mudanças no regime da loteria alteram dinamicamente a inteligência de ranking
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-8">
        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Perfil de Risco
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs w-48">O perfil de risco define a agressividade da IA na escolha das dezenas.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={riskProfile} onValueChange={(v: RiskProfile) => setRiskProfile(v)}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(riskLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" /> Volatilidade Simulada
              </label>
              <Badge variant="outline" className={`text-[10px] font-black uppercase border-transparent ${volatilityColor}`}>
                {volatilityStatus}
              </Badge>
            </div>
            <Slider 
              value={[volatility * 100]} 
              onValueChange={(v) => setVolatility(v[0] / 100)} 
              max={100} 
              step={1} 
              className="py-4"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> Estabilidade de Regime
              </label>
              <span className="text-[10px] font-mono text-muted-foreground">
                {(regimeStability * 100).toFixed(0)}%
              </span>
            </div>
            <Slider 
              value={[regimeStability * 100]} 
              onValueChange={(v) => setRegimeStability(v[0] / 100)} 
              max={100} 
              step={1} 
              className="py-4"
            />
          </div>
        </div>

        {/* Visualizations */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Radar Chart for Weights Balance */}
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={simulatedWeights}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontWeight: 600 }} 
                  />
                  <Radar
                    name="Peso da Métrica"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                  <ReTooltip 
                    contentStyle={{ 
                      background: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      fontSize: 11,
                      borderRadius: 8
                    }} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                Assinatura de Decisão da IA
              </p>
            </div>
          </div>

          {/* Bar Chart for Metric Breakdown */}
          <div className="space-y-6">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={simulatedWeights} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }} 
                    width={80}
                  />
                  <ReTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card border border-border p-2 rounded-md shadow-xl text-[10px]">
                            <p className="font-bold text-foreground mb-1">{payload[0].payload.name}</p>
                            <p className="text-primary">Peso Ajustado: {Number(payload[0].value).toFixed(2)}x</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                    {simulatedWeights.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>

            {/* Explanation Box */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
              <div className="flex gap-3">
                <div className={`p-2 rounded-lg bg-background border ${volatility > 0.6 ? 'border-orange-500/30' : 'border-primary/20'} shrink-0 h-fit`}>
                  {volatility > 0.6 ? (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Zap className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Diagnóstico de Ajuste Automático</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {volatility > 0.6 ? (
                      `Detetada alta volatilidade (${(volatility*100).toFixed(0)}%). A IA elevou automaticamente os pesos de Dispersão e Paridade para mitigar riscos de regimes instáveis. O perfil ${riskLabels[riskProfile]} está operando em modo de contenção.`
                    ) : (
                      `Regime estável detetado. A IA prioriza Frequência e Tendência, confiando na repetição de padrões históricos. O perfil ${riskLabels[riskProfile]} está em modo de otimização máxima.`
                    )}
                    {regimeStability < 0.4 && " A baixa estabilidade reduziu a confiabilidade dos sinais de atraso (Gap)."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
