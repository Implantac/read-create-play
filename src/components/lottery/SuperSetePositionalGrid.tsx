import React from "react";
import { motion } from "framer-motion";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuperSetePositionalGridProps {
  selectedNumbers: number[]; // Array de 7 números, um para cada coluna (0-9)
  onSelect: (columnIndex: number, number: number) => void;
  drawNumbers?: number[]; // Para mostrar o resultado do sorteio se disponível
  className?: string;
}

/**
 * Grid Posicional Específico para Super Sete.
 * Organiza em 7 colunas, cada uma com opções de 0 a 9.
 */
export function SuperSetePositionalGrid({
  selectedNumbers,
  onSelect,
  drawNumbers,
  className
}: SuperSetePositionalGridProps) {
  const columns = Array.from({ length: 7 }, (_, i) => i);
  const rows = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className={cn("rounded-2xl glass-card p-6 space-y-6", className)}>
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center shadow-lg">
          <Hash className="w-5 h-5 text-neon-amber" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wider italic">Grid Posicional Super Sete</h3>
          <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest opacity-60">Escolha 1 número por coluna</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-4 overflow-x-auto pb-2">
        {columns.map((colIndex) => (
          <div key={colIndex} className="space-y-2 min-w-[40px]">
            <div className="text-center text-[10px] font-black uppercase text-muted-foreground mb-2">
              Col {colIndex + 1}
            </div>
            <div className="flex flex-col gap-2">
              {rows.map((rowValue) => {
                const isSelected = selectedNumbers[colIndex] === rowValue;
                const isDrawResult = drawNumbers && drawNumbers[colIndex] === rowValue;
                
                return (
                  <motion.button
                    key={`${colIndex}-${rowValue}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(colIndex, rowValue)}
                    className={cn(
                      "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all border",
                      isSelected 
                        ? "bg-neon-amber text-background border-neon-amber shadow-lg shadow-neon-amber/20" 
                        : "bg-white/5 border-white/10 text-muted-foreground hover:border-neon-amber/50",
                      isDrawResult && !isSelected && "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                    )}
                  >
                    {rowValue}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/5">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
          Total Selecionado: {selectedNumbers.filter(n => n !== undefined).length}/7
        </div>
        <div className="flex gap-2">
          {selectedNumbers.map((n, i) => (
            <div key={i} className="w-6 h-6 rounded bg-neon-amber/20 border border-neon-amber/30 flex items-center justify-center text-[10px] font-mono font-bold text-neon-amber">
              {n !== undefined ? n : "-"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
