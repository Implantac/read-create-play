import { Database, Loader2, RefreshCw, Zap, Brain, User, LogOut } from "lucide-react";
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
    <header className="border-b border-border/40 glass-panel sticky top-0 z-50 h-20 flex items-center shadow-xl">
      <div className="w-full flex items-center gap-4 px-4 md:px-6">
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-2xl h-11 w-11 active:scale-90" />
        
        <div className="w-px h-6 bg-border/40 hidden sm:block" />

        <div className="flex-1 flex items-center min-w-0 overflow-hidden">
          <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-secondary/30 border border-border/40 cursor-default group transition-all hover:border-primary/40 shadow-inner">
                <Database className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-sm font-mono font-black text-foreground/90">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : count.toLocaleString()}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>Dataset de coleções (Loto-Sourced)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => syncDraws()}
                disabled={syncing}
                aria-label={syncing ? "Sincronizando sorteios" : "Sincronizar sorteios"}
                className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all group border border-transparent hover:border-primary/20 shadow-sm"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{syncing ? "Sincronizando..." : "Sincronizar sorteios"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(viewMode === "simple" ? "advanced" : "simple")}
                aria-label={`Alternar para modo ${viewMode === "simple" ? "avançado" : "simples"}`}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all group"
              >
                {viewMode === "simple" ? (
                  <Zap className="w-3.5 h-3.5 text-amber-400 group-hover:animate-pulse" />
                ) : (
                  <Brain className="w-3.5 h-3.5 text-primary group-hover:animate-pulse" />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">
                  {viewMode === "simple" ? "Modo Simples" : "Modo Avançado"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mudar para modo {viewMode === "simple" ? "Avançado" : "Simples"}</TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <div className="w-px h-8 bg-border/40" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-3 hover:bg-primary/5 px-2 md:px-4 h-12 rounded-2xl transition-all border border-transparent hover:border-primary/20 active:scale-[0.98] shadow-sm">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10 transition-all group-hover:rotate-6">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>

                <div className="hidden md:flex flex-col items-start text-left shrink-0">
                  <span className="text-xs font-black text-foreground tracking-tight uppercase italic leading-none">
                    {profile?.full_name || user?.email?.split("@")[0] || "Executive"}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-black tracking-widest uppercase opacity-60 mt-1">Status • Certified</span>
                </div>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 glass-card">
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">{profile?.full_name || "Usuário"}</p>
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
