import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  loading?: boolean;
}

export const StatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  className,
  loading 
}: StatsCardProps) => {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden glass-card border-white/5", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-muted/40 animate-pulse rounded-full" />
          <div className="h-5 w-5 bg-muted/40 animate-pulse rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-20 bg-muted/40 animate-pulse rounded-xl mb-3" />
          <div className="h-3 w-32 bg-muted/40 animate-pulse rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 glass-card border-white/5 group relative active:scale-[0.98]", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
        {Icon && <Icon className="w-16 h-16" />}
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-2">
          {title}
        </CardTitle>
        {Icon && (
          <div className="p-2 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-500 group-hover:scale-110 shadow-inner">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="text-3xl md:text-4xl font-black tracking-tighter text-foreground font-mono group-hover:text-glow-green transition-all tabular-nums italic">
          {value}
        </div>

        {(description || trend) && (
          <div className="text-[9px] text-muted-foreground mt-3 flex items-center gap-2 font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
            {trend && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-lg font-black flex items-center gap-0.5 border",
                trend.isPositive ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border-rose-500/20"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {description}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";
