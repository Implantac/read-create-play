import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Share, Sparkles } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SESSION_KEY = "auto-install-prompted";

/**
 * Opens an install assistant automatically on the published app.
 * The browser-native prompt is still triggered from user interaction,
 * which is the most reliable flow supported by mobile browsers.
 */
export function AutoInstallPrompt() {
  const { canInstallFromHere, canPromptInstall, install, isInstalled, needsManualInstall, platform } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const prompted = useRef(false);

  const copy = useMemo(() => {
    if (canPromptInstall) {
      return {
        title: "Instale o Titan no seu celular",
        description: "O app já está pronto para instalação. Toque no botão abaixo para abrir o instalador nativo do navegador.",
        primaryLabel: installing ? "Abrindo instalador..." : "Instalar agora",
      };
    }

    if (needsManualInstall) {
      return {
        title: "Adicione o Titan à tela inicial",
        description: "No iPhone e iPad, a instalação é feita pelo Safari em Compartilhar → Adicionar à Tela de Início.",
        primaryLabel: "Ver passo a passo",
      };
    }

    return {
      title: "Ative o app no seu aparelho",
      description:
        platform === "android"
          ? "Se o navegador ainda não liberou o prompt nativo, abra o guia rápido de instalação e siga o passo a passo do Chrome."
          : "Abra o guia de instalação para concluir a ativação do app no seu dispositivo.",
      primaryLabel: "Abrir guia de instalação",
    };
  }, [canPromptInstall, installing, needsManualInstall, platform]);

  useEffect(() => {
    if (!canInstallFromHere || isInstalled || prompted.current) return;

    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = window.setTimeout(() => {
      prompted.current = true;
      setOpen(true);
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [canInstallFromHere, isInstalled]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  };

  const handleInstall = async () => {
    if (!canPromptInstall || installing) return;

    setInstalling(true);
    const accepted = await install();
    setInstalling(false);

    if (accepted) {
      setOpen(false);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  };

  const openGuide = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    window.location.assign("/install");
  };

  if (!canInstallFromHere || isInstalled) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-border bg-background">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            {canPromptInstall ? <Download className="h-5 w-5" /> : needsManualInstall ? <Share className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div className="space-y-1">
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-start sm:space-x-0">
          {canPromptInstall ? (
            <>
              <Button onClick={handleInstall} disabled={installing} className="w-full sm:w-auto">
                {copy.primaryLabel}
              </Button>
              <Button variant="outline" onClick={openGuide} className="w-full sm:w-auto">
                Ver instruções
              </Button>
            </>
          ) : (
            <>
              <Button onClick={openGuide} className="w-full sm:w-auto">
                {copy.primaryLabel}
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)} className="w-full sm:w-auto">
                Agora não
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
