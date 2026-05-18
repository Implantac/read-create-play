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
    <div className={`rounded-xl glass-card p-5 transition-all duration-300 hover:translate-y-[-1px] ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{title}</span>
        <div className={`w-8 h-8 rounded-lg ${iconBgMap[color]} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColorMap[color]}`} />
        </div>
      </div>
      <div className={`text-3xl font-bold font-mono ${valueColorMap[color]}`}>{value}</div>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>}
    </div>
  );
}
