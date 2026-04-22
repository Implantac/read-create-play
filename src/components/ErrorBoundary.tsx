import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
  retryCount: number;
  cooldownRemaining: number;
}

const MAX_RETRIES = 5;

const STORAGE_KEYS = {
  RETRY_COUNT: 'error_retry_count',
  COOLDOWN_ENDS_AT: 'error_cooldown_ends_at'
};

export class ErrorBoundary extends Component<Props, State> {
  private timer: number | null = null;

  constructor(props: Props) {
    super(props);
    
    let initialRetryCount = 0;
    let initialCooldownRemaining = 0;

    try {
      const storedRetryCount = sessionStorage.getItem(STORAGE_KEYS.RETRY_COUNT);
      const storedCooldownEndsAt = sessionStorage.getItem(STORAGE_KEYS.COOLDOWN_ENDS_AT);

      if (storedRetryCount) {
        initialRetryCount = parseInt(storedRetryCount, 10);
      }

      if (storedCooldownEndsAt) {
        const endsAt = parseInt(storedCooldownEndsAt, 10);
        const now = Date.now();
        if (endsAt > now) {
          initialCooldownRemaining = Math.ceil((endsAt - now) / 1000);
        }
      }
    } catch (e) {
      console.warn("Failed to load ErrorBoundary state from sessionStorage", e);
    }

    this.state = { 
      hasError: false, 
      error: null, 
      retryKey: 0,
      retryCount: initialRetryCount,
      cooldownRemaining: initialCooldownRemaining
    };

  }

  componentDidMount() {
    if (this.state.cooldownRemaining > 0) {
      this.startCooldownTimer();
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    
    this.setState(prevState => {
      const nextRetryCount = prevState.retryCount + 1;
      // Cooldown increases with retry count: 2s, 5s, 10s, 20s, max 30s
      const nextCooldown = nextRetryCount > 1 ? Math.min(Math.pow(2, nextRetryCount - 1) + 1, 30) : 0;
      
      try {
        sessionStorage.setItem(STORAGE_KEYS.RETRY_COUNT, nextRetryCount.toString());
        if (nextCooldown > 0) {
          const endsAt = Date.now() + nextCooldown * 1000;
          sessionStorage.setItem(STORAGE_KEYS.COOLDOWN_ENDS_AT, endsAt.toString());
        }
      } catch (e) {
        console.warn("Failed to save ErrorBoundary state to sessionStorage", e);
      }

      if (nextCooldown > 0) {
        this.startCooldownTimer();
      }
      
      return {
        retryCount: nextRetryCount,
        cooldownRemaining: nextCooldown
      };
    });
  }

  startCooldownTimer = () => {
    if (this.timer) window.clearInterval(this.timer);
    
    this.timer = window.setInterval(() => {
      this.setState(prevState => {
        const nextCooldownRemaining = prevState.cooldownRemaining - 1;
        
        if (nextCooldownRemaining <= 0) {
          if (this.timer) {
            window.clearInterval(this.timer);
            this.timer = null;
          }
          try {
            sessionStorage.removeItem(STORAGE_KEYS.COOLDOWN_ENDS_AT);
          } catch (e) {
            console.warn("Failed to remove cooldown state from sessionStorage", e);
          }
          return { cooldownRemaining: 0 };
        }
        return { cooldownRemaining: nextCooldownRemaining };
      });
    }, 1000);
  };

  componentWillUnmount() {
    if (this.timer) window.clearInterval(this.timer);
  }

  handleReload = () => {
    if (this.state.cooldownRemaining > 0) return;

    this.setState((prevState) => ({ 
      hasError: false, 
      error: null,
      retryKey: prevState.retryKey + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.name === "ChunkLoadError" || 
        this.state.error?.message?.toLowerCase().includes("loading chunk") ||
        this.state.error?.message?.toLowerCase().includes("failed to fetch dynamically imported module") ||
        this.state.error?.message?.toLowerCase().includes("fetching subresource failed");

      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6 text-center animate-in fade-in duration-500">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-foreground">
              {isChunkError ? "Erro de Conexão ou Atualização" : (this.props.fallbackMessage || "Algo deu errado")}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {isChunkError 
                ? "Não foi possível carregar alguns arquivos necessários. Isso pode acontecer devido a uma conexão instável ou uma nova atualização do sistema."
                : "Ocorreu um erro inesperado ao carregar esta seção."}
              {this.state.retryCount > 1 && (
                <span className="block mt-1 font-medium text-destructive/80">
                  Tentativa {this.state.retryCount} falhou.
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button 
              onClick={this.handleReload} 
              variant="default" 
              className="gap-2 shadow-sm min-w-[200px]"
              disabled={this.state.cooldownRemaining > 0 || this.state.retryCount >= MAX_RETRIES}
            >
              <RefreshCw className={`w-4 h-4 ${this.state.cooldownRemaining > 0 ? "animate-spin" : ""}`} />
              {this.state.retryCount >= MAX_RETRIES ? (
                "Limite de tentativas atingido"
              ) : this.state.cooldownRemaining > 0 ? (
                `Tentar carregar novamente (${MAX_RETRIES - this.state.retryCount} tentativas - ${this.state.cooldownRemaining}s)`
              ) : (
                `Tentar carregar novamente (${MAX_RETRIES - this.state.retryCount} tentativas restantes)`
              )}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Recarregar página inteira
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div key={this.state.retryKey}>
        {this.props.children}
      </div>
    );
  }
}
