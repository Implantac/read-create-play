import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";

export function AchievementDisplay() {
  const { user } = useAuth();

  const { data: achievements } = useQuery({
    queryKey: ["user_achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select("unlocked_at, achievement_type, metadata")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });

      if (error) return [];
      return data;
    },
    enabled: !!user,
  });

  if (!achievements || achievements.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Nenhuma conquista ainda</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {achievements.map((achievement: any, idx: number) => {
        const Icon = (LucideIcons as any)[achievement.badges.icon] || LucideIcons.Award;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-4 rounded-2xl flex flex-col items-center text-center gap-2 group hover:border-primary/40 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-tight">{achievement.badges.name}</p>
              <p className="text-[8px] text-muted-foreground leading-tight mt-1 line-clamp-2">{achievement.badges.description}</p>
            </div>
            <Badge variant="outline" className="text-[7px] font-mono mt-auto opacity-50">
              {new Date(achievement.unlocked_at).toLocaleDateString()}
            </Badge>
          </motion.div>
        );
      })}
    </div>
  );
}
