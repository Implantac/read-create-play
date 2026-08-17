import { useCallback, useEffect, useMemo, useState } from "react";
import { trackPWAEvent } from "@/lib/pwa-tracking";
function detectPlatform() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent))
        return "ios";
    if (userAgent.includes("android"))
        return "android";
    return null;
}
function isStandaloneMode() {
    const mediaMatch = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = Boolean(window.navigator.standalone);
    return mediaMatch || iosStandalone;
}
export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());
    const platform = useMemo(() => detectPlatform(), []);
    const isPreviewHost = useMemo(() => window.location.hostname.includes("id-preview--") ||
        window.location.hostname.includes("lovableproject.com"), []);
    const isInIframe = useMemo(() => {
        try {
            return window.self !== window.top;
        }
        catch {
            return true;
        }
    }, []);
    useEffect(() => {
        const displayModeQuery = window.matchMedia("(display-mode: standalone)");
        const syncInstalledState = () => {
            setIsInstalled(isStandaloneMode());
        };
        const handleBeforeInstallPrompt = (event) => {
            console.log("[PWA] beforeinstallprompt event captured");
            event.preventDefault();
            const promptEvent = event;
            // Store it and log state
            setDeferredPrompt(promptEvent);
            // Notify components immediately if needed
            window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
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
        if (!deferredPrompt)
            return false;
        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            if (choice.outcome === "accepted") {
                trackPWAEvent('prompt_accepted', platform);
                return true;
            }
            else {
                trackPWAEvent('prompt_dismissed', platform);
                return false;
            }
        }
        catch (err) {
            console.error("[PWA] Install error:", err);
            setDeferredPrompt(null);
            return false;
        }
    }, [deferredPrompt, platform]);
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
