import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardWidgetProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  delay?: number;
  noPadding?: boolean;
}

export function DashboardWidget({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  headerAction,
  delay = 0,
  noPadding = false,
}: DashboardWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "glass-card rounded-2xl border border-border/50 flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
        className
      )}
    >
      {(title || Icon) && (
        <div className="px-6 py-4 flex items-center justify-between border-b border-border/10">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>}
            </div>
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}
      <div className={cn("flex-1", !noPadding && "p-6")}>
        {children}
      </div>
    </motion.div>
  );
}
