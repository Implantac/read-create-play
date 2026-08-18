import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { LazyMotion, domAnimation } from "framer-motion";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import "./lovable-badge-hide.css";
import "./i18n";
import { registerServiceWorker } from "./pwa/registerSW";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || import.meta.env.SENTRY_DSN;

if (SENTRY_DSN) {
  console.log("🚀 Sentry Initializing with DSN:", SENTRY_DSN.substring(0, 20) + "...");

  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/titanloterias\.lovable\.app/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
    environment: "production",
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </HelmetProvider>
);

// Registra Service Worker para suporte offline (apenas em produção, fora do preview).
void registerServiceWorker();
