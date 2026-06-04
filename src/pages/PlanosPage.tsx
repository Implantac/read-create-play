import { Crown, Zap, Sparkles, Infinity, Settings, Loader2, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PlanFAQ } from "@/components/plans/PlanFAQ";
import { PlanTrustBar } from "@/components/plans/PlanTrustBar";
import { usePlanAccess } from "@/hooks/usePlanAccess";

export default function PlanosPage() {
  const { session } = useAuth();
  const { currentPlan, isAdmin, isSuperAdmin } = usePlanAccess();
  const [loadingPlan, setLoadingPlan] = useState(false);
  const navigate = useNavigate();

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

  const isLifetime = currentPlan === "lifetime" || isAdmin || isSuperAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pb-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-8 pb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-amber/10 border border-neon-amber/20 text-neon-amber text-xs font-bold uppercase tracking-widest mb-5">
          <Star className="w-3.5 h-3.5 fill-current" />
          Promoção de Lançamento
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          Acesso Vitalício <span className="gradient-brand-text">Sem Mensalidades</span>
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          Trave seu acesso permanente a toda a inteligência do Titan hoje mesmo por um valor único.
        </p>
      </motion.div>

      {/* Main Promo Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`relative rounded-3xl border p-1 overflow-hidden shadow-2xl ${
          isLifetime ? "border-primary/50" : "border-neon-amber/30"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-neon-amber/10 via-transparent to-transparent opacity-50" />
        
        <div className="relative bg-black/40 backdrop-blur-xl rounded-[22px] p-6 md:p-10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div>
                <Badge className="bg-neon-amber text-black font-bold mb-4 uppercase tracking-widest text-[10px]">
                  Oferta Limitada
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">Titan Loterias <span className="text-neon-amber">Full</span></h2>
                <p className="text-muted-foreground text-sm mt-2">
                  A ferramenta definitiva para quem leva as loterias a sério. Use matemática a seu favor.
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  "Acesso vitalício sem renovação",
                  "Todas as 8 Loterias integradas",
                  "Inteligência Artificial e ML",
                  "Geradores e Otimizadores Pro",
                  "Backtests e Simulações massivas",
                  "Atualizações futuras inclusas",
                  "Suporte VIP prioritário",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center">
              <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mb-1">Pagamento Único</p>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-muted-foreground line-through text-lg">{ORIGINAL_PRICE}</span>
                <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded">-70%</span>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black tracking-tighter">{LAUNCH_PRICE}</span>
                <span className="text-muted-foreground font-medium">à vista</span>
              </div>

              {isLifetime ? (
                <div className="w-full space-y-4">
                  <div className="w-full py-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center gap-2 text-primary font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    ACesso Vitalício Ativo
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    Agradecemos pela confiança!
                  </p>
                </div>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleCheckout} 
                  disabled={loadingPlan}
                  className="w-full h-14 text-lg font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                  {loadingPlan ? <Loader2 className="w-5 h-5 animate-spin" /> : "Garantir Vaga Agora"}
                </Button>
              )}
              
              {!isLifetime && (
                <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest">
                  Cartão, Pix ou Boleto • 7 Dias de Garantia
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <PlanTrustBar />
      <PlanFAQ />
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}
