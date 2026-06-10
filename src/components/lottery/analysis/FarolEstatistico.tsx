import React from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { FarolStats } from "@/engine/stats/farol-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Snowflake, 
  TrendingUp, 
  TrendingDown, 
  CircleDot, 
  Zap,
  Activity,
  History,
  Repeat
} from "lucide-react";
import { motion } from "framer-motion";

export function FarolEstatistico() {
  const { farol, cycle, config } = useLotteryContext();

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "Elite": return "text-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]";
      case "Strong": return "text-emerald-400";
      case "Medium": return "text-amber-400";
      default: return "text-muted-foreground";
    }
  };

  const getTrendIcon = (status: string) => {
    if (status === "hot") return <TrendingUp className="w-3 h-3 text-primary" />;
    if (status === "cold") return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <CircleDot className="w-3 h-3 text-amber-400" />;
  };

  if (!farol || farol.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass-card bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <History className="w-6 h-6 text-primary mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Ciclo Atual</p>
            <p className="text-2xl font-black italic">#{cycle?.currentCycle || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Zap className="w-6 h-6 text-emerald-400 mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Faltam p/ Fechar</p>
            <p className="text-2xl font-black italic">{cycle?.missingNumbers.length || 0} dez</p>
          </CardContent>
        </Card>
        <Card className="glass-card bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Activity className="w-6 h-6 text-amber-400 mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Tempo Médio</p>
            <p className="text-2xl font-black italic">{cycle?.avgDrawsToClose.toFixed(1) || 0} conc</p>
          </CardContent>
        </Card>
        <Card className="glass-card bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Repeat className="w-6 h-6 text-primary mb-2" />
            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Sorteios no Ciclo</p>
            <p className="text-2xl font-black italic">{cycle?.drawsInCurrentCycle || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-white/10 bg-black/40 backdrop-blur-xl">
        <CardHeader className="pb-2 border-b border-white/5">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 italic">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Painel FAROL de Dezenas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="p-4">Dezena</th>
                  <th className="p-4">Titan Score</th>
                  <th className="p-4">Freq (Hist/50/10)</th>
                  <th className="p-4">Atraso (Atu/Máx)</th>
                  <th className="p-4">Repetições</th>
                  <th className="p-4">Tendência</th>
                  <th className="p-4">Correlação Top 1</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {farol.sort((a, b) => b.titanScore - a.titanScore).map((s, idx) => (
                  <motion.tr 
                    key={s.number}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black font-mono border ${
                          s.titanScore >= 90 ? "bg-primary/20 border-primary text-primary" : "bg-black/40 border-white/10 text-foreground"
                        }`}>
                          {String(s.number).padStart(2, '0')}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1.5 w-32">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className={getGradeColor(s.titanGrade)}>{s.titanGrade}</span>
                          <span className="font-mono">{s.titanScore}%</span>
                        </div>
                        <Progress value={s.titanScore} className="h-1" />
                      </div>
                    </td>
                    <td className="p-4 font-mono text-muted-foreground">
                      <span className="text-foreground font-bold">{s.historicalFreq}</span> / {s.recentFreq50} / <span className="text-primary font-bold">{s.recentFreq10}</span>
                    </td>
                    <td className="p-4 font-mono">
                      <span className={s.currentDelay > s.avgGap ? "text-primary font-bold" : "text-muted-foreground"}>
                        {s.currentDelay}
                      </span> / {s.maxDelay}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`w-2 h-2 rounded-full ${s.repeatLast5 >= i ? "bg-emerald-500" : "bg-white/5"}`} />
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-black uppercase text-[10px]">
                        {getTrendIcon(s.trendStatus)}
                        <span className={s.trendStatus === "hot" ? "text-primary" : s.trendStatus === "cold" ? "text-destructive" : "text-amber-400"}>
                          {s.trendStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {s.correlations.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[9px] bg-primary/5 text-primary border-primary/20">
                            {String(s.correlations[0].number).padStart(2, '0')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">({s.correlations[0].percentage.toFixed(0)}%)</span>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
