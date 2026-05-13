import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users, Crown, TrendingUp, Search, Shield, Loader2, RefreshCw, Ban, CheckCircle2,
  ShieldCheck, AlertTriangle, History, UserCog, Eye, Zap, Database, Activity, Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  created_at: string;
  blocked: boolean;
  phone_number: string | null;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: any;
  created_at: string;
}

const OWNER_EMAIL = "etcsuporte889@gmail.com";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  lifetime: "bg-yellow-500/20 text-yellow-400",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  lifetime: "Vitalício",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderador",
  user: "Usuário",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  moderator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  user: "bg-muted text-muted-foreground border-border",
};

const ACTION_LABELS: Record<string, string> = {
  plan_changed: "Plano alterado",
  role_changed: "Papel alterado",
  user_blocked: "Usuário bloqueado",
  user_unblocked: "Usuário desbloqueado",
};

export default function AdminPage() {
  const { user, isSuperAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [drawCount, setDrawCount] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  const [detailUser, setDetailUser] = useState<Profile | null>(null);
  const { toast } = useToast();

  const isOwner = (email?: string | null) => email?.trim().toLowerCase() === OWNER_EMAIL;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [profilesRes, drawsRes, rolesRes, logsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("lottery_draws").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("*"),
      supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (drawsRes.count !== null) setDrawCount(drawsRes.count);
    if (rolesRes.data) setRoles(rolesRes.data as UserRole[]);
    if (logsRes.data) setAuditLogs(logsRes.data as AuditLog[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getUserRole = (userId: string): string => {
    const r = roles.find(r => r.user_id === userId);
    return r?.role || "user";
  };

  const logAction = async (action: string, targetUserId: string | null, details: any = {}) => {
    if (!user) return;
    await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      action,
      target_user_id: targetUserId,
      details,
    } as any);
  };

  const isSelfLockRisk = (targetUserId: string, newRole?: string): boolean => {
    if (targetUserId !== user?.id) return false;
    if (newRole && newRole !== "super_admin" && newRole !== "admin") return true;
    return false;
  };

  const countSuperAdmins = (): number => roles.filter(r => r.role === "super_admin").length;

  const updatePlan = async (userId: string, newPlan: string) => {
    const profile = profiles.find(p => p.id === userId);
    if (isOwner(profile?.email)) {
      toast({ title: "Ação Bloqueada", description: "O plano do proprietário é vitalício e não pode ser alterado.", variant: "destructive" });
      return;
    }
    setUpdating(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ plan: newPlan, updated_at: new Date().toISOString() } as any)
      .eq("id", userId);
    setUpdating(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await logAction("plan_changed", userId, { old_plan: profile?.plan, new_plan: newPlan });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, plan: newPlan } : p));
      toast({ title: "Plano atualizado", description: `Plano alterado para ${PLAN_LABELS[newPlan]}.` });
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    const profile = profiles.find(p => p.id === userId);
    if (isOwner(profile?.email) && newRole !== "super_admin") {
      toast({ title: "Ação Bloqueada", description: "O papel do proprietário não pode ser rebaixado.", variant: "destructive" });
      return;
    }
    const currentRole = getUserRole(userId);

    if (isSelfLockRisk(userId, newRole)) {
      setConfirmDialog({
        open: true,
        title: "⚠️ Ação Perigosa",
        description: "Você está prestes a remover seus próprios privilégios administrativos. Isso pode impedir seu acesso ao painel. Tem certeza?",
        onConfirm: () => executeRoleUpdate(userId, newRole, currentRole),
      });
      return;
    }

    if (currentRole === "super_admin" && newRole !== "super_admin" && countSuperAdmins() <= 1) {
      toast({ title: "Ação Bloqueada", description: "Não é possível remover o último Super Admin do sistema.", variant: "destructive" });
      return;
    }

    await executeRoleUpdate(userId, newRole, currentRole);
  };

  const executeRoleUpdate = async (userId: string, newRole: string, oldRole: string) => {
    setUpdating(userId);
    setConfirmDialog(prev => ({ ...prev, open: false }));

    const existingRole = roles.find(r => r.user_id === userId);

    let error;
    if (newRole === "user") {
      if (existingRole) {
        const res = await supabase.from("user_roles").delete().eq("user_id", userId);
        error = res.error;
      }
    } else if (existingRole) {
      const res = await supabase.from("user_roles").update({ role: newRole } as any).eq("user_id", userId);
      error = res.error;
    } else {
      const res = await supabase.from("user_roles").insert({ user_id: userId, role: newRole } as any);
      error = res.error;
    }

    setUpdating(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await logAction("role_changed", userId, { old_role: oldRole, new_role: newRole });
      if (newRole === "user") {
        setRoles(prev => prev.filter(r => r.user_id !== userId));
      } else if (existingRole) {
        setRoles(prev => prev.map(r => r.user_id === userId ? { ...r, role: newRole } : r));
      } else {
        setRoles(prev => [...prev, { user_id: userId, role: newRole }]);
      }
      toast({ title: "Papel atualizado", description: `Papel alterado para ${ROLE_LABELS[newRole]}.` });
    }
  };

  const toggleBlock = async (userId: string, currentBlocked: boolean) => {
    const profile = profiles.find(p => p.id === userId);
    if (isOwner(profile?.email)) {
      toast({ title: "Ação Bloqueada", description: "O proprietário do sistema não pode ser bloqueado.", variant: "destructive" });
      return;
    }
    const role = getUserRole(userId);
    if (role === "super_admin") {
      toast({ title: "Ação Bloqueada", description: "Não é possível bloquear um Super Admin.", variant: "destructive" });
      return;
    }
    if (userId === user?.id) {
      toast({ title: "Ação Bloqueada", description: "Você não pode bloquear a si mesmo.", variant: "destructive" });
      return;
    }

    setUpdating(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ blocked: !currentBlocked, updated_at: new Date().toISOString() } as any)
      .eq("id", userId);
    setUpdating(null);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await logAction(currentBlocked ? "user_unblocked" : "user_blocked", userId);
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, blocked: !currentBlocked } : p));
      toast({
        title: !currentBlocked ? "Usuário bloqueado" : "Usuário desbloqueado",
        description: !currentBlocked ? "O usuário não poderá mais acessar o sistema." : "O acesso do usuário foi restaurado.",
      });
    }
  };

  // Filters
  const filtered = profiles.filter(p => {
    const matchesSearch = (p.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.full_name?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesPlan = filterPlan === "all" || p.plan === filterPlan;
    const matchesRole = filterRole === "all" || getUserRole(p.id) === filterRole;
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && !p.blocked) ||
      (filterStatus === "blocked" && p.blocked);
    return matchesSearch && matchesPlan && matchesRole && matchesStatus;
  });

  // Sort: owner first, then super_admins, then admins, then by date
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (isOwner(a.email)) return -1;
    if (isOwner(b.email)) return 1;
    const roleA = getUserRole(a.id);
    const roleB = getUserRole(b.id);
    const order: Record<string, number> = { super_admin: 0, admin: 1, moderator: 2, user: 3 };
    return (order[roleA] ?? 3) - (order[roleB] ?? 3);
  });

  const planCounts = profiles.reduce((acc, p) => {
    acc[p.plan] = (acc[p.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const blockedCount = profiles.filter(p => p.blocked).length;
  const adminCount = roles.filter(r => r.role === "admin" || r.role === "super_admin").length;

  const stats = [
    { label: "Total Usuários", value: profiles.length, icon: Users, color: "text-primary" },
    { label: "Administradores", value: adminCount, icon: Shield, color: "text-amber-400" },
    { label: "Bloqueados", value: blockedCount, icon: Ban, color: "text-destructive" },
    { label: "Sorteios no BD", value: drawCount, icon: Database, color: "text-primary" },
  ];

  const getAdminEmail = (adminId: string) => profiles.find(p => p.id === adminId)?.email || adminId.slice(0, 8);
  const getTargetEmail = (targetId: string | null) => {
    if (!targetId) return "—";
    return profiles.find(p => p.id === targetId)?.email || targetId.slice(0, 8);
  };

  const ownerProfile = profiles.find(p => isOwner(p.email));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Painel de Controle
            {isSuperAdmin && (
              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase animate-pulse">
                GOD MODE
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">Central de administração e gerenciamento do sistema</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Owner God Mode Card */}
      {ownerProfile && isSuperAdmin && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-yellow-500/5 to-orange-500/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
            <CardContent className="p-5 relative">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                  <Crown className="w-7 h-7 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-foreground">{ownerProfile.full_name || "Proprietário"}</h2>
                    <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] uppercase font-bold tracking-wider">
                      <Star className="w-3 h-3 mr-1" /> Proprietário
                    </Badge>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[9px] uppercase font-bold">
                      Vitalício
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ownerProfile.email}</p>
                  <p className="text-[11px] text-amber-400/70 mt-1 font-mono">
                    Acesso absoluto • Nível Deus • Controle total irrestrito
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-center px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-muted-foreground">Papel</p>
                    <p className="text-sm font-bold text-amber-400">Super Admin</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-muted-foreground">Plano</p>
                    <p className="text-sm font-bold text-yellow-400">♾ Vitalício</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-bold text-green-400">Soberano</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="bg-card/60 border-border/50 hover:border-primary/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold font-mono text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="users" className="gap-1.5"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5"><ShieldCheck className="w-4 h-4" /> Papéis</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><History className="w-4 h-4" /> Auditoria</TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users">
          {/* Plan distribution */}
          <Card className="bg-card/60 border-border/50 mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-0.5 h-7 rounded-full overflow-hidden bg-muted">
                {["free", "lifetime"].map(plan => {
                  const count = (plan === "lifetime") 
                    ? (planCounts["lifetime"] || 0) + (planCounts["premium"] || 0) + (planCounts["professional"] || 0)
                    : planCounts[plan] || 0;
                  const pct = profiles.length > 0 ? (count / profiles.length) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={plan}
                      className={`h-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        plan === "free" ? "bg-muted-foreground/30 text-foreground" :
                        "bg-amber-500 text-amber-950"
                      }`}
                      style={{ width: `${pct}%` }}
                      title={`${PLAN_LABELS[plan]}: ${count} (${Math.round(pct)}%)`}
                    >
                      {pct > 12 ? `${PLAN_LABELS[plan]} ${count}` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-4 mt-2">
                {["free", "lifetime"].map(plan => {
                  const count = (plan === "lifetime") 
                    ? (planCounts["lifetime"] || 0) + (planCounts["premium"] || 0) + (planCounts["professional"] || 0)
                    : planCounts[plan] || 0;
                  return (
                    <div key={plan} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${
                        plan === "free" ? "bg-muted-foreground/50" : "bg-amber-500"
                      }`} />
                      {PLAN_LABELS[plan]}: {count}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* User table */}
          <Card className="bg-card/60 border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Gerenciamento de Usuários</CardTitle>
                  <CardDescription>{sortedFiltered.length} de {profiles.length} usuários</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-52">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
                  </div>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Plano" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos planos</SelectItem>
                      <SelectItem value="free">Gratuito</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                      <SelectItem value="premium" className="hidden">Legacy Premium</SelectItem>
                      <SelectItem value="professional" className="hidden">Legacy Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Papel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos papéis</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="user">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="blocked">Bloqueados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedFiltered.map(p => {
                        const role = getUserRole(p.id);
                        const isSelf = p.id === user?.id;
                        const isOwnerRow = isOwner(p.email);
                        return (
                          <TableRow
                            key={p.id}
                            className={`
                              ${p.blocked ? "opacity-60" : ""}
                              ${isOwnerRow ? "bg-amber-500/5 border-l-2 border-l-amber-500/50" : ""}
                            `}
                          >
                            <TableCell className="font-medium text-foreground">
                              <div className="flex items-center gap-1.5">
                                {isOwnerRow && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                                {p.full_name || "—"}
                                {isSelf && <Badge variant="outline" className="text-[9px] px-1 py-0">Você</Badge>}
                                {isOwnerRow && <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] px-1 py-0">DONO</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">{p.email || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[role] || ROLE_COLORS.user}`}>
                                {isOwnerRow ? "👑 " : ""}{ROLE_LABELS[role] || role}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={PLAN_COLORS[p.plan] || ""}>
                                {PLAN_LABELS[p.plan] || p.plan}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {p.blocked ? (
                                <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" /> Bloqueado</Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 text-green-500 border-green-500/30">
                                  <CheckCircle2 className="w-3 h-3" /> {isOwnerRow ? "Soberano" : "Ativo"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm font-mono">
                              {new Date(p.created_at).toLocaleDateString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              {isOwnerRow ? (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px]">
                                    <Shield className="w-3 h-3 mr-1" /> Protegido
                                  </Badge>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDetailUser(p)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {isSuperAdmin && (
                                    <Select value={role} onValueChange={(v) => updateRole(p.id, v)} disabled={updating === p.id}>
                                      <SelectTrigger className="w-[130px] h-8 text-xs">
                                        {updating === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="super_admin">Super Admin</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="moderator">Moderador</SelectItem>
                                        <SelectItem value="user">Usuário</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <Select value={p.plan} onValueChange={(v) => updatePlan(p.id, v)} disabled={updating === p.id}>
                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                      {updating === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="free">Gratuito</SelectItem>
                                      <SelectItem value="lifetime">Vitalício</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant={p.blocked ? "outline" : "destructive"}
                                    size="sm"
                                    className="h-8 text-xs gap-1"
                                    onClick={() => toggleBlock(p.id, p.blocked)}
                                    disabled={updating === p.id || role === "super_admin"}
                                  >
                                    {p.blocked ? (
                                      <><CheckCircle2 className="w-3 h-3" /> Desbloquear</>
                                    ) : (
                                      <><Ban className="w-3 h-3" /> Bloquear</>
                                    )}
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDetailUser(p)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {sortedFiltered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nenhum usuário encontrado.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROLES TAB */}
        <TabsContent value="roles">
          <Card className="bg-card/60 border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Hierarquia de Papéis (RBAC)
              </CardTitle>
              <CardDescription>Sistema de controle de acesso baseado em papéis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { role: "super_admin", desc: "Acesso absoluto e irrestrito. Gerencia todos os usuários, papéis, planos e configurações. Nunca é limitado pelo plano comercial. O proprietário do sistema possui este nível permanentemente.", icon: "👑", count: roles.filter(r => r.role === "super_admin").length },
                  { role: "admin", desc: "Acesso administrativo amplo. Pode gerenciar usuários e visualizar métricas. Limitado por definições do Super Admin.", icon: "🛡️", count: roles.filter(r => r.role === "admin").length },
                  { role: "moderator", desc: "Acesso gerencial. Pode visualizar dados e moderar conteúdo. Sem acesso a configurações críticas.", icon: "⚙️", count: roles.filter(r => r.role === "moderator").length },
                  { role: "user", desc: "Acesso padrão controlado pelo plano comercial (Gratuito ou Vitalício).", icon: "👤", count: profiles.length - roles.length },
                ].map(item => (
                  <Card key={item.role} className={`border-border/30 ${item.role === "super_admin" ? "bg-amber-500/5 border-amber-500/20" : "bg-card/40"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={ROLE_COLORS[item.role]}>
                              {ROLE_LABELS[item.role]}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">{item.count} usuário(s)</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Precedência de Acesso</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong className="text-amber-400">Proprietário (GOD)</strong> → Super Admin → Admin → Moderador → Plano Comercial → Usuário Padrão.
                      <br />
                      O papel administrativo <strong>sempre</strong> tem prioridade sobre o plano comercial.
                      O proprietário ({OWNER_EMAIL}) possui acesso soberano e permanente que não pode ser removido.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT TAB */}
        <TabsContent value="audit">
          <Card className="bg-card/60 border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Log de Auditoria
              </CardTitle>
              <CardDescription>Últimas 100 ações administrativas</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum registro de auditoria encontrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Alvo</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1">
                              {isOwner(getAdminEmail(log.admin_id)) && <Crown className="w-3 h-3 text-amber-400" />}
                              {getAdminEmail(log.admin_id)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {getTargetEmail(log.target_user_id)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono max-w-[200px] truncate">
                            {log.details ? JSON.stringify(log.details) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => setConfirmDialog(prev => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDialog.onConfirm}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Detalhes do Usuário
              {detailUser && isOwner(detailUser.email) && (
                <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px]">PROPRIETÁRIO</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{detailUser.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{detailUser.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{detailUser.phone_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Papel</p>
                  <Badge variant="outline" className={ROLE_COLORS[getUserRole(detailUser.id)]}>
                    {isOwner(detailUser.email) ? "👑 " : ""}{ROLE_LABELS[getUserRole(detailUser.id)]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plano</p>
                  <Badge className={PLAN_COLORS[isOwner(detailUser.email) ? "lifetime" : detailUser.plan]}>
                    {isOwner(detailUser.email) ? "♾ Vitalício" : PLAN_LABELS[detailUser.plan]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={detailUser.blocked ? "destructive" : "outline"} className={detailUser.blocked ? "" : "text-green-500 border-green-500/30"}>
                    {detailUser.blocked ? "Bloqueado" : isOwner(detailUser.email) ? "Soberano" : "Ativo"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cadastro</p>
                  <p className="font-mono text-xs">{new Date(detailUser.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="font-mono text-[10px] break-all">{detailUser.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
