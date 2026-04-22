export interface RefinedError {
  title: string;
  description: string;
  recommendation: string;
}

export function refineError(error: any): RefinedError {
  const message = error?.message || error?.toString() || "";
  
  // Timeout error
  if (message.toLowerCase().includes("timeout") || message.toLowerCase().includes("deadline exceeded") || error?.name === "TimeoutError") {
    return {
      title: "Tempo esgotado",
      description: "A conexão demorou muito para responder.",
      recommendation: "Verifique se sua internet está estável ou tente novamente em alguns instantes."
    };
  }

  // Network/Connection error
  if (
    message.includes("Failed to fetch") || 
    message.toLowerCase().includes("network error") || 
    message.toLowerCase().includes("connection refused") ||
    !window.navigator.onLine
  ) {
    return {
      title: "Falha de conexão",
      description: "Não foi possível conectar ao servidor.",
      recommendation: "Verifique sua conexão com a internet e se não há bloqueios de rede (como VPNs restritivas)."
    };
  }

  // API/Supabase specific errors
  if (error?.code) {
    // PostgREST/Supabase error codes
    // https://postgrest.org/en/stable/errors.html
    if (error.code.startsWith("PGRST") || error.code === "42P01") {
      return {
        title: "Erro de processamento",
        description: "Ocorreu um problema ao acessar o banco de dados.",
        recommendation: "Tente atualizar a página. Se o erro persistir, nossa equipe técnica já foi notificada."
      };
    }
    
    // Auth errors
    if (error.code === "invalid_credentials" || error.status === 401) {
      return {
        title: "Acesso negado",
        description: "Suas credenciais são inválidas ou sua sessão expirou.",
        recommendation: "Por favor, faça login novamente para continuar."
      };
    }
  }

  // General API/Server errors (5xx)
  if (error?.status >= 500) {
    return {
      title: "Instabilidade no servidor",
      description: "Nosso servidor está enfrentando dificuldades técnicas momentâneas.",
      recommendation: "Estamos trabalhando nisso. Por favor, tente novamente em alguns minutos."
    };
  }

  // Default error
  return {
    title: "Ops! Algo deu errado",
    description: message && message.length < 100 ? message : "Ocorreu um erro inesperado ao processar sua solicitação.",
    recommendation: "Tente realizar a operação novamente ou recarregue a página."
  };
}

