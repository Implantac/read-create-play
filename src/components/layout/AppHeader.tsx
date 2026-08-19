import { Database, Loader2, RefreshCw, Zap, Brain, User, LogOut } from "lucide-react";
import { DataOriginIndicator } from "@/components/common/DataOriginIndicator";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { LotterySelector } from "@/components/lottery/LotterySelector";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  selectedLottery: string;
  setSelectedLottery: (id: string) => void;
  loading: boolean;
  count: number;
  syncing: boolean;
  syncDraws: () => void;
  viewMode: "simple" | "advanced";
  setViewMode: (mode: "simple" | "advanced") => void;
  profile: any;
  user: any;
  signOut: () => void;
}

export function AppHeader({
  selectedLottery,
  setSelectedLottery,
  loading,
  count,
  syncing,
  syncDraws,
  viewMode,
  setViewMode,
  profile,
  user,
  signOut
}: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border/40 glass-panel sticky top-0 z-50 h-16 flex items-center">
      <div className="w-full flex items-center gap-3 px-4 md:px-6">
        <SidebarTrigger
          className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors rounded-lg h-9 w-9"
          aria-label="Alternar menu lateral"
        />

        <div className="w-px h-5 bg-border/60 hidden sm:block" aria-hidden="true" />

        <div className="flex-1 flex items-center min-w-0 overflow-hidden px-2">
          <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <DataOriginIndicator />

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/40 cursor-default">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-semibold text-foreground/90 tabular-nums">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : count.toLocaleString("pt-BR")}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Sorteios sincronizados</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => syncDraws()}
                disabled={syncing}
                aria-label={syncing ? "Sincronizando sorteios" : "Sincronizar sorteios"}
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{syncing ? "Sincronizando..." : "Sincronizar"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === "simple" ? "advanced" : "simple")}
                aria-label={`Alternar para modo ${viewMode === "simple" ? "avançado" : "simples"}`}
                className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg hover:bg-primary/5"
              >
                {viewMode === "simple" ? (
                  <Zap className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Brain className="w-3.5 h-3.5 text-primary" />
                )}
                <span className="text-xs font-semibold hidden lg:block">
                  {viewMode === "simple" ? "Simples" : "Avançado"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mudar para modo {viewMode === "simple" ? "Avançado" : "Simples"}</TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <div className="w-px h-6 bg-border/60 mx-1" aria-hidden="true" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2.5 hover:bg-primary/5 px-2 md:px-3 h-10 rounded-lg">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-xs font-semibold text-foreground leading-none">
                    {profile?.full_name || user?.email?.split("@")[0] || "Usuário"}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {profile?.role === 'super_admin' ? "GOD MODE" : "Conta ativa"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 glass-card">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')} className="gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
