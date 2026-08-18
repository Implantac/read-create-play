import * as Sentry from "@sentry/react";

/**
 * Utilitário para testes de monitoramento.
 * ATENÇÃO: Use apenas para validar a integração com o Sentry.
 */
export const sentryTest = {
  /**
   * Dispara um erro manual para verificar se o Sentry captura.
   */
  triggerError: (message: string = "Teste de erro manual Titan Loterias") => {
    console.log("🔔 Disparando erro de teste para o Sentry...");
    Sentry.captureException(new Error(message));
    // Opcionalmente lançar o erro
    // throw new Error(message);
  },

  /**
   * Envia uma mensagem de log para o Sentry.
   */
  logMessage: (message: string) => {
    Sentry.captureMessage(message, "info");
  }
};
