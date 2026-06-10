import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { m, AnimatePresence } from "framer-motion";

import { useLotteryContext } from "@/contexts/LotteryContext";
import { useAuth } from "@/contexts/AuthContext";
import { DrawNotificationChecker } from "@/components/lottery/DrawNotificationChecker";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { GuidedOnboarding } from "@/components/GuidedOnboarding";
import { NoiseBackground } from "@/components/common/NoiseBackground";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";

import { TooltipProvider } from "@/components/ui/tooltip";

export function AppLayout() {
  const { 
    selectedLottery, 
    setSelectedLottery, 
    loading, 
    count, 
    syncing, 
    syncDraws, 
    viewMode, 
    setViewMode 
  } = useLotteryContext();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <SidebarProvider>
      <TooltipProvider>
        <div className="min-h-screen flex w-full bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans antialiased relative">
          <a href="#main-content" className="skip-to-content">
            Pular para o conteúdo principal
          </a>
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(var(--primary-rgb),0.08),rgba(255,255,255,0))] pointer-events-none z-0" aria-hidden="true" />
          <NoiseBackground />
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AppHeader
              selectedLottery={selectedLottery}
              setSelectedLottery={setSelectedLottery}
              loading={loading}
              count={count}
              syncing={syncing}
              syncDraws={syncDraws}
              viewMode={viewMode}
              setViewMode={setViewMode}
              profile={profile}
              user={user}
              signOut={signOut}
            />

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

            <AppFooter />
          </div>
          <WhatsAppButton />
          <GuidedOnboarding />
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
}
