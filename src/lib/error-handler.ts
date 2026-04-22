export interface RefinedError {
  title: string;
  description: string;
  recommendation: string;
}

export function refineError(error: any): RefinedError {
  const message = error?.message || error?.toString() || "";
  
  // Timeout error
  if (message.includes("timeout") || message.includes("deadline exceeded") || error?.name === "TimeoutError") {
    return {
      title: "Tempo esgotado",
      description: "A conexão demorou muito para responder.",
      recommendation: "Verifique se sua internet está estável ou tente novamente em alguns instantes."
    };
  }

  // Network/Connection error
  if (
    message.includes("Failed to fetch") || 
    message.includes("Network Error") || 
    message.includes("network error") ||
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
    if (error.code.startsWith("PGRST")) {
      return {
        title: "Erro no processamento de dados",
        description: "Ocorreu um problema ao buscar ou salvar informações.",
        recommendation: "Tente atualizar a página. Se o erro persistir, entre em contato com o suporte."
      };
    }
    
    // Auth errors (often 400 range codes)
    if (error.status === 401 || error.status === 403) {
      return {
        title: "Acesso não autorizado",
        description: "Sua sessão pode ter expirado ou você não tem permissão para esta ação.",
        recommendation: "Tente fazer login novamente para reestabelecer seu acesso."
      };
    }
  }

  // General API/Server errors
  if (error?.status >= 500) {
    return {
      title: "Instabilidade no servidor",
      description: "Nosso servidor está enfrentando dificuldades técnicas no momento.",
      recommendation: "Já estamos cientes. Por favor, tente novamente em alguns minutos."
    };
  }

  // Default error
  return {
    title: "Ops! Algo deu errado",
    description: message || "Ocorreu um erro inesperado.",
    recommendation: "Tente novamente ou recarregue a página para resolver o problema."
  };
}
