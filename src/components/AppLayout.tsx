import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { LotterySelector } from "@/components/LotterySelector";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { useLotteryContext } from "@/contexts/LotteryContext";

export function AppLayout() {
  const { selectedLottery, setSelectedLottery, loading, count, syncing, syncDraws } = useLotteryContext();

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
