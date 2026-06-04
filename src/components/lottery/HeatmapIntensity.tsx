import { useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function HeatmapIntensity() {
  const { config, farol } = useLotteryContext();

  const heatmapData = useMemo(() => {
    if (!farol || farol.length === 0) return [];
    
    // Normalize frequency to 0-1 range
    const maxFreq = Math.max(...farol.map(s => s.frequency));
    const minFreq = Math.min(...farol.map(s => s.frequency));
    const range = maxFreq - minFreq || 1;

    return farol.map(s => ({
      number: s.number,
      intensity: (s.frequency - minFreq) / range,
      frequency: s.frequency,
      delay: s.currentDelay,
      score: s.titanScore
    })).sort((a, b) => a.number - b.number);
  }, [farol]);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 0.8) return "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]";
    if (intensity >= 0.6) return "bg-orange-500";
    if (intensity >= 0.4) return "bg-amber-400";
    if (intensity >= 0.2) return "bg-emerald-400";
    return "bg-slate-700/50";
  };

  return (
    <Card className="glass-panel border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
          Mapa de Calor de Intensidade (FAROL)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center">
          {heatmapData.map((data) => (
            <Tooltip key={data.number}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black font-mono transition-all hover:scale-110 cursor-help border border-white/5",
                    getIntensityColor(data.intensity),
                    data.intensity > 0.4 ? "text-white" : "text-white/60"
                  )}
                >
                  {String(data.number).padStart(2, "0")}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-background/95 backdrop-blur-md border-primary/20 p-3 shadow-2xl">
                <div className="space-y-1.5">
                  <p className="text-xs font-black text-primary uppercase">Dezena {data.number}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Frequência:</span>
                    <span className="text-[10px] text-foreground font-black">{data.frequency}x</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Atraso:</span>
                    <span className="text-[10px] text-foreground font-black">{data.delay} rounds</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Titan Score:</span>
                    <span className="text-[10px] text-primary font-black">{data.score} pts</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Frequente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[8px] font-black uppercase text-muted-foreground">Rara</span>
            </div>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground italic">
            Baseado nos últimos {config.id === 'lotofacil' ? '100' : '50'} concursos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
