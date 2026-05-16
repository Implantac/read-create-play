import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  headerAction?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, badge, headerAction }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "circOut" }}
      className="relative flex flex-col md:flex-row md:items-center gap-6 mb-12 py-6 border-b border-white/[0.05]"
    >
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-40 h-40 bg-primary/5 blur-[100px] pointer-events-none rounded-full" />
      
      <div className="relative group shrink-0">
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
        <div className="relative w-20 h-20 rounded-2xl bg-[#0a0a0a] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden group-hover:border-primary/40 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
          <Icon className="w-10 h-10 text-primary relative z-10 drop-shadow-[0_0_12px_rgba(var(--primary),0.5)] transition-transform group-hover:scale-110" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-[-0.05em] uppercase leading-none">{title}</h1>
          {badge && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/[0.03] text-primary border border-white/10 shadow-sm backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                {badge}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm sm:text-base text-muted-foreground/80 font-bold mt-2 tracking-tight max-w-3xl border-l-2 border-primary/20 pl-4 uppercase">
          {description}
        </p>
      </div>
      {headerAction && (
        <div className="relative z-10 shrink-0">
          {headerAction}
        </div>
      )}
    </motion.div>
  );
}
