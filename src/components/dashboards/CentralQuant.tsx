import { useState, useMemo } from "react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, AlertCircle, ShieldCheck } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatters";

export function CentralQuant() {
  const { config, stats, draws } = useLotteryContext();
  
  const bankroll = 1000; // Mocked for now
  const exposure = 25; // %
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3 text-primary" />
            Estado da Banca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{formatCurrency(bankroll)}</div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">Capital Quantitativo Disponível</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Exposição ao Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{exposure}%</div>
          <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${exposure}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-blue-500" />
            Integridade Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">100%</div>
          <Badge variant="outline" className="mt-2 text-[8px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Sincronizado</Badge>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            Sinal Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black uppercase text-amber-500">Moderado</div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase">Lift: 1.08 | p-value: 0.04</p>
        </CardContent>
      </Card>
    </div>
  );
}
