import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for tailwind class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Enterprise Design Tokens
 */
export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: "hsl(var(--primary))",
      secondary: "hsl(var(--secondary))",
      accent: "hsl(var(--accent))",
      emerald: "#10b981",
      amber: "#f59e0b",
      rose: "#f43f5e",
      indigo: "#6366f1",
    },
    background: {
      glass: "rgba(255, 255, 255, 0.03)",
      glassDark: "rgba(0, 0, 0, 0.4)",
    }
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    h1: "text-4xl font-extrabold tracking-tight",
    h2: "text-3xl font-bold tracking-tight",
    h3: "text-2xl font-semibold tracking-tight",
    label: "text-xs font-bold uppercase tracking-wider text-muted-foreground",
  },
  effects: {
    glass: "backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
    glassHover: "hover:bg-white/10 hover:border-white/20 transition-all duration-300",
    premiumGradient: "bg-gradient-to-br from-primary/20 via-primary/5 to-transparent",
  }
};
