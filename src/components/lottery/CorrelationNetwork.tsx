import { useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Activity } from "lucide-react";

export function CorrelationNetwork() {
  const { farol } = useLotteryContext();

  const correlations = useMemo(() => {
    if (!farol || farol.length === 0) return [];
    
    // Get top 15 numbers by titanScore for a cleaner visual
    const topNumbers = [...farol]
      .sort((a, b) => b.titanScore - a.titanScore)
      .slice(0, 15);

    return topNumbers.map((num, i) => {
      const angle = (i / 15) * 2 * Math.PI;
      const x = 50 + 35 * Math.cos(angle);
      const y = 50 + 35 * Math.sin(angle);
      
      return {
        ...num,
        x,
        y,
        topCorrelations: num.correlations.slice(0, 3)
      };
    });
  }, [farol]);

  if (!farol || farol.length === 0) return null;

  return (
    <Card className="glass-panel border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" />
          Rede de Correlação Titan (Top 15 Elite)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-square w-full max-w-[400px] mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Lines first so they are behind nodes */}
            {correlations.map((node) => 
              node.topCorrelations.map((rel, idx) => {
                const target = correlations.find(c => c.number === rel.number);
                if (!target) return null;
                
                return (
                  <line
                    key={`${node.number}-${rel.number}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="currentColor"
                    strokeWidth={rel.percentage / 40}
                    strokeOpacity={rel.percentage / 100}
                    className="text-primary/30"
                  />
                );
              })
            )}
            
            {/* Nodes */}
            {correlations.map((node) => (
              <g key={node.number} className="group cursor-help">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="3.5"
                  fill="currentColor"
                  className={node.titanGrade === 'Elite' ? 'text-primary' : 'text-muted-foreground'}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="3.5"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-white/20"
                />
                <text
                  x={node.x}
                  y={node.y + 0.8}
                  textAnchor="middle"
                  fontSize="2.5"
                  fontWeight="black"
                  fill="white"
                  className="pointer-events-none"
                >
                  {node.number}
                </text>
                
                {/* Hover effect */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="5"
                  fill="currentColor"
                  className="text-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </g>
            ))}
          </svg>
          
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Dezena Elite</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Alta Tendência</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[9px] leading-relaxed text-muted-foreground italic flex items-start gap-2">
            <Activity className="w-3 h-3 text-primary shrink-0 mt-0.5" />
            "A rede acima visualiza as conexões mais fortes detectadas pelo motor Titan. Dezenas conectadas possuem tendência de sorteio simultâneo (afinidade de grupo)."
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
