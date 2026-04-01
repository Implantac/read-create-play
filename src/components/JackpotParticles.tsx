import { motion } from "framer-motion";
import { useMemo } from "react";

const STAR_COLORS = [
  "hsl(48, 100%, 52%)",
  "hsl(40, 95%, 60%)",
  "hsl(36, 100%, 70%)",
  "hsl(45, 100%, 80%)",
];

export function JackpotParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: 3 + Math.random() * 5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 2 + Math.random() * 3,
      delay: Math.random() * 2,
      color: STAR_COLORS[i % STAR_COLORS.length],
      isStar: Math.random() > 0.4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.isStar ? "transparent" : p.color,
            borderRadius: p.isStar ? 0 : "50%",
            boxShadow: p.isStar ? undefined : `0 0 ${p.size * 2}px ${p.color}`,
          }}
          animate={{
            opacity: [0, 1, 0.6, 1, 0],
            scale: [0.5, 1.2, 0.8, 1.1, 0.5],
            y: [0, -8, 4, -6, 0],
            x: [0, 4, -3, 5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          {p.isStar && (
            <svg width={p.size} height={p.size} viewBox="0 0 10 10">
              <polygon
                points="5,0 6.1,3.5 10,3.5 7,5.8 8,9.5 5,7.2 2,9.5 3,5.8 0,3.5 3.9,3.5"
                fill={p.color}
                filter={`drop-shadow(0 0 ${p.size}px ${p.color})`}
              />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
}
