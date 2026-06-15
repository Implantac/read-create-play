/**
 * Service Worker registration with strict guards.
 *
 * Never registers in:
 *  - dev builds
 *  - iframes (Lovable editor preview)
 *  - Lovable preview/staging hosts
 *  - URLs containing ?sw=off (kill switch)
 *
 * In any refused context, also unregisters any existing /sw.js registration
 * so stale workers don't keep serving cached HTML.
 */

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  try {
    if (!import.meta.env.PROD) return true;

    // Kill switch
    if (typeof window !== "undefined" && window.location.search.includes("sw=off")) {
      return true;
    }

    // Iframe (editor preview)
    if (typeof window !== "undefined" && window.self !== window.top) return true;

    const host = typeof window !== "undefined" ? window.location.hostname : "";
    if (
      host.startsWith("id-preview--") ||
      host.startsWith("preview--") ||
      host === "lovableproject.com" ||
      host.endsWith(".lovableproject.com") ||
      host === "lovableproject-dev.com" ||
      host.endsWith(".lovableproject-dev.com") ||
      host === "beta.lovable.dev" ||
      host.endsWith(".beta.lovable.dev")
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

async function unregisterMatching(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  if (isRefusedContext()) {
    await unregisterMatching();
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({
      immediate: true,
      onRegisterError(err) {
        console.warn("[PWA] register error", err);
      },
    });
  } catch (err) {
    console.warn("[PWA] failed to load registration module", err);
  }
}
