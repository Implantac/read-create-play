import { motion } from "framer-motion";

const industries = [
  { name: "Adobe Illustrator", type: "Design", color: "hsl(var(--neon-red))" },
  { name: "Audaces", type: "CAD/CAM", color: "hsl(var(--neon-blue))" },
  { name: "Lectra", type: "PLM System", color: "hsl(var(--neon-green))" },
  { name: "Gerber", type: "Cutting", color: "hsl(var(--neon-amber))" },
  { name: "CLO3D", type: "3D Design", color: "hsl(var(--neon-purple))" },
  { name: "Optitex", type: "Simulation", color: "hsl(var(--neon-cyan))" },
  { name: "Corel Draw", type: "Graphics", color: "hsl(var(--neon-green))" },
  { name: "Browzwear", type: "Prototype", color: "hsl(var(--neon-purple))" },
];

// Duplicate for seamless infinite scroll
const duplicated = [...industries, ...industries];

export function LotteryLogosCarousel() {
  return (
    <section className="py-8 border-b border-border/20 bg-card/20 backdrop-blur-sm overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <p className="text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-black opacity-50">
          Integrações Nativas & Ecossistema de Moda
        </p>
      </div>

      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            x: { repeat: Infinity, repeatType: "loop", duration: 25, ease: "linear" },
          }}
        >
          {duplicated.map((lottery, i) => (
            <div
              key={`${lottery.name}-${i}`}
              className="flex-shrink-0 flex items-center gap-3 rounded-xl border border-border/20 bg-card/40 backdrop-blur-sm px-5 py-3 hover:border-primary/30 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
                style={{
                  background: `${lottery.color}20`,
                  color: lottery.color,
                  border: `1px solid ${lottery.color}30`,
                }}
              >
                {lottery.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {lottery.name}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {lottery.type}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
