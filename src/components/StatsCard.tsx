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
  green: "text-neon-green glow-green",
  blue: "text-neon-blue glow-blue",
  amber: "text-neon-amber glow-amber",
  red: "text-neon-red",
};

const iconColorMap = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  amber: "text-neon-amber",
  red: "text-neon-red",
};

export function StatsCard({ title, value, subtitle, icon: Icon, color = "green" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-card border border-border p-5 ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</span>
        <Icon className={`w-4 h-4 ${iconColorMap[color]}`} />
      </div>
      <div className="text-3xl font-bold font-mono">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
}
