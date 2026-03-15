import { motion } from "framer-motion";
import { useMemo } from "react";

interface Ball {
  number: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const BALL_COLORS = [
  "from-primary/30 to-primary/10 border-primary/20",
  "from-neon-blue/30 to-neon-blue/10 border-neon-blue/20",
  "from-accent/30 to-accent/10 border-accent/20",
  "from-neon-purple/30 to-neon-purple/10 border-neon-purple/20",
  "from-neon-cyan/30 to-neon-cyan/10 border-neon-cyan/20",
  "from-neon-red/25 to-neon-red/8 border-neon-red/15",
];

export function FloatingLotteryBalls() {
  const balls = useMemo<Ball[]>(() => {
    const items: Ball[] = [];
    for (let i = 0; i < 14; i++) {
      items.push({
        number: Math.floor(Math.random() * 60) + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 28 + Math.random() * 24,
        duration: 8 + Math.random() * 10,
        delay: Math.random() * -12,
        color: BALL_COLORS[i % BALL_COLORS.length],
      });
    }
    return items;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {balls.map((ball, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br border backdrop-blur-[2px] flex items-center justify-center font-mono font-bold text-foreground/20 select-none ${ball.color}`}
          style={{
            width: ball.size,
            height: ball.size,
            left: `${ball.x}%`,
            top: `${ball.y}%`,
            fontSize: ball.size * 0.35,
          }}
          animate={{
            y: [0, -30, 10, -20, 0],
            x: [0, 15, -10, 5, 0],
            rotate: [0, 8, -5, 3, 0],
            scale: [1, 1.05, 0.97, 1.02, 1],
          }}
          transition={{
            duration: ball.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: ball.delay,
          }}
        >
          {ball.number}
        </motion.div>
      ))}
    </div>
  );
}
