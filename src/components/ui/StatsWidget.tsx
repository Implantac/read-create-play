import { DESIGN_TOKENS, cn } from "@/lib/design-system";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsWidgetProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "emerald" | "amber" | "rose" | "indigo";
}

/**
 * High-density premium stats widget inspired by Bloomberg/Stripe
 */
export function StatsWidget({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  color = "emerald" 
}: StatsWidgetProps) {
  const colorMap = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    rose: "text-rose-500 bg-rose-500/10",
    indigo: "text-indigo-500 bg-indigo-500/10",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-2xl flex flex-col gap-3",
        DESIGN_TOKENS.effects.glass,
        DESIGN_TOKENS.effects.glassHover
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            trend === "up" ? "bg-emerald-500/20 text-emerald-500" : 
            trend === "down" ? "bg-rose-500/20 text-rose-500" : "bg-muted text-muted-foreground"
          )}>
            {trend === "up" ? "+2.4%" : trend === "down" ? "-1.2%" : "Stable"}
          </span>
        )}
      </div>
      
      <div>
        <p className={DESIGN_TOKENS.typography.label}>{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-bold font-mono tracking-tight">{value}</h4>
          {subValue && <span className="text-xs text-muted-foreground">{subValue}</span>}
        </div>
      </div>
    </motion.div>
  );
}
