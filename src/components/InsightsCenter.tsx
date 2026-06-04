import { useLotteryContext } from "@/contexts/LotteryContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, AlertCircle, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function InsightsCenter() {
  const { selectedLottery } = useLotteryContext();
  
  const { data: insights, isLoading } = useQuery({
    queryKey: ["system_insights", selectedLottery],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_insights")
        .select("*")
        .eq("lottery_id", selectedLottery)
        .order("score", { ascending: false })
        .limit(3);
      
      if (error) return [];
      return data;
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'opportunity': return <Sparkles className="w-4 h-4 text-primary" />;
      case 'alert': return <AlertCircle className="w-4 h-4 text-amber-400" />;
      default: return <Brain className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Card className="glass-card border-primary/20 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Central de Insights IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 w-full bg-muted/20 animate-pulse rounded-xl" />)}
          </div>
        ) : insights && insights.length > 0 ? (
          insights.map((insight) => (
            <div key={insight.id} className="p-3 rounded-xl bg-background/40 border border-white/5 hover:border-primary/30 transition-all group cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(insight.insight_type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{insight.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{insight.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Aguardando novos sinais...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
