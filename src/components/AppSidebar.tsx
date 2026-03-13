import {
  BarChart3, Sparkles, FlaskConical, History, Zap,
  Brain, ShieldCheck, Crown, PieChart, TrendingUp, ClipboardCheck,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { usePlanAccess } from "@/hooks/usePlanAccess";
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

const mainItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Gerador", url: "/gerador", icon: Sparkles },
  { title: "IA Autônoma", url: "/ia-autonoma", icon: Zap },
  { title: "AI Analyst", url: "/ai-analyst", icon: Brain },
  { title: "Estratégias IA", url: "/estrategias", icon: Brain },
  { title: "Simulações", url: "/simulacoes", icon: FlaskConical },
  { title: "Estatísticas", url: "/estatisticas", icon: PieChart },
  { title: "ROI", url: "/roi", icon: TrendingUp },
  { title: "Minhas Apostas", url: "/minhas-apostas", icon: ClipboardCheck },
  { title: "Histórico", url: "/historico", icon: History },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useAdminCheck();
  const { currentPlan } = usePlanAccess();
  const { config } = useLotteryContext();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow">
            <Zap className="w-5 h-5 text-primary-foreground" />
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
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="rounded-lg px-3 py-2.5 text-sm transition-all duration-200 hover:bg-sidebar-accent/60 text-sidebar-foreground"
                      activeClassName="bg-primary/10 text-primary font-semibold glow-green"
                    >
                      <item.icon className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
