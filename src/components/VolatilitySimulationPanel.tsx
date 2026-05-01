import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Info, Zap, AlertTriangle, ShieldCheck, TrendingUp, 
  BarChart, Activity, Save, FolderOpen, History, Trash2, Loader2, X,
  ArrowLeftRight, Check, Square
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, 
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Cell,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { RiskProfile } from "@/ai/core/aiTypes";
import { selfCalibrateWeights, applyContextAdjustments, ContextSnapshot } from "@/ai/engines/adaptiveEngine";
import { AI_CONFIG } from "@/ai/core/aiConfig";
import { DrawResult } from "@/data/lotteries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SimulationScenario {
  id: string;
  name: string;
  risk_profile: RiskProfile;
  volatility: number;
  regime_stability: number;
  weights: any;
  created_at: string;
}

interface Props {
  lotteryId: string;
  draws: DrawResult[];
}

export function VolatilitySimulationPanel({ lotteryId, draws }: Props) {
  const { user } = useAuth();
  const [riskProfile, setRiskProfile] = useState<RiskProfile>("balanced");
  const [volatility, setVolatility] = useState(0.5);
  const [regimeStability, setRegimeStability] = useState(0.6);
  
  // Scenarios state
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Simulate weights based on inputs
  const simulatedWeights = useMemo(() => {
    const baseWeights = selfCalibrateWeights(draws, lotteryId);
    const syntheticContext: ContextSnapshot = {
      recentSumTrend: "stable",
      recentParityShift: 0,
      recentGapAcceleration: 0,
      volatilityIndex: volatility,
      regimeStability: regimeStability,
    };
    const adjusted = applyContextAdjustments(baseWeights, syntheticContext, riskProfile);
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

  // Add current state as a "virtual" scenario for comparison
  const currentScenario: SimulationScenario = useMemo(() => ({
    id: "current",
    name: "Atual (Simulado)",
    risk_profile: riskProfile,
    volatility: volatility,
    regime_stability: regimeStability,
    weights: simulatedWeights,
    created_at: new Date().toISOString()
  }), [riskProfile, volatility, regimeStability, simulatedWeights]);

  const toggleComparison = (id: string) => {
    setSelectedForComparison(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const comparisonResult = useMemo(() => {
    const list = [currentScenario, ...scenarios].filter(s => selectedForComparison.includes(s.id));
    if (list.length < 2) return null;

    const metrics = simulatedWeights.map(m => {
      const data: any = { name: m.name };
      list.forEach(s => {
        const weightEntry = s.weights.find((w: any) => w.name === m.name);
        data[s.name] = weightEntry ? weightEntry.value : 0;
      });
      return data;
    });

    return { scenarios: list, metrics };
  }, [selectedForComparison, scenarios, currentScenario, simulatedWeights]);
  const fetchScenarios = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("simulation_scenarios")
        .select("*")
        .eq("lottery_id", lotteryId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setScenarios((data as any[]) || []);
    } catch (err) {
      console.error("Error fetching scenarios:", err);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, [user, lotteryId]);

  const saveScenario = async () => {
    if (!user) {
      toast.error("Faça login para salvar cenários");
      return;
    }
    if (!scenarioName.trim()) {
      toast.error("Digite um nome para o cenário");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("simulation_scenarios").insert({
        user_id: user.id,
        lottery_id: lotteryId,
        name: scenarioName,
        risk_profile: riskProfile,
        volatility: volatility,
        regime_stability: regimeStability,
        weights: simulatedWeights,
      });

      if (error) throw error;
      
      toast.success("Cenário salvo com sucesso!");
      setScenarioName("");
      fetchScenarios();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = (s: SimulationScenario) => {
    setRiskProfile(s.risk_profile as RiskProfile);
    setVolatility(s.volatility);
    setRegimeStability(s.regime_stability);
    setShowHistory(false);
    toast.success(`Cenário "${s.name}" carregado`);
  };

  const deleteScenario = async (id: string) => {
    try {
      const { error } = await supabase.from("simulation_scenarios").delete().eq("id", id);
      if (error) throw error;
      setScenarios(scenarios.filter(s => s.id !== id));
      toast.success("Cenário excluído");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  // Compare history data
  const comparisonData = useMemo(() => {
    return scenarios.slice(0, 5).reverse().map(s => ({
      name: s.name,
      volatility: s.volatility,
      stability: s.regime_stability,
      date: format(new Date(s.created_at), "dd/MM", { locale: ptBR })
    }));
  }, [scenarios]);


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
        <div className="grid md:grid-cols-4 gap-6">
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

          <div className="space-y-4">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-primary" /> Salvar Cenário
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do cenário..."
                className="h-9 text-xs"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={saveScenario} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex flex-col gap-2">

              <Button 
                size="sm" 
                variant={selectedForComparison.includes("current") ? "default" : "outline"}
                className="h-8 text-[10px] gap-2 border-primary/20"
                onClick={() => toggleComparison("current")}
              >
                {selectedForComparison.includes("current") ? <Check className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                Comparar Atual
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-8 text-[10px] gap-2 border-primary/20" 
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-3.5 h-3.5" />
                {showHistory ? "Fechar Histórico" : "Ver Cenários Salvos"}
              </Button>
            </div>
          </div>
        </div>

        {/* Comparison Dashboard */}
        {comparisonResult && (
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-black text-foreground">Dashboard Comparativo de Cenários</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedForComparison([])} className="h-7 text-[10px] text-muted-foreground">
                <X className="w-3 h-3 mr-1" /> Limpar Comparação
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Metric Comparison Bars */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Diferença de Pesos por Métrica</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBarChart data={comparisonResult.metrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <ReTooltip contentStyle={{ fontSize: 10, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                      {comparisonResult.scenarios.map((s, i) => (
                        <Bar 
                          key={s.id} 
                          dataKey={s.name} 
                          fill={i === 0 ? "hsl(var(--primary))" : i === 1 ? "hsl(var(--accent))" : i === 2 ? "#ec4899" : "#8b5cf6"} 
                          radius={[4, 4, 0, 0]} 
                        />
                      ))}
                    </ReBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Settings Summary Table */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Parâmetros de Entrada</p>
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <table className="w-full text-[10px] text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="p-2 font-bold">Cenário</th>
                        <th className="p-2 font-bold">Perfil</th>
                        <th className="p-2 font-bold">Volat.</th>
                        <th className="p-2 font-bold">Estab.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResult.scenarios.map(s => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-2 font-medium truncate max-w-[100px]">{s.name}</td>
                          <td className="p-2">{riskLabels[s.risk_profile as RiskProfile]}</td>
                          <td className="p-2 font-mono text-primary">{(s.volatility * 100).toFixed(0)}%</td>
                          <td className="p-2 font-mono text-accent">{(s.regime_stability * 100).toFixed(0)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg border border-primary/10">
                  <p className="text-[10px] leading-relaxed text-primary italic">
                    <Info className="w-3 h-3 inline mr-1 mb-0.5" />
                    <strong>Dica de Análise:</strong> Observe como as métricas de Dispersão e Atraso (Gap) oscilam entre os cenários. Maiores divergências indicam instabilidade no comportamento estatístico da dezenas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History/Comparison Section */}
        {showHistory && (
          <div className="grid md:grid-cols-2 gap-6 p-4 rounded-xl bg-muted/20 border border-border">
            <div className="space-y-3">
              <h4 className="text-xs font-bold flex items-center gap-2">
                <FolderOpen className="w-3.5 h-3.5 text-primary" /> Cenários Salvos
              </h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                {scenarios.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">Nenhum cenário salvo ainda.</p>
                ) : (
                  scenarios.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border group hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => loadScenario(s)}>
                        <div 
                          className="shrink-0" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComparison(s.id);
                          }}
                        >
                          {selectedForComparison.includes(s.id) ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground/30" />
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-foreground">{s.name}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {riskLabels[s.risk_profile as RiskProfile]} • Vol: {Math.round(s.volatility * 100)}% • Est: {Math.round(s.regime_stability * 100)}%
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteScenario(s.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold flex items-center gap-2">
                <BarChart className="w-3.5 h-3.5 text-primary" /> Histórico Comparativo
              </h4>
              <div className="h-40">
                {comparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 9 }} />
                      <ReTooltip contentStyle={{ fontSize: 10, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                      <Line type="monotone" dataKey="volatility" name="Volatilidade" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="stability" name="Estabilidade" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground italic">
                    Dados insuficientes para gerar gráfico histórico.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
