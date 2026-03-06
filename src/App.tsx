import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LotteryProvider } from "@/contexts/LotteryContext";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import GeradorPage from "@/pages/GeradorPage";
import EstrategiasPage from "@/pages/EstrategiasPage";
import SimulacoesPage from "@/pages/SimulacoesPage";
import HistoricoPage from "@/pages/HistoricoPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LotteryProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/gerador" element={<GeradorPage />} />
              <Route path="/estrategias" element={<EstrategiasPage />} />
              <Route path="/simulacoes" element={<SimulacoesPage />} />
              <Route path="/historico" element={<HistoricoPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LotteryProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
