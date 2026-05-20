import { LucideIcon, Info, TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "green" | "blue" | "amber" | "red";
  trend?: number;
}

const colorMap = {
  green: "border-primary/20 hover:border-primary/30",
  blue: "border-neon-blue/20 hover:border-neon-blue/30",
  amber: "border-accent/20 hover:border-accent/30",
  red: "border-neon-red/20 hover:border-neon-red/30",
};

const iconBgMap = {
  green: "bg-primary/10",
  blue: "bg-neon-blue/10",
  amber: "bg-accent/10",
  red: "bg-neon-red/10",
};

const iconColorMap = {
  green: "text-primary",
  blue: "text-neon-blue",
  amber: "text-accent",
  red: "text-neon-red",
};

const valueColorMap = {
  green: "text-primary",
  blue: "text-neon-blue",
  amber: "text-accent",
  red: "text-neon-red",
};

const Sparkline = ({ color }: { color: string }) => {
  const points = Array.from({ length: 10 }, (_, i) => ({
    x: (i * 100) / 9,
    y: 20 + Math.random() * 60
  }));
  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  return (
    <div className="h-8 w-full mt-2 overflow-hidden opacity-50 group-hover:opacity-100 transition-opacity">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={pathData}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={color}
        />
        <path
          d={`${pathData} L 100,100 L 0,100 Z`}
          fill="currentColor"
          className={`${color} opacity-10`}
        />
      </svg>
    </div>
  );
};

export function StatsCard({ title, value, subtitle, icon: Icon, color = "green", trend }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`rounded-xl glass-card p-5 transition-all duration-300 group relative overflow-hidden border ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{title}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="text-[10px] max-w-[200px] glass-card border-primary/20">
                {subtitle || title}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={`w-8 h-8 rounded-lg ${iconBgMap[color]} flex items-center justify-center transition-transform group-hover:scale-110`}>
          <Icon className={`w-4 h-4 ${iconColorMap[color]}`} />
        </div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <div className={`text-3xl font-bold font-mono transition-all group-hover:tracking-tight ${valueColorMap[color]}`}>
          <AnimatePresence mode="wait">
            <motion.span
              key={String(value)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {value}
            </motion.span>
          </AnimatePresence>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend > 0 ? 'text-primary' : trend < 0 ? 'text-neon-red' : 'text-muted-foreground'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '•'}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-1.5 relative z-10 leading-tight">{subtitle}</p>}
      
      <Sparkline color={iconColorMap[color]} />
      
      {/* Decorative background element */}
      <div className={`absolute -right-2 -bottom-2 w-24 h-24 rounded-full ${iconBgMap[color]} blur-2xl opacity-0 group-hover:opacity-20 transition-opacity`} />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
    </motion.div>
  );
}
