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
    <div className={`relative overflow-hidden rounded-2xl glass-card p-5 transition-all duration-300 hover:shadow-xl group border ${colorMap[color]}`}>
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none rounded-full ${color === 'green' ? 'bg-primary' : color === 'blue' ? 'bg-blue-500' : color === 'amber' ? 'bg-accent' : 'bg-red-500'}`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/70">{title}</span>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${iconBgMap[color]}`}>
          <Icon className={`w-4 h-4 ${iconColorMap[color]}`} />
        </div>
      </div>
      
      <div className="flex items-baseline gap-1 relative z-10">
        <div className={`text-3xl font-black tracking-tighter ${iconColorMap[color]}`}>{value}</div>
      </div>
      
      {subtitle && (
        <div className="flex items-center gap-1.5 mt-2 relative z-10">
          <div className={`w-1 h-1 rounded-full ${iconBgMap[color].split(' ')[0]}`} />
          <p className="text-[11px] font-bold text-muted-foreground/60 tracking-tight">{subtitle}</p>
        </div>
      )}
    </div>
  );
}
