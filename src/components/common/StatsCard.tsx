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
          <div className="h-4 w-24 bg-muted/40 animate-pulse rounded" />
          <div className="h-4 w-4 bg-muted/40 animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-16 bg-muted/40 animate-pulse rounded mb-1" />
          <div className="h-3 w-32 bg-muted/40 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 glass-card border-white/5 group", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary group-hover:scale-110 transition-all" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black tracking-tighter text-foreground font-mono">{value}</div>
        {(description || trend) && (
          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium uppercase tracking-tight">
            {trend && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-0.5",
                trend.isPositive ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
              )}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";
