import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  children?: React.ReactNode;
}

/**
 * PageHeader v5 — refined hierarchy, less visual noise.
 * Goals: clearer scan, calmer typography, consistent spacing across pages.
 */
export function PageHeader({ title, description, icon: Icon, badge, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8 pb-6"
    >
      {/* Hairline gold divider */}
      <div className="absolute bottom-0 left-0 right-0 divider-gold" aria-hidden="true" />

      <div className="flex items-center gap-5 min-w-0">
        <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/25 flex items-center justify-center shrink-0 shadow-premium">
          <Icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
        </div>

        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
              {title}
            </h1>
            {badge && (
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/25">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </motion.div>
  );
}
