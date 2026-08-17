import { useCallback, useEffect, useMemo, useState } from "react";

type DetectedPlatform = "android" | "ios" | null;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function detectPlatform(): DetectedPlatform {
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (userAgent.includes("android")) return "android";
  return null;
}

function isStandaloneMode() {
  const mediaMatch = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mediaMatch || iosStandalone;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());

  const platform = useMemo(() => detectPlatform(), []);
  const isPreviewHost = useMemo(
    () =>
      window.location.hostname.includes("id-preview--") ||
      window.location.hostname.includes("lovableproject.com"),
    [],
  );
  const isInIframe = useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    const displayModeQuery = window.matchMedia("(display-mode: standalone)");

    const syncInstalledState = () => {
      setIsInstalled(isStandaloneMode());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      console.log("[PWA] beforeinstallprompt event captured");
      event.preventDefault();
      // Ensure we cast correctly and don't lose the event
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      console.log("[PWA] App installed successfully");
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    syncInstalledState();
    
    // Check if the event was already fired before listener was attached
    if ('BeforeInstallPromptEvent' in window) {
      console.log("[PWA] BeforeInstallPromptEvent supported");
    }

    displayModeQuery.addEventListener?.("change", syncInstalledState);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      displayModeQuery.removeEventListener?.("change", syncInstalledState);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      setDeferredPrompt(null);
      return choice.outcome === "accepted";
    } catch {
      setDeferredPrompt(null);
      return false;
    }
  }, [deferredPrompt]);

  return {
    install,
    isInstalled,
    isInIframe,
    isPreviewHost,
    needsManualInstall: platform === "ios" && !isInstalled,
    platform,
    canInstallFromHere: !isPreviewHost && !isInIframe,
    canPromptInstall: Boolean(deferredPrompt) && !isInstalled && !isPreviewHost && !isInIframe,
  };
}
