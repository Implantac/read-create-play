import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Shield, TrendingUp, ChevronDown, ChevronUp, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { AIAnalystBriefing } from "./AIAnalystBriefing";
import { DrawTestDialog } from "./DrawTestDialog";

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
      className="space-y-2 group"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:shadow-premium-hover transition-all duration-300 space-y-3 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {rank && (
              <span className="text-xs font-mono text-muted-foreground/60 tabular-nums">
                #{String(rank).padStart(2, '0')}
              </span>
            )}
            <div
              className={`px-2 py-0.5 rounded text-[11px] font-bold border shadow-sm ${
                GRADE_COLORS[grade] || "bg-muted text-muted-foreground border-border"
              }`}
            >
              {grade}
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {strategyLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="opacity-40 group-hover:opacity-80 transition-opacity">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <span
              className={`text-lg font-bold tabular-nums font-mono ${
                score >= 80 ? 'text-primary' : score >= 50 ? 'text-accent' : 'text-orange-400'
              }`}
            >
              {score}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Score
            </span>
          </div>
        </div>

        <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="h-full bg-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {numbers.map((n) => {
            const isHot = hotNumbers.includes(n);
            const isCold = coldNumbers.includes(n);
            return (
              <motion.span
                key={n}
                whileHover={{ scale: 1.1 }}
                className={`lottery-ball text-xs w-9 h-9 font-semibold transition-all ${
                  isHot ? "lottery-ball-hot" : isCold ? "lottery-ball-cold" : ""
                }`}
              >
                {String(n).padStart(2, "0")}
              </motion.span>
            );
          })}
        </div>

        {insights.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-border/40">
            {insights.map((insight, j) => (
              <p key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <TrendingUp className="w-3 h-3 mt-0.5 text-primary/70 shrink-0" />
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

      <div className="flex items-center gap-2 pt-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          Copiar
        </Button>
        <DrawTestDialog
          numbers={numbers}
          trigger={
            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
              <Target className="w-3.5 h-3.5" />
              Testar
            </Button>
          }
        />
        {onSave && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onSave(); }}
          >
            <Shield className="w-3.5 h-3.5" />
            Salvar
          </Button>
        )}
      </div>
    </motion.div>
  );
}
