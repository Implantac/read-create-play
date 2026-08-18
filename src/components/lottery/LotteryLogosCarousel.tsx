import { motion } from "framer-motion";

const industries = [
  { name: "Mega-Sena", type: "Loteria", color: "hsl(var(--neon-green))" },
  { name: "Lotofácil", type: "Loteria", color: "hsl(var(--neon-blue))" },
  { name: "Quina", type: "Loteria", color: "hsl(var(--neon-amber))" },
  { name: "Lotomania", type: "Loteria", color: "hsl(var(--neon-purple))" },
  { name: "Dupla Sena", type: "Loteria", color: "hsl(var(--neon-red))" },
  { name: "Dia de Sorte", type: "Loteria", color: "hsl(var(--neon-cyan))" },
  { name: "Super Sete", type: "Loteria", color: "hsl(var(--neon-green))" },
  { name: "+Milionária", type: "Loteria", color: "hsl(var(--neon-purple))" },
];

// Duplicate for seamless infinite scroll
const duplicated = [...industries, ...industries];

export function LotteryLogosCarousel() {
  return (
    <section className="py-8 bg-transparent overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <p className="text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-black opacity-50">
          Sincronização com Resultados Oficiais
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
