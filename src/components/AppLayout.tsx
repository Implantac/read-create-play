import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { LotterySelector } from "@/components/LotterySelector";
import { Button } from "@/components/ui/button";
import { Database, Loader2, LogOut, Crown, User } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const PLAN_LABELS = { free: "Free", premium: "Premium", professional: "Pro" };

export function AppLayout() {
  const { selectedLottery, setSelectedLottery, loading, count, syncing, syncDraws } = useLotteryContext();
  const { user, profile, signOut } = useAuth();
  const { currentPlan } = usePlanAccess();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background gradient-mesh">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50 px-4">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1 overflow-x-auto">
              <LotterySelector selected={selectedLottery} onSelect={setSelectedLottery} />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-muted-foreground">Concursos</p>
                <p className="text-xs font-mono font-bold text-foreground">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : count}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={syncDraws}
                disabled={syncing}
                className="hidden sm:flex gap-1 text-xs"
              >
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                {syncing ? "Sync..." : "Sincronizar"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                      {PLAN_LABELS[currentPlan]}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-foreground">{profile?.full_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/planos" className="gap-2 cursor-pointer">
                      <Crown className="w-4 h-4" />
                      Planos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-6">
            <Outlet />
          </main>
          <footer className="border-t border-border py-3">
            <div className="container mx-auto px-4 text-center text-[10px] text-muted-foreground">
              Titan Loterias — Motor estatístico v4.0 + Machine Learning + Banco de Dados
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
