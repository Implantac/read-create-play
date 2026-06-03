import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
}

export function PageHeader({ title, description, icon: Icon, badge }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-primary/5 group">
          <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase italic">{title}</h1>
            {badge && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/20 animate-pulse">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-70">{description}</p>
        </div>
      </div>
      
      {/* Platform Metadata - Terminal Style */}
      <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-muted-foreground/40">
        <div className="flex flex-col items-end">
          <span className="uppercase">Precision Level</span>
          <span className="text-primary font-bold">99.8%</span>
        </div>
        <div className="w-px h-8 bg-white/5" />
        <div className="flex flex-col items-end">
          <span className="uppercase">Uptime</span>
          <span className="text-accent font-bold">99.9%</span>
        </div>
      </div>
    </motion.div>
  );
}
