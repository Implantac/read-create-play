import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { LazyMotion, domAnimation } from "framer-motion";
import App from "./App.tsx";
import "./index.css";
import "./lovable-badge-hide.css";
import "./i18n";
import { registerServiceWorker } from "./pwa/registerSW";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </HelmetProvider>
);

// Registra Service Worker para suporte offline (apenas em produção, fora do preview).
void registerServiceWorker();
