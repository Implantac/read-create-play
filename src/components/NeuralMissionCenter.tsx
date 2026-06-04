import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

export function NeuralMissionCenter() {
  const { user } = useAuth();

  const { data: missions, isLoading } = useQuery({
    queryKey: ["user_missions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all available missions
      const { data: allMissions } = await supabase
        .from("missions")
        .select("*");
        
      if (!allMissions) return [];

      // Get user progress
      const { data: userMissions } = await supabase
        .from("user_missions")
        .select("*")
        .eq("user_id", user.id);

      // Merge data
      return allMissions.map(m => {
        const userProgress = userMissions?.find(um => um.mission_id === m.id);
        return {
          ...m,
          current_progress: userProgress?.current_progress || 0,
          completed_at: userProgress?.completed_at || null
        };
      });
    },
    enabled: !!user,
  });

  if (isLoading) return <div className="h-48 flex items-center justify-center"><LucideIcons.Loader2 className="animate-spin" /></div>;

  return (
    <Card className="glass-card border-primary/20 bg-black/40 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LucideIcons.Zap className="w-4 h-4 text-primary" />
            Missões Neurais
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-primary/60">ESTATÍSTICAS EM TEMPO REAL</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {missions?.map((mission: any, idx: number) => {
          const Icon = (LucideIcons as any)[mission.icon] || LucideIcons.CircleDot;
          const isCompleted = !!mission.completed_at;
          const progress = Math.min((mission.current_progress / mission.requirement_count) * 100, 100);

          return (
            <motion.div 
              key={mission.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-3 rounded-xl border transition-all ${
                isCompleted 
                  ? "bg-primary/5 border-primary/20 opacity-80" 
                  : "bg-white/5 border-white/10 hover:border-primary/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                  isCompleted ? "bg-primary/20 border-primary/40" : "bg-black/40 border-white/5"
                }`}>
                  <Icon className={`w-5 h-5 ${isCompleted ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black uppercase tracking-tight truncate">{mission.title}</h4>
                    <span className="text-[10px] font-mono text-primary">+{mission.xp_reward} XP</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{mission.description}</p>
                  
                  <div className="space-y-1">
                    <Progress value={progress} className="h-1" />
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>{isCompleted ? "CONCLUÍDO" : "PROGRESSO"}</span>
                      <span>{mission.current_progress} / {mission.requirement_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
