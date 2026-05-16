import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: "green" | "blue" | "amber" | "red";
}

const colorMap = {
  green: "border-primary/10 hover:border-primary/30",
  blue: "border-blue-500/10 hover:border-blue-500/30",
  amber: "border-accent/10 hover:border-accent/30",
  red: "border-red-500/10 hover:border-red-500/30",
};

const iconBgMap = {
  green: "bg-primary/10 border-primary/20",
  blue: "bg-blue-500/10 border-blue-500/20",
  amber: "bg-accent/10 border-accent/20",
  red: "bg-red-500/10 border-red-500/20",
};

const iconColorMap = {
  green: "text-primary",
  blue: "text-blue-500",
  amber: "text-accent",
  red: "text-red-500",
};

export function StatsCard({ title, value, subtitle, icon: Icon, color = "green" }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-xl glass-card p-4 transition-all duration-500 hover:shadow-2xl group border border-white/5 hover:border-primary/40`}>
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none rounded-full ${color === 'green' ? 'bg-primary' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-accent' : 'bg-red-500'}`} />
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-500 group-hover:bg-primary/20 group-hover:border-primary/40 shadow-inner ${iconBgMap[color]}`}>
          <Icon className={`w-4 h-4 ${iconColorMap[color]}`} />
        </div>
        <span className="text-[9px] uppercase font-bold tracking-[0.15em] text-muted-foreground/80">{title}</span>
      </div>
      
      <div className="relative z-10">
        <div className={`text-4xl font-black tracking-tighter leading-none mb-1 ${iconColorMap[color]}`}>{value}</div>
        {subtitle && (
          <p className="text-[10px] font-medium text-muted-foreground/60 tracking-tight flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-primary/40" />
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
