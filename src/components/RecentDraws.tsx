import { useState } from "react";
import { DrawResultWithPrizes } from "@/hooks/useLotteryDraws";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, ChevronUp, Trophy, Users, DollarSign, TrendingUp } from "lucide-react";

interface Props {
  draws: DrawResultWithPrizes[];
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function RecentDraws({ draws }: Props) {
  const firstWithPrizes = draws.find(d => d.prizeTiers?.premiacoes?.length);
  const [expandedDraw, setExpandedDraw] = useState<number | null>(firstWithPrizes?.concurso ?? null);

  return (
    <div className="rounded-xl glass-card p-6 space-y-6 border border-white/5 relative overflow-hidden">
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center shrink-0">
          <History className="w-6 h-6 text-neon-purple drop-shadow-[0_0_8px_rgba(var(--neon-purple),0.4)]" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white tracking-tight uppercase leading-none">Historical Results</h3>
          <p className="text-[10px] text-muted-foreground mt-1 font-bold tracking-widest uppercase opacity-60">Verified Settlement Ledger</p>
        </div>
      </div>
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {draws.slice(0, 20).map((draw, i) => {
          const isExpanded = expandedDraw === draw.concurso;
          const hasPrizes = draw.prizeTiers?.premiacoes && draw.prizeTiers.premiacoes.length > 0;

          return (
            <motion.div
              key={draw.concurso}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/40 transition-all duration-500 overflow-hidden group"
            >
              <div
                className={`flex items-center gap-3 p-2.5 ${hasPrizes ? "cursor-pointer" : ""}`}
                onClick={() => hasPrizes && setExpandedDraw(isExpanded ? null : draw.concurso)}
              >
                <div className="text-xs font-mono text-muted-foreground w-20 shrink-0">
                  <div className="text-foreground font-semibold">#{draw.concurso}</div>
                  <div className="text-[10px]">{draw.date}</div>
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {draw.numbers.map(n => (
                    <span key={n} className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_2px_8px_rgba(0,0,0,0.4)] border border-white/10 bg-[#111] text-primary">
                      {String(n).padStart(2, "0")}
                    </span>
                  ))}
                </div>
                {hasPrizes && (
                  <div className="flex items-center gap-1 shrink-0">
                    {draw.prizeTiers?.acumulou && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-bold">
                        ACUMULOU
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>

              {/* Prize tiers expanded */}
              <AnimatePresence>
                {isExpanded && hasPrizes && draw.prizeTiers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border/30"
                  >
                    <div className="p-3 space-y-2">
                      {/* Summary row */}
                      {draw.prizeTiers.valorArrecadado > 0 && (
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Arrecadado: {formatCurrency(draw.prizeTiers.valorArrecadado)}
                          </span>
                          {draw.prizeTiers.acumulou && draw.prizeTiers.valorAcumulado > 0 && (
                            <span className="flex items-center gap-1 text-yellow-400">
                              <TrendingUp className="w-3 h-3" />
                              Acumulado: {formatCurrency(draw.prizeTiers.valorAcumulado)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Prize table */}
                      <div className="rounded-md border border-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-secondary/50">
                              <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Faixa</th>
                              <th className="text-center px-2 py-1.5 text-muted-foreground font-medium">
                                <Users className="w-3 h-3 inline mr-1" />
                                Ganhadores
                              </th>
                              <th className="text-right px-2 py-1.5 text-muted-foreground font-medium">
                                <Trophy className="w-3 h-3 inline mr-1" />
                                Prêmio
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {draw.prizeTiers.premiacoes.map((tier, ti) => (
                              <tr key={ti} className="border-t border-border/30">
                                <td className="px-2 py-1.5 text-foreground font-medium">
                                  {tier.descricao}
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  <span className={`font-bold ${
                                    tier.ganhadores > 0 ? "text-primary" : "text-muted-foreground"
                                  }`}>
                                    {tier.ganhadores.toLocaleString("pt-BR")}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5 text-right font-mono">
                                  <span className={`${
                                    tier.ganhadores > 0 ? "text-primary font-bold" : "text-muted-foreground"
                                  }`}>
                                    {formatCurrency(tier.valorPremio)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
