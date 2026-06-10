import { Ban } from "lucide-react";

interface AccountBlockedScreenProps {
  onSignOut: () => void;
}

export function AccountBlockedScreen({ onSignOut }: AccountBlockedScreenProps) {
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
          onClick={onSignOut}
          className="text-sm text-primary underline hover:text-primary/80"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
