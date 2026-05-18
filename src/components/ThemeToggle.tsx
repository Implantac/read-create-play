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
  }, [profile?.theme_preference]);

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
          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === "dark" ? "Modo claro" : "Modo escuro"}</TooltipContent>
    </Tooltip>
  );
}
