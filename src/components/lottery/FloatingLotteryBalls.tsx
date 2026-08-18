import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

interface FloatingBallProps {
  count?: number;
}

export function FloatingLotteryBalls({ count = 15 }: FloatingBallProps) {
  const [balls, setBalls] = useState<any[]>([]);

  useEffect(() => {
    const newBalls = Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: Math.random() * 60 + 20,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 10,
      value: Math.floor(Math.random() * 60) + 1,
      color: Math.random() > 0.5 ? "text-primary/20" : "text-primary/10",
      blur: Math.random() * 4 + 1
    }));
    setBalls(newBalls);
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {balls.map((ball) => (
        <motion.div
          key={ball.id}
          initial={{ y: "110%", x: `${ball.left}%`, opacity: 0 }}
          animate={{ 
            y: "-10%",
            x: [`${ball.left}%`, `${ball.left + (Math.random() * 10 - 5)}%`, `${ball.left}%`],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: ball.duration,
            repeat: Infinity,
            delay: ball.delay,
            ease: "linear"
          }}
          style={{
            position: "absolute",
            width: ball.size,
            height: ball.size,
            filter: `blur(${ball.blur}px)`,
          }}
          className={`flex items-center justify-center rounded-full border border-primary/10 bg-primary/5 ${ball.color} font-mono font-black text-xs shadow-inner`}
        >
          {ball.value.toString().padStart(2, '0')}
        </motion.div>
      ))}
    </div>
  );
}
