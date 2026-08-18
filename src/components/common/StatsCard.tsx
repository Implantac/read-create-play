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
  loading,
}: StatsCardProps) => {
  if (loading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-3 w-24 bg-muted/60 animate-pulse rounded" />
          <div className="h-5 w-5 bg-muted/60 animate-pulse rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 bg-muted/60 animate-pulse rounded mb-2" />
          <div className="h-3 w-32 bg-muted/60 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden group relative hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300",
        "p-3 sm:p-6",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0 sm:p-0 mb-1 sm:mb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
          {title}
        </CardTitle>
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 group-hover:shadow-gold-glow transition-all">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0 sm:p-0">
        <div className="text-xl sm:text-3xl font-black tracking-tighter text-foreground font-mono tabular-nums italic">
          {value}
        </div>

        {(description || trend) && (
          <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 text-[10px]",
                  trend.isPositive
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-rose-400 bg-rose-500/10",
                )}
              >
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
