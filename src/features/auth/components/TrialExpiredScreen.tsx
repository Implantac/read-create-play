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
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Seu período de teste expirou
        </h1>
        <p className="text-muted-foreground text-lg">
          Seus 7 dias gratuitos terminaram. Para continuar usando todas as funcionalidades do Titan Loterias, escolha um plano.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link to="/planos">
            <Button size="lg" className="gradient-brand text-primary-foreground font-semibold gap-2 shadow-lg shadow-primary/20">
              <Crown className="w-5 h-5" />
              Ver Planos
            </Button>
          </Link>
          <button
            onClick={onSignOut}
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
}
