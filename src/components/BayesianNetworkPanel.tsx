import { useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  buildConditionalNetwork,
  detectConditionalTrends,
  computeMutualInformation,
  type ConditionalNode,
  type ConditionalTrend,
} from "@/ai/engines/bayesianNetworkEngine";
import { DrawResult, LotteryConfig } from "@/data/lotteries";
import { NumberStats } from "@/engine/statistics";
import { Network, Zap, TrendingUp, TrendingDown, Minus, Info, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";

interface Props {
  config: LotteryConfig;
  draws: DrawResult[];
  stats: FrequencyStats[];
}

function circleLayout(count: number, cx: number, cy: number, r: number) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return positions;
}

export function BayesianNetworkPanel({ config, draws, stats }: Props) {
  const [liftThreshold, setLiftThreshold] = useState(1.25);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [showTrends, setShowTrends] = useState(false);

  const lotteryId = config.id || "lotofacil";

  const network = useMemo(
    () => buildConditionalNetwork(draws, lotteryId, 120),
    [draws, lotteryId]
  );

  const trends = useMemo(
    () => (showTrends ? detectConditionalTrends(draws, lotteryId) : []),
    [draws, lotteryId, showTrends]
  );

  const miScores = useMemo(
    () => computeMutualInformation(draws, lotteryId, 100),
    [draws, lotteryId]
  );

  const trendMap = useMemo(() => {
    const m = new Map<number, ConditionalTrend>();
    for (const t of trends) m.set(t.number, t);
    return m;
  }, [trends]);

  const edges = useMemo(() => {
    const e: { from: number; to: number; lift: number; prob: number }[] = [];
    for (const node of network) {
      for (const c of node.conditionals) {
        if (c.lift >= liftThreshold && c.given <= config.numbers) {
          e.push({ from: c.given, to: node.number, lift: c.lift, prob: c.probability });
        }
      }
    }
    const seen = new Set<string>();
    const unique: typeof e = [];
    for (const edge of e.sort((a, b) => b.lift - a.lift)) {
      const key = [Math.min(edge.from, edge.to), Math.max(edge.from, edge.to)].join("-");
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(edge);
      }
    }
    return unique;
  }, [network, liftThreshold, config.numbers]);

  const svgW = 520;
  const svgH = 520;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const radius = Math.min(svgW, svgH) / 2 - 30;

  const positions = useMemo(
    () => circleLayout(config.numbers, cx, cy, radius),
    [config.numbers, cx, cy, radius]
  );

  const nodeMap = useMemo(() => {
    const m = new Map<number, ConditionalNode>();
    for (const n of network) m.set(n.number, n);
    return m;
  }, [network]);

  const maxCentrality = useMemo(
    () => Math.max(1, ...network.map((n) => n.centrality)),
    [network]
  );

  const selectedEdges = useMemo(() => {
    if (selectedNode === null) return edges;
    return edges.filter((e) => e.from === selectedNode || e.to === selectedNode);
  }, [edges, selectedNode]);

  const handleNodeClick = useCallback((num: number) => {
    setSelectedNode((prev) => (prev === num ? null : num));
  }, []);

  const selectedNodeData = selectedNode !== null ? nodeMap.get(selectedNode) : null;

  if (network.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Rede Bayesiana</h3>
            <p className="text-[10px] text-muted-foreground">Dados insuficientes (mín. 20 sorteios)</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Network className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Rede Bayesiana Condicional</h3>
            <p className="text-[10px] text-muted-foreground">
              Conexões condicionais entre dezenas • {edges.length} arestas ativas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {network.length} nós
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            Lift ≥ {liftThreshold.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Lift mínimo:</Label>
          <Slider
            value={[liftThreshold]}
            onValueChange={([v]) => setLiftThreshold(v)}
            min={1.05}
            max={2.0}
            step={0.05}
            className="flex-1"
          />
          <span className="font-mono text-[10px] w-8 text-right">{liftThreshold.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showLabels} onCheckedChange={setShowLabels} id="labels" />
          <Label htmlFor="labels" className="text-[10px] flex items-center gap-1">
            {showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Labels
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showTrends} onCheckedChange={setShowTrends} id="trends" />
          <Label htmlFor="trends" className="text-[10px]">Tendências</Label>
        </div>
        {selectedNode !== null && (
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setSelectedNode(null)}>
            Limpar seleção
          </Button>
        )}
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-[520px] mx-auto"
          style={{ minHeight: 320 }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--primary) / 0.4)" />
            </marker>
          </defs>

          <AnimatePresence>
            {selectedEdges.map((edge) => {
              const fromPos = positions[edge.from - 1];
              const toPos = positions[edge.to - 1];
              if (!fromPos || !toPos) return null;
              const opacity = Math.min(1, 0.15 + (edge.lift - 1) * 0.6);
              const strokeWidth = Math.min(3, 0.5 + (edge.lift - 1) * 2);
              return (
                <motion.line
                  key={`${edge.from}-${edge.to}`}
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="hsl(var(--primary))"
                  strokeOpacity={opacity}
                  strokeWidth={strokeWidth}
                  markerEnd="url(#arrowhead)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              );
            })}
          </AnimatePresence>

          <TooltipProvider>
            {Array.from({ length: config.numbers }, (_, i) => i + 1).map((num) => {
              const pos = positions[num - 1];
              if (!pos) return null;
              const node = nodeMap.get(num);
              const centrality = node?.centrality ?? 0;
              const posterior = node?.posterior ?? 0;
              const trend = trendMap.get(num);
              const normalizedCentrality = centrality / maxCentrality;
              const nodeRadius = 10 + normalizedCentrality * 6;
              const isSelected = selectedNode === num;
              const isConnected =
                selectedNode !== null &&
                selectedEdges.some((e) => e.from === num || e.to === num);
              const dimmed = selectedNode !== null && !isSelected && !isConnected;

              const hue = posterior > 0.5 ? 145 : posterior > 0.3 ? 48 : 215;

              return (
                <g
                  key={num}
                  className="cursor-pointer"
                  onClick={() => handleNodeClick(num)}
                  opacity={dimmed ? 0.2 : 1}
                >
                  {isSelected && (
                    <circle cx={pos.x} cy={pos.y} r={nodeRadius + 5} fill="hsl(var(--primary) / 0.15)" />
                  )}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={nodeRadius}
                    fill={`hsl(${hue}, 60%, ${isSelected ? 35 : 20}%)`}
                    stroke={isSelected ? "hsl(var(--primary))" : `hsl(${hue}, 50%, 40%)`}
                    strokeWidth={isSelected ? 2.5 : 1}
                  />
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="hsl(var(--foreground))"
                    fontSize={nodeRadius > 13 ? 9 : 7}
                    fontWeight="bold"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {String(num).padStart(2, "0")}
                  </text>

                  {showTrends && trend && trend.trendDirection !== "stable" && (
                    <text
                      x={pos.x + nodeRadius + 2}
                      y={pos.y - nodeRadius + 2}
                      fill={trend.trendDirection === "strengthening" ? "hsl(145, 70%, 50%)" : "hsl(0, 70%, 55%)"}
                      fontSize={8}
                      fontWeight="bold"
                    >
                      {trend.trendDirection === "strengthening" ? "▲" : "▼"}
                    </text>
                  )}
                </g>
              );
            })}
          </TooltipProvider>
        </svg>
      </div>

      <AnimatePresence>
        {selectedNodeData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center font-mono font-bold text-sm text-primary">
                {String(selectedNodeData.number).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  Dezena {String(selectedNodeData.number).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Prior: {(selectedNodeData.prior * 100).toFixed(1)}% •
                  Posterior: {(selectedNodeData.posterior * 100).toFixed(1)}% •
                  Centralidade: {selectedNodeData.centrality} •
                  MI: {(miScores.get(selectedNodeData.number) ?? 0).toFixed(4)}
                </p>
              </div>
              {trendMap.get(selectedNodeData.number) && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1"
                >
                  {trendMap.get(selectedNodeData.number)!.trendDirection === "strengthening" ? (
                    <><TrendingUp className="w-3 h-3 text-primary" /> Fortalecendo</>
                  ) : trendMap.get(selectedNodeData.number)!.trendDirection === "weakening" ? (
                    <><TrendingDown className="w-3 h-3 text-destructive" /> Enfraquecendo</>
                  ) : (
                    <><Minus className="w-3 h-3" /> Estável</>
                  )}
                </Badge>
              )}
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Top conexões condicionais (lift)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedNodeData.conditionals.slice(0, 10).map((c) => (
                  <Badge
                    key={c.given}
                    variant={c.lift > 1 ? "default" : "destructive"}
                    className="text-[10px] font-mono gap-1 cursor-pointer"
                    onClick={() => setSelectedNode(c.given)}
                  >
                    {String(c.given).padStart(2, "0")}
                    <span className="opacity-70">
                      {c.lift > 1 ? "+" : ""}
                      {((c.lift - 1) * 100).toFixed(0)}%
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground border-t border-border pt-3">
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>Tamanho do nó = centralidade</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 rounded bg-primary opacity-60" />
          <span>Arestas = lift condicional</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(145, 60%, 20%)" }} />
          <span>Alta posterior</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(48, 60%, 20%)" }} />
          <span>Média</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(215, 60%, 20%)" }} />
          <span>Baixa</span>
        </div>
      </div>
    </Card>
  );
}
