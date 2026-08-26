import { LOTTERIES } from "@/data/lotteries";
import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export function LotterySelector({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const active = LOTTERIES.find((l) => l.id === selected) ?? LOTTERIES[0];

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      {/* Trigger: sempre visível, mostra a loteria ativa e abre a lista completa */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Selecionar loteria"
            className="h-9 gap-2 px-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shrink-0"
          >
            <span className="text-base leading-none">{active.icon}</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] max-w-[120px] truncate">
              {active.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[min(92vw,26rem)] p-2 glass-card"
        >
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            {LOTTERIES.length} loterias disponíveis
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[60vh] overflow-y-auto">
            {LOTTERIES.map((lottery) => {
              const isActive = lottery.id === selected;
              return (
                <button
                  key={lottery.id}
                  onClick={() => handleSelect(lottery.id)}
                  aria-current={isActive}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors ${
                    isActive
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary/20 border-border/30 text-foreground/80 hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <span className="text-base shrink-0">{lottery.icon}</span>
                  <span className="text-[11px] font-semibold truncate flex-1">
                    {lottery.name}
                  </span>
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Atalhos horizontais em telas largas */}
      <div className="hidden xl:flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0">
        {LOTTERIES.map((lottery) => {
          const isActive = selected === lottery.id;
          return (
            <motion.button
              key={lottery.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelect(lottery.id)}
              title={lottery.name}
              className={`px-1.5 py-1 rounded-md border text-base leading-none shrink-0 transition-colors ${
                isActive
                  ? "bg-primary/20 border-primary/40"
                  : "bg-secondary/10 border-border/20 hover:bg-secondary/30"
              }`}
            >
              {lottery.icon}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
