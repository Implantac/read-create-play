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
      className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pb-10 border-b border-border/40 relative z-20 group/header"
    >
      <div className="absolute -bottom-px left-0 w-80 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      <div className="absolute -bottom-px left-0 w-full h-px bg-border/20" />
      
      <div className="flex items-center gap-8">
        <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center shrink-0 shadow-premium shadow-primary/10 group-hover/header:rotate-12 transition-all duration-700 relative overflow-hidden active:scale-95">
          <div className="absolute inset-0 bg-primary/5 group-hover/header:bg-primary/20 transition-colors" />
          <Icon className="w-10 h-10 text-primary group-hover/header:scale-110 transition-transform duration-500 relative z-10" />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase italic leading-none">{title}</h1>
            {badge && (
              <span className="text-[10px] font-black uppercase tracking-[0.3em] px-5 py-2 rounded-2xl bg-accent/10 text-accent border border-accent/20 shadow-premium shadow-accent/10 italic animate-pulse">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic">Engineering Hub v6.0</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 group-hover/header:opacity-100 transition-opacity italic">{description}</p>
          </div>
        </div>
      </div>


      
      {/* Platform Metadata or Children */}
      <div className="flex items-center gap-5">
        {children ? (
          children
        ) : (
          <div className="hidden md:flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            <div className="flex flex-col items-end gap-1">
              <span className="opacity-60">Engine Precision</span>
              <span className="text-primary font-mono text-xs italic">99.8% Alpha</span>
            </div>
            <div className="w-px h-10 bg-border/40" />
            <div className="flex flex-col items-end gap-1">
              <span className="opacity-60">Neural Uptime</span>
              <span className="text-accent font-mono text-xs italic">99.9% Core</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
