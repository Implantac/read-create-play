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
  "from-primary/15 to-primary/5 border-primary/10",
  "from-neon-blue/15 to-neon-blue/5 border-neon-blue/10",
  "from-accent/15 to-accent/5 border-accent/10",
  "from-neon-purple/15 to-neon-purple/5 border-neon-purple/10",
  "from-neon-cyan/15 to-neon-cyan/5 border-neon-cyan/10",
  "from-neon-red/12 to-neon-red/4 border-neon-red/8",
];

export function FloatingLotteryBalls() {
  const balls = useMemo<Ball[]>(() => {
    const items: Ball[] = [];
    for (let i = 0; i < 8; i++) {
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
          className={`absolute rounded-full bg-gradient-to-br border backdrop-blur-[1px] flex items-center justify-center font-mono font-bold text-foreground/10 select-none ${ball.color}`}
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
