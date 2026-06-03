import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Save, Check } from "lucide-react";
import { motion } from "framer-motion";
import { GameQuality } from "@/engine/strategy-evolution/game-quality";
import { GRADE_STYLES, NumberBall } from "./LabShared";

export function SmartPickCard({ gq, rank, maxNum, onCopy, onSave, isSaved }: {
  gq: GameQuality; rank: number; maxNum: number;
  onCopy: () => void; onSave: () => void; isSaved: boolean;
}) {
  const medals = ["🥇", "🥈", "🥉"];
  const ringColors = [
    "ring-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30",
    "ring-yellow-500/30 bg-gradient-to-br from-yellow-500/8 via-transparent to-transparent border-yellow-500/20",
    "ring-orange-500/25 bg-gradient-to-br from-orange-500/6 via-transparent to-transparent border-orange-400/15",
  ];
  const evens = gq.game.filter(n => n % 2 === 0).length;
  const odds = gq.game.length - evens;
  const sum = gq.game.reduce((s, n) => s + n, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1, duration: 0.4 }}
    >
      <Card className={`relative overflow-hidden ring-1 ${ringColors[rank]} transition-shadow hover:shadow-lg`}>
        {rank === 0 && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />}
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{medals[rank]}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {rank === 0 ? "Melhor jogo" : `#${rank + 1} Smart Pick`}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{gq.strategyName}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`text-xs font-mono font-black ${GRADE_STYLES[gq.grade]}`}>
                {gq.grade}
              </Badge>
              <p className="text-lg font-mono font-black text-primary mt-0.5">{gq.overallScore.toFixed(1)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center py-1">
            {gq.game.map(num => <NumberBall key={num} num={num} maxNum={maxNum} />)}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-1.5 rounded-lg bg-muted/10 border border-border/50">
              <div className="text-[10px] text-muted-foreground">Par/Ímpar</div>
              <div className="text-xs font-mono font-bold text-foreground">{evens}/{odds}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/10 border border-border/50">
              <div className="text-[10px] text-muted-foreground">Soma</div>
              <div className="text-xs font-mono font-bold text-foreground">{sum}</div>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/10 border border-border/50">
              <div className="text-[10px] text-muted-foreground">Faixas</div>
              <div className="text-xs font-mono font-bold text-foreground">{gq.rangeBalance.toFixed(0)}%</div>
            </div>
          </div>

          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5 h-8 rounded-lg" onClick={onCopy}>
              <Copy className="w-3 h-3" /> Copiar
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs gap-1.5 h-8 rounded-lg"
              disabled={isSaved}
              onClick={onSave}
            >
              {isSaved ? <><Check className="w-3 h-3" /> Salvo</> : <><Save className="w-3 h-3" /> Salvar</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
