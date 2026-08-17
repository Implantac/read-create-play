import { useEffect, useState, useRef } from "react";
import { trackPWAEvent } from "@/lib/pwa-tracking";
import { Link } from "react-router-dom";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const DISMISS_KEY = "titan_install_prompt_dismissed_at";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 3; // 3 dias

export const AutoInstallPrompt = () => {
  const { canPromptInstall, needsManualInstall, install, isInstalled, platform, isPreviewHost, isInIframe } =
    useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const trackedShown = useRef(false);

  useEffect(() => {
    const checkVisibility = () => {
      if (isPreviewHost || isInIframe || isInstalled) return;

      if (!canPromptInstall && !needsManualInstall) {
        return;
      }

      try {
        const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (dismissed && Date.now() - dismissed < DISMISS_MS) return;
      } catch {
        /* ignore */
      }

      if (!trackedShown.current) {
        trackPWAEvent('prompt_shown', platform);
        trackedShown.current = true;
      }
      setVisible(true);
    };

    const t = setTimeout(checkVisibility, 1500);
    
    // Also listen for the custom event in case it fires after the timeout
    window.addEventListener('pwa-prompt-ready', checkVisibility);
    
    return () => {
      clearTimeout(t);
      window.removeEventListener('pwa-prompt-ready', checkVisibility);
    };
  }, [canPromptInstall, needsManualInstall, isInstalled, isPreviewHost, isInIframe]);

  const dismiss = () => {
    trackPWAEvent('prompt_dismissed', platform);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!canPromptInstall) return;
    setBusy(true);
    try {
      await install();
    } finally {
      setBusy(false);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-bottom-6 fade-in duration-500">
      <div className="relative rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 p-4">
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3 pr-6">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Instalar Titan Loterias</p>
            <p className="text-xs text-muted-foreground leading-snug">
              {platform === "ios"
                ? "Adicione à tela inicial do seu iPhone para usar como app."
                : "Instale o app no seu dispositivo para acesso rápido e tela cheia."}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {canPromptInstall ? (
            <Button onClick={handleInstall} size="sm" className="flex-1" disabled={busy}>
              <Download className="h-4 w-4" />
              {busy ? "Instalando..." : "Instalar agora"}
            </Button>
          ) : (
            <Button asChild size="sm" className="flex-1" onClick={dismiss}>
              <Link to="/install">Ver como instalar</Link>
            </Button>
          )}
          <Button onClick={dismiss} size="sm" variant="ghost">
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutoInstallPrompt;
