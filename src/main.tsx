import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ── Helpers ──────────────────────────────────────────────
/** Returns true if the error originates from a browser extension, not our app */
function isExtensionError(msg: string, filename?: string): boolean {
  if (filename && /^(chrome|moz|safari)-extension:/.test(filename)) return true;
  if (/content\.js|VM\d+/.test(msg)) return true;
  return false;
}

// ── Global error handlers ────────────────────────────────
window.addEventListener("error", (e) => {
  const msg = String(e.message || "");
  // Ignore browser-extension noise
  if (isExtensionError(msg, e.filename ?? undefined)) {
    e.preventDefault();
    return;
  }
  // Auto-reload on stale chunk errors (deploy cache mismatch)
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
  // Ignore browser-extension noise
  if (isExtensionError(msg)) {
    e.preventDefault();
    return;
  }
  // Suppress null-DOM errors that slip through (defensive)
  if (msg.includes("appendChild") || msg.includes("Cannot read properties of null")) {
    if (import.meta.env.DEV) console.warn("[safe-dom] Suppressed:", msg);
    e.preventDefault();
    return;
  }
  // Auto-reload on stale chunk errors
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

// ── Mount app ────────────────────────────────────────────
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
} else {
  console.warn("[Titan] Root element not found");
}
