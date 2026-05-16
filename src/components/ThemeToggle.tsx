import { useTheme } from "next-themes";
import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { user, profile } = useAuth();

  // Sync DB preference on login
  useEffect(() => {
    if (profile?.theme_preference && profile.theme_preference !== "system") {
      setTheme(profile.theme_preference);
    }
  }, [profile?.theme_preference, setTheme]);

  const handleToggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    // Persist to DB
    if (user) {
      supabase
        .from("profiles")
        .update({ theme_preference: next } as any)
        .eq("id", user.id)
        .then();
    }
  }, [theme, setTheme, user]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggle}
          className="h-9 w-9 text-muted-foreground hover:text-primary transition-all duration-300 bg-white/[0.03] border border-white/5 rounded-xl"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Modo claro" : "Modo escuro"}</TooltipContent>
    </Tooltip>
  );
}
