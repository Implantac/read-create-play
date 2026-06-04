import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { LotterySelector } from "@/components/LotterySelector";
import { Button } from "@/components/ui/button";
import { Database, Loader2, LogOut, User, RefreshCw } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";

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
  const location = useLocation();


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans antialiased">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(160,84,45,0.08),rgba(255,255,255,0))] pointer-events-none" />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="border-b border-border/40 glass-panel sticky top-0 z-50 h-16 flex items-center shadow-2xl shadow-black/20">

            {/* Top row - brand + actions */}
            <div className="w-full flex items-center gap-4 px-6">
              <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-xl h-10 w-10" />
              
              <div className="w-px h-8 bg-border/40 hidden sm:block" />


              {/* Lottery selector - scrollable on mobile */}
              <div className="flex-1 overflow-x-auto scrollbar-hide">
                <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Draw count badge */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/30 border border-border/40 cursor-default group transition-all hover:border-primary/30 shadow-inner">
                      <Database className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-mono font-black text-foreground/90">

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
                      onClick={() => syncDraws()}
                      disabled={syncing}
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all group"
                    >
                      {syncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                      )}
                    </Button>

                  </TooltipTrigger>
                  <TooltipContent>{syncing ? "Sincronizando..." : "Sincronizar sorteios"}</TooltipContent>
                </Tooltip>

                {/* Theme toggle */}
                <ThemeToggle />

                <div className="w-px h-8 bg-border/40" />

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-3 hover:bg-primary/5 px-2 rounded-xl transition-all border border-transparent hover:border-primary/20">
                      <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10 group-hover:scale-105 transition-all">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="hidden md:flex flex-col items-start text-left shrink-0">
                        <span className="text-xs font-black text-foreground tracking-tight uppercase italic">
                          {profile?.full_name || user?.email?.split("@")[0] || "Usuário"}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-60">ID Session • Connected</span>
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
          <footer className="border-t border-border/30 py-4">
            <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                <span className="font-mono tracking-wider uppercase">Titan Loterias — Motor v5.0 • Neural Core • Quantum Stats</span>
              </div>
              <p className="text-[9px] text-muted-foreground/40 max-w-xs text-center leading-relaxed">
                As loterias são eventos aleatórios. As análises Titan possuem caráter estritamente estatístico e não garantem premiações.
              </p>
            </div>
          </footer>

        </div>
        <WhatsAppButton />
      </div>
    </SidebarProvider>
  );
}
