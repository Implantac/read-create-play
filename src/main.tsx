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
function handleChunkError(msg: string) {
  if (!msg.includes("Failed to fetch dynamically imported module") && !msg.includes("Should have a queue")) {
    return false;
  }

  const reloadKey = msg.includes("Should have a queue") ? "react-queue-reloaded" : "chunk-reloaded";
  const reloadCount = parseInt(sessionStorage.getItem(reloadKey) || "0", 10);

  if (reloadCount < 2) {
    const nextCount = reloadCount + 1;
    sessionStorage.setItem(reloadKey, nextCount.toString());
    
    const reason = msg.includes("Should have a queue") 
      ? "React internal queue corruption (HMR-related)" 
      : "Stale chunk/module fetch error (deploy mismatch)";
      
    console.warn(`[Auto-Recover] Attempt ${nextCount}: ${reason}. Reloading...`);

    // Add backoff for the second attempt
    const delay = nextCount === 1 ? 0 : 1500;
    
    setTimeout(() => {
      location.reload();
    }, delay);
    
    return true;
  }
  
  if (reloadCount >= 2) {
    console.error(`[Auto-Recover] Failed to recover after ${reloadCount} attempts. Keeping app state for debugging.`);
    sessionStorage.removeItem(reloadKey); // Reset for next time user manually reloads
  }
  
  return false;
}

window.addEventListener("error", (e) => {
  const msg = String(e.message || "");
  // Ignore browser-extension noise
  if (isExtensionError(msg, e.filename ?? undefined)) {
    e.preventDefault();
    return;
  }
  
  if (handleChunkError(msg)) {
    e.preventDefault();
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
    if (isPreviewRuntime()) console.warn("[safe-dom] Suppressed:", msg);
    e.preventDefault();
    return;
  }

  if (handleChunkError(msg)) {
    e.preventDefault();
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
