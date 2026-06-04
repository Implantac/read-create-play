import {
  BarChart3, Sparkles, FlaskConical, History, Zap, Grid3X3,
  Brain, ShieldCheck, Crown, PieChart, TrendingUp, ClipboardCheck, Bot, Lock,
  Smartphone, MessageCircle, Star, Search, User, FileSpreadsheet, Share2
} from "lucide-react";
import { NavLink } from "@/components/layout/NavLink";
import { usePlanAccess, type Feature } from "@/hooks/usePlanAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useLotteryContext } from "@/contexts/LotteryContext";
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
import { SystemAuditStatus } from "@/components/SystemAuditStatus";

const workflowGroups: { label: string; items: { title: string; url: string; icon: any; requiredFeature?: Feature; tooltip: string }[] }[] = [
  {
    label: "Menu Principal",
    items: [
      { title: "Dashboard", url: "/", icon: BarChart3, tooltip: "Terminal central de inteligência e resumo de fluxos." },
      { title: "Gerador de Jogos", url: "/gerador", icon: Sparkles, tooltip: "Geração assistida de apostas inteligentes." },
      { title: "Fechamentos", url: "/fechamentos", icon: Grid3X3, requiredFeature: "fechamentos", tooltip: "Fechamentos matemáticos de alta performance." },
      { title: "Central de Análise", url: "/analise", icon: PieChart, tooltip: "Estatísticas avançadas, tendências e farol neural." },
      { title: "Histórico", url: "/historico", icon: History, tooltip: "Seus jogos, resultados e auditoria de apostas." },
    ],
  },
];

const accountItems = [
  { title: "Minha Conta", url: "/perfil", icon: User },
  { title: "Planos", url: "/planos", icon: Crown },
  { title: "Suporte", url: "/suporte", icon: MessageCircle },
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
  const { isAdmin, isSuperAdmin, trialDaysLeft } = useAuth();
  const { currentPlan, hasAccess, getMinPlan } = usePlanAccess();
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
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tighter text-sidebar-accent-foreground uppercase italic">
                  Titan<span className="gradient-brand-text ml-0.5">Loterias</span>
                </h1>
                {isAdmin && (
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border animate-pulse ${

                    isSuperAdmin 
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }`}>
                    {isSuperAdmin ? "GOD" : "ADMIN"}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground font-black tracking-[0.3em] uppercase opacity-40">
                Neural Core v5.3
              </p>


            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 scrollbar-hide">
        {!collapsed && (
          <div className="px-2 mb-4">
            <SystemAuditStatus />
          </div>
        )}
        {/* Active lottery indicator */}
        <div className={`mx-3 mb-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 transition-all duration-500 hover:border-primary/40 group/lottery ${collapsed ? "p-2.5 flex justify-center" : "px-4 py-4 shadow-lg shadow-black/20"}`}>
          {collapsed ? (
            <span className="text-xl drop-shadow-md group-hover/lottery:scale-110 transition-transform cursor-pointer" title={config?.name || "Loto"}>{config?.icon || "🍀"}</span>
          ) : (
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-background/50 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner group-hover/lottery:rotate-6 transition-all duration-500 ring-1 ring-primary/10">
                <span className="text-xl drop-shadow-sm group-hover/lottery:scale-110 transition-transform">{config?.icon || "🍀"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-primary uppercase tracking-[0.1em] truncate leading-tight">{config?.name || "Loteria"}</p>
                <p className="text-[9px] text-muted-foreground font-mono font-black opacity-50 tracking-widest mt-1 uppercase italic">{config?.pick || 0} de {config?.numbers || 0}</p>
              </div>
            </div>
          )}
        </div>


        {workflowGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const locked = item.requiredFeature ? !hasAccess(item.requiredFeature) : false;
                  const minPlan = item.requiredFeature ? getMinPlan(item.requiredFeature) : null;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild className="h-auto p-0">
                            <NavLink
                              to={item.url}
                              end={item.url === "/"}
                              className={`flex items-center w-full rounded-xl px-4 py-3.5 text-sm transition-all duration-300 hover:bg-primary/10 group/item relative overflow-hidden border border-transparent hover:border-primary/10 active:scale-[0.98] ${locked ? "text-muted-foreground/40" : "text-sidebar-foreground/80"}`}
                              activeClassName="bg-primary/20 text-primary font-black shadow-lg shadow-primary/10 border-primary ring-1 ring-primary/30"
                            >

                              <item.icon className="mr-3.5 h-4.5 w-4.5 shrink-0 group-hover/item:scale-110 transition-transform duration-300" />
                              {!collapsed && (
                                <>
                                  <span className="flex-1 tracking-tight">{item.title}</span>
                                  {locked && <Lock className="h-3 w-3 text-muted-foreground/40 shrink-0 ml-1" />}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[260px] text-xs">
                          <p className="font-semibold mb-0.5">{item.title}</p>
                          <p className="text-muted-foreground">{item.tooltip}</p>
                          {locked && (
                            <p className="text-amber-400 mt-1 text-[10px]">
                              Requer plano {PLAN_LABELS[minPlan!] || "Premium"}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1">
            Conta e suporte
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:bg-primary/10 text-sidebar-foreground/80 group/item"
                      activeClassName="bg-primary/20 text-primary font-black shadow-[0_0_25px_rgba(var(--primary),0.2)] border-l-4 border-primary ring-1 ring-primary/20"
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
                      className="rounded-xl px-4 py-3 text-sm transition-all duration-300 hover:bg-primary/10 text-sidebar-foreground/80 group/item"
                      activeClassName="bg-primary/20 text-primary font-black shadow-[0_0_25px_rgba(var(--primary),0.2)] border-l-4 border-primary ring-1 ring-primary/20"
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
        <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
          {isAdmin ? (
            <div className={`rounded-lg px-3 py-2.5 text-center ${
              isSuperAdmin ? "bg-amber-500/10 border border-amber-500/25" : "bg-red-500/10 border border-red-500/25"
            }`}>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className={`w-4 h-4 ${isSuperAdmin ? "text-amber-400" : "text-red-400"}`} />
                <p className={`text-xs font-bold uppercase tracking-wider ${isSuperAdmin ? "text-amber-400" : "text-red-400"}`}>
                  {isSuperAdmin ? "Super Admin" : "Modo Admin"}
                </p>
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">Acesso irrestrito</p>
            </div>
          ) : (
            <>
              {currentPlan === "free" && trialDaysLeft > 0 && (
                <div className="rounded-lg bg-accent/10 border border-accent/20 px-3 py-2 text-center">
                  <p className="text-[11px] font-semibold text-accent">
                    ⏱ {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
                  </p>
                  <p className="text-[9px] text-muted-foreground">Período de teste gratuito</p>
                </div>
              )}
              {currentPlan === "free" && trialDaysLeft <= 0 && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-center">
                  <p className="text-[11px] font-semibold text-destructive">
                    Teste expirado
                  </p>
                  <p className="text-[9px] text-muted-foreground">Assine para continuar</p>
                </div>
              )}
              <Link
                to="/planos"
                className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 hover:bg-primary/10 transition-colors group"
              >
                <Crown className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-sidebar-accent-foreground">
                    {currentPlan === "free" ? "Upgrade Vitalício" : "Vitalício"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentPlan === "free" ? "Desbloquear Vitalício" : "Plano Vitalício Ativo"}
                  </p>
                </div>
              </Link>
            </>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
