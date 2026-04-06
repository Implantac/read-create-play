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
      className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">{title}</h1>
          {badge && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </motion.div>
  );
}
