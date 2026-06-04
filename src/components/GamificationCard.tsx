import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Star, Target, Shield, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RANK_DATA = [
  { level: 1, name: "Iniciante", icon: Star, color: "text-slate-400" },
  { level: 2, name: "Explorador", icon: Target, color: "text-blue-400" },
  { level: 3, name: "Estrategista", icon: Shield, color: "text-emerald-400" },
  { level: 4, name: "Especialista", icon: Award, color: "text-purple-400" },
  { level: 5, name: "Mestre", icon: Trophy, color: "text-amber-400" },
  { level: 6, name: "Lenda Titan", icon: Crown, color: "text-primary shadow-primary" },
];

export function GamificationCard() {
  const { user } = useAuth();
  
  const { data: gamification } = useQuery({
    queryKey: ["user_gamification", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (error) return null;
      if (!data) {
        // Create initial record if not exists
        const { data: newData } = await supabase
          .from("user_gamification")
          .insert({ user_id: user.id })
          .select()
          .single();
        return newData;
      }
      return data;
    },
    enabled: !!user,
  });

  const level = gamification?.level || 1;
  const xp = gamification?.xp || 0;
  const nextLevelXp = level * 1000;
  const progress = (xp / nextLevelXp) * 100;
  
  const currentRank = RANK_DATA.find(r => r.level === level) || RANK_DATA[0];
  const Icon = currentRank.icon;

  return (
    <Card className="glass-card border-primary/20 bg-primary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          Status de Jogador
          <Badge variant="outline" className="font-mono bg-primary/10 text-primary border-primary/20">
            Nível {level}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl bg-background/50 border border-primary/20 flex items-center justify-center shadow-lg ${currentRank.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-lg uppercase italic tracking-tight">{currentRank.name}</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{xp} / {nextLevelXp} XP</p>
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
            <span>Progresso do Nível</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="p-2 rounded-lg bg-background/30 border border-white/5 text-center">
            <p className="text-[9px] text-muted-foreground uppercase font-bold">Jogos Gerados</p>
            <p className="text-sm font-mono font-black">{gamification?.total_games_generated || 0}</p>
          </div>
          <div className="p-2 rounded-lg bg-background/30 border border-white/5 text-center">
            <p className="text-[9px] text-muted-foreground uppercase font-bold">Acertos</p>
            <p className="text-sm font-mono font-black text-emerald-400">{gamification?.total_games_won || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Crown } from "lucide-react";
