import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TitanScoreBadgeProps {
  score: number;
  label?: string;
}

export function TitanScoreBadge({ score, label = "Titan Score" }: TitanScoreBadgeProps) {
  const getScoreColor = () => {
    if (score >= 90) return "text-primary border-primary bg-primary/10";
    if (score >= 75) return "text-neon-blue border-neon-blue bg-neon-blue/10";
    if (score >= 50) return "text-accent border-accent bg-accent/10";
    return "text-neon-red border-neon-red bg-neon-red/10";
  };

  const getIcon = () => {
    if (score >= 85) return <ShieldCheck className="w-3.5 h-3.5" />;
    if (score >= 60) return <TrendingUp className="w-3.5 h-3.5" />;
    return <AlertTriangle className="w-3.5 h-3.5" />;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`gap-1.5 px-2 py-1 font-mono font-bold tracking-tight ${getScoreColor()}`}>
        {getIcon()}
        {label}: {score.toFixed(1)}%
      </Badge>
    </div>
  );
}
