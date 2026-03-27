import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Loader2, Ban } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut } = useAuth();

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

  if (profile?.blocked) {
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

  return <>{children}</>;
}
