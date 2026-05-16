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
        "rounded-2xl flex flex-col h-full overflow-hidden transition-all duration-500",
        "bg-white/[0.03] border border-white/5 backdrop-blur-xl",
        "hover:border-primary/40 hover:bg-white/[0.05] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
        className
      )}
    >
      {(title || Icon) && (
        <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div>
              {title && <h3 className="text-base font-black text-white tracking-tight uppercase">{title}</h3>}
              {subtitle && <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">{subtitle}</p>}
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
