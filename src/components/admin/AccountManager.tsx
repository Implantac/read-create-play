import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Profile } from "@/types/database";
import { KeyRound, Loader2, Trash2, UserPlus, Copy, Search } from "lucide-react";

interface AccountManagerProps {
  profiles: Profile[];
  onChanged: () => void;
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function callAdminUsers(payload: Record<string, unknown>) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body: payload,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (error) {
    const message = (data as { error?: string } | null)?.error || error.message;
    throw new Error(message);
  }
  if (data && (data as { error?: string }).error) throw new Error((data as { error: string }).error);
  return data;
}

export function AccountManager({ profiles, onChanged }: AccountManagerProps) {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(randomPassword());
  const [plan, setPlan] = useState("lifetime");
  const [role, setRole] = useState("user");
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: "Copiado", description: "Senha copiada para a área de transferência." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const createUser = async () => {
    setCreating(true);
    try {
      await callAdminUsers({
        action: "create",
        email,
        password,
        full_name: fullName,
        phone_number: phone || null,
        plan,
        role,
      });
      toast({
        title: "Conta criada",
        description: `${email} já pode acessar com a senha definida.`,
      });
      setEmail("");
      setFullName("");
      setPhone("");
      setPassword(randomPassword());
      onChanged();
    } catch (e) {
      toast({ title: "Erro ao criar conta", description: (e as Error).message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    setBusy(true);
    try {
      await callAdminUsers({ action: "reset_password", user_id: resetTarget.id, password: newPassword });
      toast({ title: "Senha atualizada", description: `Nova senha definida para ${resetTarget.email}.` });
      setResetTarget(null);
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await callAdminUsers({ action: "delete", user_id: deleteTarget.id });
      toast({ title: "Conta excluída", description: `${deleteTarget.email} foi removido.` });
      setDeleteTarget(null);
      onChanged();
    } catch (e) {
      toast({ title: "Erro", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const filtered = profiles.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (p.email || "").toLowerCase().includes(q) || (p.full_name || "").toLowerCase().includes(q);
  }).slice(0, 30);

  return (
    <div className="space-y-6">
      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Cadastrar novo usuário
          </CardTitle>
          <CardDescription>
            A conta é criada já confirmada — o usuário entra direto com o e-mail e a senha definidos aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="acc-email">E-mail</Label>
              <Input id="acc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-name">Nome completo</Label>
              <Input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome do usuário" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-phone">Telefone (opcional)</Label>
              <Input id="acc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-pass">Senha</Label>
              <div className="flex gap-2">
                <Input id="acc-pass" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="font-mono" />
                <Button type="button" variant="outline" size="icon" onClick={() => setPassword(randomPassword())} title="Gerar senha">
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={() => copy(password)} title="Copiar senha">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">Vitalício</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="free">Sem acesso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={createUser} disabled={creating || !email || password.length < 8} className="gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Criar conta
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Contas existentes</CardTitle>
              <CardDescription>Redefina senhas ou remova contas</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por e-mail ou nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 bg-card/40 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold break-words">{p.full_name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground break-words">{p.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { setResetTarget(p); setNewPassword(randomPassword()); }}
                >
                  <KeyRound className="w-3.5 h-3.5" /> Senha
                </Button>
                {isSuperAdmin && (
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(p)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma conta encontrada.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
            <DialogDescription>{resetTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="font-mono" />
            <Button variant="outline" size="icon" onClick={() => setNewPassword(randomPassword())}>
              <KeyRound className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => copy(newPassword)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>Cancelar</Button>
            <Button onClick={resetPassword} disabled={busy || newPassword.length < 8}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Salvar senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conta</DialogTitle>
            <DialogDescription>
              {deleteTarget?.email} perderá o acesso permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteUser} disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
