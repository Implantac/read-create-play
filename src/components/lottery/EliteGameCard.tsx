import { m } from "framer-motion";
import { Copy, Check, Star, ShieldCheck, TrendingUp, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/formatters";

interface EliteGameCardProps {
  numbers: number[];
  score: number;
  grade: string;
  strategy?: string;
  index: number;
  onSave?: () => void;
}

export function EliteGameCard({ numbers, score, grade, strategy, index, onSave }: EliteGameCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(numbers.join(" - "));
    setCopied(true);
    toast.success("Jogo copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const getGradeColor = (g: string) => {
    switch (g) {
      case "S+": return "bg-amber-400/20 text-amber-400 border-amber-400/30";
      case "S": return "bg-amber-400/10 text-amber-400 border-amber-400/20";
      case "A": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
      case "B": return "bg-blue-400/10 text-blue-400 border-blue-400/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-card border border-border/40 rounded-2xl p-4 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Jogo #{index + 1}</span>
            {strategy && (
              <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-primary/5 font-bold">
                {strategy}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5">
            {numbers.map((num, i) => (
              <span
                key={i}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all duration-300",
                  "bg-secondary/40 border-border/40 text-foreground group-hover:border-primary/20 group-hover:bg-primary/5"
                )}
              >
                {num.toString().padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/20">
          <div className="text-center px-3 border-r border-border/20">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">Score</p>
            <p className="text-sm font-black text-primary font-mono">{formatNumber(score)}</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">Grade</p>
            <Badge className={cn("text-xs font-black", getGradeColor(grade))}>
              {grade}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </Button>
          {onSave && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Star className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Probability bar */}
      <div className="mt-4 pt-4 border-t border-border/10 flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tighter text-muted-foreground">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Tendência de Saída</span>
            <span>{Math.round(score / 10)}%</span>
          </div>
          <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, score / 10)}%` }}
              className="h-full bg-gradient-to-r from-primary/40 to-primary"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400/80">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Validado</span>
        </div>
      </div>
    </m.div>
  );
}
