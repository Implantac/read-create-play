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

function isPreviewRuntime(): boolean {
  const host = window.location.hostname;
  if (host.includes("id-preview--") || host.includes("lovableproject.com")) return true;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

// ── Global error handlers ────────────────────────────────
window.addEventListener("error", (e) => {
  const msg = String(e.message || "");
  // Ignore browser-extension noise
  if (isExtensionError(msg, e.filename ?? undefined)) {
    e.preventDefault();
    return;
  }
  // Auto-recover from React internal queue corruption (HMR-related)
  if (msg.includes("Should have a queue") && !sessionStorage.getItem("react-queue-reloaded")) {
    sessionStorage.setItem("react-queue-reloaded", "1");
    e.preventDefault();
    location.reload();
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
  // Auto-recover from React internal queue corruption (HMR-related)
  if (msg.includes("Should have a queue") && !sessionStorage.getItem("react-queue-reloaded")) {
    sessionStorage.setItem("react-queue-reloaded", "1");
    e.preventDefault();
    location.reload();
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

// Clear flags after a successful load (delay ensures the page actually rendered)
window.addEventListener("load", () => {
  setTimeout(() => {
    sessionStorage.removeItem("chunk-reloaded");
    sessionStorage.removeItem("react-queue-reloaded");
  }, 2000);
});

// Proactively unregister stale service workers in preview/published to prevent chunk mismatches
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => {
      const host = window.location.hostname;
      const isPreview = host.includes("id-preview--") || host.includes("lovableproject.com");
      if (isPreview) {
        regs.forEach((r) => void r.unregister());
        if ("caches" in window) {
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => undefined);
        }
      }
    })
    .catch(() => undefined);
}
// ── Mount app ────────────────────────────────────────────
const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(<App />);
} else {
  console.warn("[Titan] Root element not found");
}
