import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "green" | "blue" | "amber" | "red";
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

export function StatsCard({ title, value, subtitle, icon: Icon, color = "green" }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl glass-card p-5 transition-all duration-300 hover:translate-y-[-2px] group relative overflow-hidden ${colorMap[color]}`}
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
      <div className={`text-3xl font-bold font-mono relative z-10 transition-all group-hover:tracking-tight ${valueColorMap[color]}`}>
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
      {subtitle && <p className="text-[11px] text-muted-foreground mt-1.5 relative z-10">{subtitle}</p>}
      
      {/* Decorative background element */}
      <div className={`absolute -right-2 -bottom-2 w-24 h-24 rounded-full ${iconBgMap[color]} blur-2xl opacity-0 group-hover:opacity-20 transition-opacity`} />
    </motion.div>
  );
}

