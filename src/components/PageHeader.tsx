import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, badge, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/5 relative z-20"
    >
      <div className="absolute -bottom-px left-0 w-48 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-2xl shadow-primary/5 group transition-all duration-500 hover:rotate-6">
          <Icon className="w-7 h-7 text-primary group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">{title}</h1>
            {badge && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-[0.2em] opacity-60 mt-1">{description}</p>
        </div>
      </div>

      
      {/* Platform Metadata or Children */}
      <div className="flex items-center gap-4">
        {children ? (
          children
        ) : (
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
        )}
      </div>
    </motion.div>
  );
}
