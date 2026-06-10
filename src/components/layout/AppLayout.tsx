import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LotterySelector } from "@/components/LotterySelector";
import { Button } from "@/components/ui/button";
import { Database, Loader2, LogOut, User, RefreshCw, Zap, Brain } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DrawNotificationChecker } from "@/components/DrawNotificationChecker";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { GuidedOnboarding } from "@/components/GuidedOnboarding";
import { NoiseBackground } from "@/components/common/NoiseBackground";


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
  const { selectedLottery, setSelectedLottery, loading, count, syncing, syncDraws, viewMode, setViewMode } = useLotteryContext();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans antialiased relative">
        <a href="#main-content" className="skip-to-content">
          Pular para o conteúdo principal
        </a>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--primary-rgb),0.08),rgba(255,255,255,0))] pointer-events-none z-0" aria-hidden="true" />
        <NoiseBackground />
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="border-b border-border/40 glass-panel sticky top-0 z-50 h-20 flex items-center shadow-xl">

            {/* Top row - brand + actions */}
            <div className="w-full flex items-center gap-4 px-4 md:px-6">
              <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-2xl h-11 w-11 active:scale-90" />
              
              <div className="w-px h-6 bg-border/40 hidden sm:block" />


              {/* Lottery selector - scrollable on mobile */}
              <div className="flex-1 flex items-center min-w-0 overflow-hidden">
                <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Draw count badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-secondary/30 border border-border/40 cursor-default group transition-all hover:border-primary/40 shadow-inner">
                      <Database className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-mono font-black text-foreground/90">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : count.toLocaleString()}
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

                {/* View Mode Toggle */}
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

                {/* Theme toggle */}
                <ThemeToggle />

                <div className="w-px h-8 bg-border/40" />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-3 hover:bg-primary/5 px-2 md:px-4 h-12 rounded-2xl transition-all border border-transparent hover:border-primary/20 active:scale-[0.98] shadow-sm">
                      <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10 transition-all group-hover:rotate-6">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>

                      <div className="hidden md:flex flex-col items-start text-left shrink-0">
                        <span className="text-xs font-black text-foreground tracking-tight uppercase italic leading-none">
                          {profile?.full_name || user?.email?.split("@")[0] || "Usuário"}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-black tracking-widest uppercase opacity-60 mt-1">Status • Online</span>
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
          <main id="main-content" tabIndex={-1} aria-label="Conteúdo principal" className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8 space-y-6 focus:outline-none">
            <DrawNotificationChecker />
            <AnimatePresence mode="wait">
              <m.div
                key={location.pathname}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </m.div>
            </AnimatePresence>
          </main>


          {/* Footer */}
          <footer className="border-t border-border/20 py-8 bg-black/20">
            <div className="container mx-auto px-6 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
                <div className="w-2 h-2 rounded-full bg-primary/20 border border-primary/40 animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
                <span>Titan Loterias Alpha Core v5.3 — Next-Gen Intelligence</span>
                <div className="w-2 h-2 rounded-full bg-primary/20 border border-primary/40 animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
              </div>
              <div className="h-px w-16 bg-border/40" />
              <p className="text-[9px] text-muted-foreground/30 max-w-sm text-center leading-loose font-medium uppercase tracking-widest italic">
                As loterias são eventos aleatórios. Nossas análises utilizam heurísticas matemáticas avançadas, mas não constituem garantia de resultado financeiro. Use com responsabilidade.
              </p>
            </div>
          </footer>

        </div>
        <WhatsAppButton />
        <GuidedOnboarding />
      </div>
    </SidebarProvider>

  );
}
