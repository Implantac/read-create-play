import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { burstConfetti } from "@/lib/confetti";
import { useABTest, floatingCtaVariants } from "@/hooks/useABTest";

export function FloatingCTA() {
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(false);
  const navigate = useNavigate();
  const variant = useABTest();
  const ctaText = floatingCtaVariants[variant];

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Pulse every 8 seconds to draw attention
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, [visible]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      burstConfetti(e);
      setTimeout(() => navigate("/signup"), 500);
    },
    [navigate]
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
        >
          {/* Urgency micro-tag */}
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="px-2.5 py-1 rounded-full bg-accent/15 border border-accent/25 text-accent text-[10px] font-semibold backdrop-blur-sm"
          >
            🔥 Oferta por tempo limitado
          </motion.span>
          <motion.div
            animate={
              pulse
                ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 20px 8px hsl(var(--primary) / 0.3)", "0 0 0 0 hsl(var(--primary) / 0)"] }
                : {}
            }
            transition={{ duration: 0.8 }}
            className="rounded-xl"
          >
            <Button
              size="lg"
              onClick={handleClick}
              className="gradient-brand text-primary-foreground shadow-2xl shadow-primary/30 gap-2 px-6 h-12 text-sm font-bold rounded-xl"
            >
              <Sparkles className="w-4 h-4" />
              {ctaText}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
