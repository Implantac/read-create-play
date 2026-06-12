import { cn } from "@/lib/utils";

// Inline SVG noise to avoid external 404s
const NOISE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`
  );

export const NoiseBackground = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none opacity-[0.03] z-[1]",
        className
      )}
      style={{ backgroundImage: `url("${NOISE_SVG}")` }}
      aria-hidden="true"
    />
  );
};
