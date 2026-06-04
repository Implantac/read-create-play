import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Shield, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { AIAnalystBriefing } from "./AIAnalystBriefing";

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
  reasons?: string[];
}

const GRADE_COLORS: Record<string, string> = {
  S: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-500/40 shadow-yellow-500/20",
  A: "bg-emerald-500/90 text-white border-emerald-500/40 shadow-emerald-500/20",
  B: "bg-blue-500/90 text-white border-blue-500/40 shadow-blue-500/20",
  C: "bg-yellow-500/90 text-white border-yellow-500/40 shadow-yellow-500/20",
  D: "bg-orange-500/90 text-white border-orange-500/40 shadow-orange-500/20",
  F: "bg-red-500/90 text-white border-red-500/40 shadow-red-500/20",
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
  reasons = [],
}: BetCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

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
      className="rounded-2xl space-y-2 group"
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-5 rounded-2xl glass-card border border-border/40 hover:border-primary/40 transition-all duration-500 space-y-4 relative overflow-hidden cursor-pointer"
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
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="mr-2 opacity-20 group-hover:opacity-60 transition-opacity">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <span className={`text-xl font-black italic tracking-tighter tabular-nums ${score >= 80 ? 'text-primary' : score >= 50 ? 'text-yellow-500' : 'text-orange-500'}`}>
              {score}
            </span>
            <span className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest">Titan Score</span>
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
          <div className="space-y-1.5 pt-3 border-t border-border/30 relative z-10">
            {insights.map((insight, j) => (
              <p key={j} className="text-[10px] text-muted-foreground flex items-start gap-2 font-medium">
                <TrendingUp className="w-3 h-3 mt-0.5 text-primary opacity-60" />
                {insight}
              </p>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <AIAnalystBriefing 
              confidence={score} 
              reasons={reasons.length > 0 ? reasons : insights} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 pt-2 relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="h-9 px-4 rounded-xl border border-border/40 bg-secondary/20 hover:bg-primary/10 hover:text-primary text-[10px] font-black uppercase tracking-widest transition-all">
          {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-primary" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
          Copiar Aposta
        </Button>
        {onSave && (
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onSave(); }} className="h-9 px-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest transition-all">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Salvar Aposta
          </Button>
        )}
      </div>
    </motion.div>
  );
}
