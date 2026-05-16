import { motion } from "framer-motion";

const lotteries = [
  { name: "Mega-Sena", numbers: "6/60", color: "hsl(var(--neon-green))" },
  { name: "Lotofácil", numbers: "15/25", color: "hsl(var(--neon-purple))" },
  { name: "Quina", numbers: "5/80", color: "hsl(var(--neon-blue))" },
  { name: "Lotomania", numbers: "50/100", color: "hsl(var(--neon-amber))" },
  { name: "Dupla Sena", numbers: "6/50", color: "hsl(var(--neon-red))" },
  { name: "Timemania", numbers: "7/80", color: "hsl(var(--neon-cyan))" },
  { name: "Dia de Sorte", numbers: "7/31", color: "hsl(var(--neon-green))" },
  { name: "+Milionária", numbers: "6/50+2", color: "hsl(var(--neon-purple))" },
];

// Duplicate for seamless infinite scroll
const duplicated = [...lotteries, ...lotteries];

export function LotteryLogosCarousel() {
  return (
    <section className="py-12 border-b border-white/5 bg-[#050505]/40 backdrop-blur-3xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#ffffff05_1px,_transparent_0)] bg-[size:24px_24px] pointer-events-none" />
      <div className="container mx-auto px-4 mb-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
          Loterias Suportadas
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
                  {lottery.numbers}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
