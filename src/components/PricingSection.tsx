import { Crown, CheckCircle2, Loader2, ShieldCheck, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function PricingSection() {
  const { session } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const LAUNCH_PRICE = "R$ 297";
  const ORIGINAL_PRICE = "R$ 997";

  const handleCheckout = async () => {
    if (!session) {
      navigate("/login");
      return;
    }

    setLoadingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId: "lifetime" },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error("Erro ao iniciar checkout: " + (e.message || "Tente novamente"));
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <section id="pricing" className="py-24 md:py-40 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
            Investimento <span className="gradient-brand-text">Único</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium text-lg opacity-70">
            Acesso vitalício sem mensalidades. Garanta sua vaga no protocolo de elite hoje mesmo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative rounded-[2.5rem] border-4 border-neon-amber/40 p-1 overflow-hidden shadow-2xl shadow-neon-amber/20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15),transparent)] pointer-events-none" />
          
          <div className="relative bg-card/60 backdrop-blur-2xl rounded-[2.2rem] p-8 md:p-14">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-neon-amber/20 flex items-center justify-center border border-neon-amber/30">
                      <Gem className="w-5 h-5 text-neon-amber" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon-amber opacity-80">Titan Professional Network</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">Titan <span className="text-neon-amber">Full Node</span></h3>
                  <p className="text-muted-foreground text-sm mt-3 font-medium leading-relaxed opacity-70">
                    Acesso completo e perpétuo a todas as ferramentas de inteligência artificial, geradores e simuladores da plataforma.
                  </p>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Acesso vitalício",
                    "8 Loterias integradas",
                    "IA e Machine Learning",
                    "Geradores Pro",
                    "Simulações massivas",
                    "Atualizações inclusas",
                    "Suporte VIP",
                    "Sem mensalidade",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/[0.03] border-2 border-white/10 rounded-[2rem] p-10 flex flex-col items-center text-center relative overflow-hidden group/price">
                <div className="absolute inset-0 bg-gradient-to-b from-neon-amber/5 via-transparent to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50 mb-4 relative z-10">Unique Activation</p>
                
                <div className="flex items-center gap-3 mb-2 relative z-10">
                  <span className="text-muted-foreground line-through text-xl font-mono font-bold opacity-40">{ORIGINAL_PRICE}</span>
                  <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/30">-70% OFF</span>
                </div>
                
                <div className="flex items-baseline gap-1 mb-8 relative z-10">
                  <span className="text-6xl font-black font-mono tracking-tighter italic text-foreground">{LAUNCH_PRICE}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40 ml-1">Pagamento Único</span>
                </div>

                <Button 
                  size="lg" 
                  onClick={handleCheckout} 
                  disabled={loadingPlan}
                  className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest gradient-brand text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all relative z-10"
                >
                  {loadingPlan ? <Loader2 className="w-6 h-6 animate-spin" /> : "Garantir Vaga Vitalícia"}
                </Button>

                <div className="mt-6 flex items-center justify-center gap-6 opacity-40">
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-5 h-5 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Compra Segura</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Star className="w-5 h-5 mb-1 text-neon-amber fill-neon-amber" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">7 Dias Garantia</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
