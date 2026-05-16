import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { LotterySelector } from "@/components/LotterySelector";
import { Button } from "@/components/ui/button";
import { Database, Loader2, LogOut, User, RefreshCw } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DrawNotificationChecker } from "@/components/DrawNotificationChecker";
import { WhatsAppButton } from "@/components/WhatsAppButton";
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

export function AppLayout() {
  const { selectedLottery, setSelectedLottery, loading, count, syncing, syncDraws } = useLotteryContext();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#050505] selection:bg-primary/20">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff11_1px,_transparent_0)] bg-[size:32px_32px] pointer-events-none opacity-20" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Header */}
          <header className="border-b border-white/5 bg-[#050505]/40 backdrop-blur-2xl sticky top-0 z-50">
            {/* Top row - brand + actions */}
            <div className="h-16 flex items-center gap-3 px-4 sm:px-6">
              <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/10 rounded-lg p-2" />
              
              <div className="w-px h-6 bg-border/40 hidden sm:block" />

              {/* Lottery selector - scrollable on mobile */}
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Draw count badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/30 cursor-default">
                      <Database className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : count}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Sorteios carregados no banco</TooltipContent>
                </Tooltip>

                {/* Sync button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void syncDraws()}
                      disabled={syncing}
                      className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {syncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{syncing ? "Sincronizando..." : "Sincronizar sorteios"}</TooltipContent>
                </Tooltip>

                {/* Theme toggle */}
                <ThemeToggle />

                <div className="w-px h-6 bg-border/50" />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2.5 hover:bg-muted/50 px-2 rounded-xl transition-all border border-transparent hover:border-border/30">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="hidden md:flex flex-col items-start leading-none">
                        <span className="text-[11px] font-bold text-foreground">
                          {profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Usuário"}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                          {profile?.plan || "Free"}
                        </span>
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

          {/* Content */}
          <main className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6">
            <DrawNotificationChecker />
            <ErrorBoundary fallbackMessage="Erro ao carregar esta seção">
              <Outlet />
            </ErrorBoundary>
          </main>

          {/* Footer */}
          <footer className="border-t border-border/30 py-3">
            <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
              <span className="font-mono tracking-wider uppercase">Titan Loterias — Motor v4.0 • ML • Database</span>
            </div>
          </footer>
        </div>
        <WhatsAppButton />
      </div>
    </SidebarProvider>
  );
}
