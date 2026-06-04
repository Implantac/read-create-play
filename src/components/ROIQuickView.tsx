import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Calendar, Wallet, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ROIQuickView() {
  const { selectedLottery } = useLotteryContext();
  const { user } = useAuth();
  
  const { data: roiData } = useQuery({
    queryKey: ["user_roi_tracking", selectedLottery, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roi_tracking")
        .select("*")
        .eq("lottery_id", selectedLottery)
        .eq("user_id", user?.id)
        .order("bet_date", { ascending: false })
        .limit(10);
      
      if (error) return null;
      
      const totalSpent = data.reduce((acc, curr) => acc + Number(curr.amount_spent), 0);
      const totalWon = data.reduce((acc, curr) => acc + Number(curr.amount_won || 0), 0);
      const roi = totalSpent > 0 ? ((totalWon - totalSpent) / totalSpent) * 100 : 0;
      
      return { totalSpent, totalWon, roi, history: data };
    },
    enabled: !!user,
  });

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Performance Financeira
        </CardTitle>
        <Link to="/roi">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-black tracking-tighter">Detalhes</Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase font-black">Investimento</p>
            <p className="text-sm font-mono font-black">R$ {roiData?.totalSpent.toFixed(2) || "0.00"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase font-black">Retorno</p>
            <p className="text-sm font-mono font-black text-primary">R$ {roiData?.totalWon.toFixed(2) || "0.00"}</p>
          </div>
        </div>
        
        <div className={`p-3 rounded-xl border text-center ${roiData && roiData.roi >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <p className="text-[9px] text-muted-foreground uppercase font-black">ROI Acumulado</p>
          <p className={`text-xl font-mono font-black ${roiData && roiData.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {roiData && roiData.roi >= 0 ? '+' : ''}{roiData?.roi.toFixed(1) || "0.0"}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
