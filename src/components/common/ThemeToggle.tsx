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
          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 group-hover:scale-110" />
          <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 group-hover:scale-110" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-bold uppercase tracking-widest text-[10px]">
        {theme === "dark" ? "Visual Daylight" : "Visual Dark-Mode"}
      </TooltipContent>
    </Tooltip>
  );
}
