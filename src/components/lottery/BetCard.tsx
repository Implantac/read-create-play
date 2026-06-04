import { motion } from "framer-motion";
import { Copy, Check, Shield, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useState } from "react";

interface BetCardProps {
  numbers: number[];
  score: number;
  grade: string;
  strategyLabel: string;
  insights?: string[];
  rank?: number;
  onSave?: () => void;
  onCopy?: () => void;
  hotNumbers?: number[];
  coldNumbers?: number[];
}

const GRADE_COLORS: Record<string, string> = {
  S: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
  A: "bg-emerald-500/90 text-white",
  B: "bg-blue-500/90 text-white",
  C: "bg-yellow-500/90 text-white",
  D: "bg-orange-500/90 text-white",
  F: "bg-red-500/90 text-white",
};

export function BetCard({
  numbers,
  score,
  grade,
  strategyLabel,
  insights = [],
  rank,
  onSave,
  onCopy,
  hotNumbers = [],
  coldNumbers = [],
}: BetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      navigator.clipboard.writeText(numbers.join(" - "));
      toast.success("Aposta copiada!");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl glass-card border border-border/40 hover:border-primary/40 transition-all duration-500 space-y-4 group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          {rank && <span className="text-[10px] font-black font-mono text-muted-foreground opacity-40">#{String(rank).padStart(2, '0')}</span>}
          <div className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black italic border-2 shadow-sm ${GRADE_COLORS[grade] || "bg-muted text-muted-foreground"}`}>
            {grade}
          </div>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{strategyLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xl font-black italic tracking-tighter tabular-nums ${score >= 80 ? 'text-primary' : score >= 50 ? 'text-yellow-500' : 'text-orange-500'}`}>
            {score}
          </span>
          <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest">Score</span>
        </div>
      </div>


      <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/40 relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "circOut" }}
          className="h-full bg-primary/60 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
        />
      </div>


      <div className="flex flex-wrap gap-2 relative z-10">
        {numbers.map((n) => {
          const isHot = hotNumbers.includes(n);
          const isCold = coldNumbers.includes(n);
          return (
            <span
              key={n}
              className={`lottery-ball text-xs w-9 h-9 font-black italic shadow-lg transition-all group-hover:scale-110 ${
                isHot ? "lottery-ball-hot" : isCold ? "lottery-ball-cold" : ""
              }`}
            >
              {String(n).padStart(2, "0")}
            </span>
          );
        })}
      </div>


      {insights.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-border/30">
          {insights.map((insight, j) => (
            <p key={j} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
              <TrendingUp className="w-3 h-3 mt-0.5 text-primary/60" />
              {insight}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-[10px] gap-1.5 px-2">
          {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          Copiar
        </Button>
        {onSave && (
          <Button variant="ghost" size="sm" onClick={onSave} className="h-7 text-[10px] gap-1.5 px-2">
            <Shield className="w-3 h-3" />
            Salvar
          </Button>
        )}
      </div>
    </motion.div>
  );
}
