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
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryKey: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
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
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button onClick={this.handleReload} variant="default" className="gap-2 shadow-sm">
              <RefreshCw className="w-4 h-4" />
              Tentar carregar novamente
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
