import { m } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, History, Info, RefreshCw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface RecommendationCardProps {
  luckyGame: any;
  generating: boolean;
  onGenerate: (profile?: any) => void;
  onShowBriefing: () => void;
}

export function RecommendationCard({ luckyGame, generating, onGenerate, onShowBriefing }: RecommendationCardProps) {
  return (
    <section className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none" />
      
      <Card className="glass-card border-primary/20 bg-black/40 overflow-hidden relative rounded-[2rem] shadow-2xl">
        <CardContent className="p-8 md:p-12 relative z-10">
          {luckyGame ? (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex-1 space-y-10 w-full text-center lg:text-left">
                <div className="space-y-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60 italic">RECOMENDAÇÃO IA TITAN PREMIUM</p>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    {luckyGame.numbers.map((n: number, idx: number) => (
                      <m.div 
                        key={`${n}-${idx}`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.05, type: "spring" }}
                        whileHover={{ y: -8, scale: 1.1 }}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center font-black text-xl sm:text-2xl text-primary shadow-xl shadow-primary/5 transition-all cursor-default italic relative"
                      >
                        {String(n).padStart(2, '0')}
                        {idx < 2 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" title="Alta Tendência" />
                        )}
                      </m.div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Estratégia</span>
                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Bot className="w-4 h-4 text-primary" /> {luckyGame.strategy}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-border/40 hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Data do Sinal</span>
                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <History className="w-4 h-4 text-muted-foreground" /> {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[320px] p-6 rounded-[2.5rem] bg-background/40 border border-white/5 backdrop-blur-md shadow-2xl text-center space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-1">
                    <p className="text-[9px] uppercase font-black text-primary/60 tracking-widest">Titan Score</p>
                    <p className="text-2xl font-black italic tracking-tighter tabular-nums gradient-brand-text leading-none">{luckyGame.score}/100</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                    <p className="text-[9px] uppercase font-black text-emerald-400/60 tracking-widest">Tendência</p>
                    <p className="text-2xl font-black italic tracking-tighter text-emerald-400 leading-none">Alta</p>
                  </div>
                </div>

                <div className="space-y-3 relative z-10">
                  <Button onClick={onGenerate} variant="premium" className="w-full h-14" disabled={generating}>
                    {generating ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : null}
                    {generating ? "Calibrando..." : "Recalcular Predição"}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button asChild variant="outline" className="h-12 rounded-2xl font-bold uppercase tracking-widest text-[9px] border-white/10 hover:border-primary/40">
                      <Link to="/fechamentos">Ver Fechamentos</Link>
                    </Button>
                    <Button variant="ghost" onClick={onShowBriefing} className="h-12 rounded-2xl bg-white/5 border border-white/10 font-bold uppercase tracking-widest text-[9px] hover:bg-primary/10 hover:border-primary/40 flex items-center gap-2">
                      <Info className="w-3 h-3 text-primary" />
                      Ver Explicação
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-muted-foreground flex flex-col items-center gap-8">
              <div className="w-24 h-24 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-center animate-pulse shadow-inner">
                <Bot className="w-12 h-12 text-primary opacity-40" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight italic">Assistente em Standby</h2>
                <p className="text-sm opacity-60 max-w-xs mx-auto">Selecione o perfil de risco para que a IA gere sua melhor recomendação estatística.</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
                {[
                  { id: 'conservative', label: 'Conservador', icon: '🛡️', color: 'border-emerald-500/20 text-emerald-400' },
                  { id: 'balanced', label: 'Equilibrado', icon: '⚖️', color: 'border-primary/20 text-primary' },
                  { id: 'aggressive', label: 'Agressivo', icon: '🔥', color: 'border-orange-500/20 text-orange-400' },
                  { id: 'ia_premium', label: 'Titan IA Premium', icon: '💎', color: 'border-purple-500/30 text-purple-400 bg-purple-500/5' },
                ].map((p) => (
                  <Button 
                    key={p.id}
                    onClick={() => onGenerate(p.id)} 
                    disabled={generating} 
                    variant="outline" 
                    className={`h-16 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-3 backdrop-blur-sm transition-all hover:scale-[1.02] ${p.color}`}
                  >
                    <span className="text-lg">{p.icon}</span>
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
