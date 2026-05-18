import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium",
  professional: "Profissional",
  lifetime: "Vitalício",
};

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "";
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const syncSubscription = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.functions.invoke("check-subscription", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      } catch (e) {
        console.error("Error syncing subscription:", e);
      } finally {
        setSyncing(false);
      }
    };
    syncSubscription();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        <Card className="max-w-md w-full glass-card border-primary/30">
          <CardContent className="flex flex-col items-center text-center py-12 gap-6">
            {syncing ? (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <h1 className="text-2xl font-bold text-foreground">Ativando seu plano...</h1>
                <p className="text-muted-foreground">Aguarde enquanto confirmamos seu pagamento.</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Pagamento confirmado!</h1>
                  <p className="text-muted-foreground">
                    Seu plano <span className="font-bold text-primary">{PLAN_LABELS[plan] || plan}</span> está ativo.
                  </p>
                </div>
                <Link to="/">
                  <Button className="gap-2 gradient-brand text-primary-foreground">
                    Ir para o Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
