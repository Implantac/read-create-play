import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-reload on stale chunk errors (deploy cache mismatch)
window.addEventListener("error", (e) => {
  const msg = String(e.message || "");
  if (
    msg.includes("Failed to fetch dynamically imported module") &&
    !sessionStorage.getItem("chunk-reloaded")
  ) {
    sessionStorage.setItem("chunk-reloaded", "1");
    location.reload();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = String(e.reason?.message || e.reason || "");
  if (
    msg.includes("Failed to fetch dynamically imported module") &&
    !sessionStorage.getItem("chunk-reloaded")
  ) {
    sessionStorage.setItem("chunk-reloaded", "1");
    location.reload();
  }
});
// Clear flag on successful load
sessionStorage.removeItem("chunk-reloaded");

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
} else {
  console.warn("[Titan] Root element not found");
}
