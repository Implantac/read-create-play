// Shared chart theming for Recharts — keeps all charts visually consistent
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "hsl(225, 22%, 9%)",
  border: "1px solid hsl(225, 16%, 18%)",
  borderRadius: "10px",
  fontSize: "12px",
  color: "hsl(210, 20%, 92%)",
  boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)",
  padding: "8px 12px",
} as const;

export const CHART_AXIS_TICK = {
  fontSize: 9,
  fill: "hsl(215, 12%, 48%)",
  fontFamily: "'JetBrains Mono', monospace",
} as const;

export const CHART_COLORS = {
  green: "hsl(145, 72%, 42%)",
  blue: "hsl(195, 95%, 48%)",
  amber: "hsl(48, 100%, 52%)",
  red: "hsl(0, 72%, 55%)",
  purple: "hsl(265, 75%, 58%)",
  cyan: "hsl(180, 85%, 48%)",
} as const;
