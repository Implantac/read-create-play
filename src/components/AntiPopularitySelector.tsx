import { useState } from "react";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ANTI_POPULARITY_PROFILES,
  AntiPopularityLevel,
  getAntiPopularityLevel,
  setAntiPopularityLevel,
} from "@/ai/knowledge/jackpotMasterStrategies";

interface AntiPopularitySelectorProps {
  compact?: boolean;
  onChange?: (level: AntiPopularityLevel) => void;
}

export function AntiPopularitySelector({ compact = false, onChange }: AntiPopularitySelectorProps) {
  const [level, setLevel] = useState<AntiPopularityLevel>(() => getAntiPopularityLevel());

  const handleChange = (lvl: AntiPopularityLevel) => {
    setAntiPopularityLevel(lvl);
    setLevel(lvl);
    onChange?.(lvl);
    toast.success(`Anti-popularidade: ${ANTI_POPULARITY_PROFILES[lvl].label}`, {
      description: ANTI_POPULARITY_PROFILES[lvl].description,
    });
  };

  const profile = ANTI_POPULARITY_PROFILES[level];

  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <div>
            <Label className="text-xs font-semibold">Nível de Anti-Popularidade</Label>
            {!compact && (
              <p className="text-[10px] text-muted-foreground">
                Penaliza datas (1–31) e múltiplos de 5 para reduzir rateio em caso de prêmio.
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className="text-[10px]">
          Datas ×{profile.datesMultiplier.toFixed(2)} · Mult5 ×
          {profile.multiplesOfFiveMultiplier.toFixed(2)}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(ANTI_POPULARITY_PROFILES) as AntiPopularityLevel[]).map((lvl) => {
          const p = ANTI_POPULARITY_PROFILES[lvl];
          const active = level === lvl;
          return (
            <Button
              key={lvl}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => handleChange(lvl)}
              className="h-auto py-2 flex flex-col items-start gap-0.5 text-left"
            >
              <span className="text-xs font-semibold">{p.label}</span>
              <span className="text-[10px] opacity-80 font-normal whitespace-normal leading-tight">
                {p.description}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
