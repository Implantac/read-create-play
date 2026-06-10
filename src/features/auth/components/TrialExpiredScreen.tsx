import { Clock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface TrialExpiredScreenProps {
  onSignOut: () => void;
}

export function TrialExpiredScreen({ onSignOut }: TrialExpiredScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-lg">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
          <Clock className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter italic">
          Teste <span className="gradient-brand-text">Expirado</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed font-medium">
          Seus 7 dias gratuitos terminaram. Para continuar usando todas as funcionalidades do Titan Loterias, escolha um plano.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/planos">
            <Button size="lg" className="h-14 px-10 rounded-2xl gradient-brand text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Crown className="w-5 h-5 mr-2" />
              Ver Planos
            </Button>
          </Link>
          <button
            onClick={onSignOut}
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors font-bold uppercase tracking-widest"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
