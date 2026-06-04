import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { LazyMotion, domAnimation } from "framer-motion";
import App from "./App.tsx";
import "./index.css";
import "./lovable-badge-hide.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <LazyMotion features={domAnimation} strict>
      <App />
    </LazyMotion>
  </HelmetProvider>
);
