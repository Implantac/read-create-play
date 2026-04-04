import { useEffect, useRef } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

/**
 * Automatically triggers the native install prompt when the user
 * visits the published app for the first time (not in preview/iframe).
 * Shows at most once per session to avoid being intrusive.
 */
export function AutoInstallPrompt() {
  const { canPromptInstall, install } = useInstallPrompt();
  const prompted = useRef(false);

  useEffect(() => {
    if (!canPromptInstall || prompted.current) return;

    // Avoid prompting again in this session
    if (sessionStorage.getItem("auto-install-prompted")) return;

    // Small delay so the page renders first
    const timer = setTimeout(() => {
      prompted.current = true;
      sessionStorage.setItem("auto-install-prompted", "1");
      void install();
    }, 1500);

    return () => clearTimeout(timer);
  }, [canPromptInstall, install]);

  return null;
}
