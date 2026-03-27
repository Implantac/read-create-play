import {
  BarChart3, Sparkles, FlaskConical, History, Zap, Grid3X3,
  Brain, ShieldCheck, Crown, PieChart, TrendingUp, ClipboardCheck, Bot, Lock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { usePlanAccess, type Feature } from "@/hooks/usePlanAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useLotteryContext } from "@/contexts/LotteryContext";
import { LOTTERIES } from "@/data/lotteries";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainItems: { title: string; url: string; icon: any; requiredFeature?: Feature }[] = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Gerador", url: "/gerador", icon: Sparkles },
  { title: "IA Autônoma", url: "/ia-autonoma", icon: Zap, requiredFeature: "ia_autonoma" },
  { title: "AI Analyst", url: "/ai-analyst", icon: Bot, requiredFeature: "ai_analyst" },
  { title: "Estratégias IA", url: "/estrategias", icon: Brain, requiredFeature: "estrategias_basicas" },
  { title: "Simulações", url: "/simulacoes", icon: FlaskConical, requiredFeature: "simulacoes" },
  { title: "Fechamentos", url: "/fechamentos", icon: Grid3X3, requiredFeature: "fechamentos" },
  { title: "Estatísticas", url: "/estatisticas", icon: PieChart },
  { title: "ROI", url: "/roi", icon: TrendingUp, requiredFeature: "roi_dashboard" },
  { title: "Minhas Apostas", url: "/minhas-apostas", icon: ClipboardCheck },
  { title: "Histórico", url: "/historico", icon: History },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  premium: "Premium",
  professional: "Profissional",
  lifetime: "Vitalício",
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useAdminCheck();
  const { currentPlan, hasAccess, getMinPlan } = usePlanAccess();
  const { trialDaysLeft } = useAuth();
  const { config } = useLotteryContext();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300 overflow-hidden">
            <img src="/logo.png" alt="Titan Loterias" className="w-10 h-10 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold tracking-tight text-sidebar-accent-foreground">
                Titan<span className="gradient-brand-text ml-1">Loterias</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider uppercase">
                Motor v4.0
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Active lottery indicator */}
        <div className={`mx-1 mb-3 rounded-lg bg-primary/5 border border-primary/15 transition-all ${collapsed ? "p-2 flex justify-center" : "px-3 py-2"}`}>
          {collapsed ? (
            <span className="text-lg" title={config.name}>{config.icon}</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-base">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-primary truncate">{config.name}</p>
                <p className="text-[9px] text-muted-foreground font-mono">{config.pick}/{config.numbers}</p>
              </div>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
            Análise
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const locked = item.requiredFeature ? !hasAccess(item.requiredFeature) : false;
                const minPlan = item.requiredFeature ? getMinPlan(item.requiredFeature) : null;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-sidebar-accent/60 ${locked ? "text-muted-foreground/50" : "text-sidebar-foreground"}`}
                        activeClassName="bg-primary/10 text-primary font-semibold glow-green"
                      >
                        <item.icon className="mr-3 h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            {locked && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0 ml-1" />
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-xs">
                                  Requer plano {PLAN_LABELS[minPlan!] || "Premium"}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
              Sistema
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className="rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-sidebar-accent/60 text-sidebar-foreground"
                      activeClassName="bg-primary/10 text-primary font-semibold glow-green"
                    >
                      <ShieldCheck className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && <span>Painel Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {!collapsed && (
        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <Link
            to="/planos"
            className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 hover:bg-primary/10 transition-colors group"
          >
            <Crown className="w-4 h-4 text-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-accent-foreground">
                {currentPlan === "free" ? "Upgrade" : currentPlan === "premium" ? "Premium" : "Pro"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {currentPlan === "free" ? "Desbloquear recursos" : "Plano ativo"}
              </p>
            </div>
          </Link>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
