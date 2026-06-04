import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { formatNumber } from "@/utils/formatters";

interface AnimatedCounterProps {
  value: string;
  label: string;
  index: number;
}

function parseNumericValue(value: string): { prefix: string; number: number; suffix: string; decimals: number } {
  const match = value.match(/^([^\d]*)([\d,.]+)([^\d]*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value, decimals: 0 };
  
  const prefix = match[1];
  const numStr = match[2].replace(",", ".");
  const number = parseFloat(numStr);
  const suffix = match[3];
  const decimalPart = numStr.split(".")[1];
  const decimals = decimalPart ? decimalPart.length : 0;
  
  return { prefix, number, suffix, decimals };
}

export function AnimatedCounter({ value, label, index }: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState("0");
  const { prefix, number, suffix, decimals } = parseNumericValue(value);

  useEffect(() => {
    if (!isInView) return;
    
    const duration = 2000;
    const steps = 60;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // easeOutExpo
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = number * eased;
      
      if (decimals > 0) {
        setDisplay(current.toFixed(decimals));
      } else {
        setDisplay(formatNumber(Math.round(current)));
      }

      if (step >= steps) {
        clearInterval(timer);
        // Set final value with original formatting
        if (decimals > 0) {
          setDisplay(number.toFixed(decimals));
        } else {
          setDisplay(number.toLocaleString("pt-BR"));
        }
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, number, decimals]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
      className="text-center"
    >
      <div className="text-2xl md:text-3xl font-bold font-mono gradient-brand-text">
        {prefix}{display}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}
