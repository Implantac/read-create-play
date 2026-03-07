import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { LotterySelector } from "@/components/LotterySelector";
import { Button } from "@/components/ui/button";
import { Database, Loader2, LogOut, User } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppLayout() {
  const { selectedLottery, setSelectedLottery, loading, count, syncing, syncDraws } = useLotteryContext();
  const { user, profile, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background gradient-mesh">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 flex items-center gap-3 border-b border-border/50 glass-panel sticky top-0 z-50 px-4">
            <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
            
            <div className="w-px h-6 bg-border/50 hidden sm:block" />

            <div className="flex-1 overflow-x-auto">
              <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Draw count */}
              <div className="text-right hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/30">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-mono font-semibold text-foreground">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : count}
                </span>
              </div>

              {/* Sync */}
              <Button
                size="sm"
                variant="outline"
                onClick={syncDraws}
                disabled={syncing}
                className="hidden sm:flex gap-1.5 text-xs border-border/50 hover:border-primary/30 hover:text-primary transition-colors"
              >
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                {syncing ? "Sync..." : "Sync"}
              </Button>

              <div className="w-px h-6 bg-border/50 hidden sm:block" />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted/50">
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center shadow-md shadow-primary/10">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 glass-card">
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold text-foreground">{profile?.full_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 container mx-auto px-4 py-6 md:px-6 lg:px-8">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="border-t border-border/30 py-3">
            <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse-glow" />
              <span className="font-mono tracking-wider uppercase">Titan Loterias — Motor v4.0 • ML • Database</span>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}