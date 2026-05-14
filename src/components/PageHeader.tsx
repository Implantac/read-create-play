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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative flex items-center gap-4 sm:gap-6 mb-8 py-2"
    >
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-24 h-24 bg-primary/10 blur-[60px] pointer-events-none rounded-full" />
      
      <div className="relative group">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl group-hover:bg-primary/30 transition-all duration-500" />
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-2xl shadow-primary/20 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground relative z-10" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tighter uppercase">{title}</h1>
          {badge && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/20 shadow-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {badge}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm sm:text-base text-muted-foreground font-medium mt-1 tracking-tight max-w-2xl">{description}</p>
      </div>
    </motion.div>
  );
}
