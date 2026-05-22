import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Ban, Clock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut, isTrialExpired, isAdmin, isSuperAdmin, trialDaysLeft } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/landing" replace />;
  }

  if (profile?.blocked && !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Ban className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Conta Bloqueada</h1>
          <p className="text-muted-foreground">
            Sua conta foi suspensa pelo administrador. Entre em contato com o suporte para mais informações.
          </p>
          <button
            onClick={signOut}
            className="text-sm text-primary underline hover:text-primary/80"
          >
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  // Allow access to /planos and /perfil even if trial expired
  const allowedPaths = ["/planos", "/perfil", "/payment-success"];
  const isAllowedPath = allowedPaths.some(p => location.pathname.startsWith(p));

  if (isTrialExpired && !isAllowedPath) {
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
              onClick={signOut}
              className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
