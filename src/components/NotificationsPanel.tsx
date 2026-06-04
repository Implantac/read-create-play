import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Zap, Trophy, TrendingUp, Users, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export function NotificationsPanel() {
  const { user } = useAuth();
  
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) return [];
      return data;
    },
    enabled: !!user,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'strategy': return <Zap className="w-4 h-4 text-primary" />;
      case 'result': return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'achievement': return <Target className="w-4 h-4 text-accent" />;
      case 'affiliate': return <Users className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Alertas do Sistema
        </CardTitle>
        {notifications && notifications.some(n => !n.read) && (
          <Badge className="h-5 px-1.5 bg-primary text-[8px] font-black uppercase">Novo</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-14 w-full bg-muted/20 animate-pulse rounded-xl" />)}
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.id} className={`p-3 rounded-xl border transition-all ${notif.read ? 'bg-background/20 border-white/5 opacity-60' : 'bg-primary/5 border-primary/20 shadow-lg shadow-primary/5'}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-[11px] font-bold text-foreground leading-tight">{notif.title}</h4>
                    <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.created_at || ''), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Tudo limpo por aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
