import { motion } from "framer-motion";

interface Props {
  value: number;
  label: string;
  sublabel: string;
  color?: string;
}

export function NeuralHealthGauge({ value, label, sublabel, color = "var(--primary)" }: Props) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/10 border border-border/40 relative overflow-hidden group">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/10"
          />
          {/* Progress circle */}
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 2, ease: "easeOut" }}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
            style={{ stroke: color }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black font-mono tracking-tighter italic">
            {Math.round(value)}%
          </span>
          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">{sublabel}</p>
      </div>
      
      {/* Decorative pulse */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 bg-primary/5 pointer-events-none"
      />
    </div>
  );
}
