import { Profile, AppRole } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, CheckCircle2, Eye, Loader2, UserCog } from "lucide-react";

interface UserRowProps {
  profile: Profile;
  role: string;
  isUpdating: boolean;
  onUpdatePlan: (userId: string, plan: string) => void;
  onUpdateRole: (userId: string, role: string) => void;
  onToggleBlock: (userId: string, blocked: boolean) => void;
  onViewDetails: (profile: Profile) => void;
  planLabels: Record<string, string>;
  planColors: Record<string, string>;
  roleLabels: Record<string, string>;
  roleColors: Record<string, string>;
}

export function UserRow({
  profile,
  role,
  isUpdating,
  onUpdatePlan,
  onUpdateRole,
  onToggleBlock,
  onViewDetails,
  planLabels,
  planColors,
  roleLabels,
  roleColors,
}: UserRowProps) {
  return (
    <TableRow key={profile.id} className="hover:bg-muted/30 transition-colors">
      <TableCell className="font-medium">
        <div className="flex flex-col">
          <span className="text-sm font-semibold truncate max-w-[150px]">{profile.full_name || "Sem nome"}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{profile.email}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={planColors[profile.plan] || "bg-muted"}>
          {planLabels[profile.plan] || profile.plan}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={roleColors[role] || "bg-muted"}>
          {roleLabels[role] || role}
        </Badge>
      </TableCell>
      <TableCell>
        {profile.blocked ? (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <Ban className="w-3 h-3" /> Bloqueado
          </Badge>
        ) : (
          <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/5 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Ativo
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onViewDetails(profile)} className="h-8 w-8">
            <Eye className="w-4 h-4" />
          </Button>
          <Select
            disabled={isUpdating}
            onValueChange={(val) => onUpdatePlan(profile.id, val)}
            defaultValue={profile.plan}
          >
            <SelectTrigger className="w-[100px] h-8 text-[10px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Gratuito</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="professional">Profissional</SelectItem>
              <SelectItem value="lifetime">Vitalício</SelectItem>
            </SelectContent>
          </Select>
          <Select
            disabled={isUpdating}
            onValueChange={(val) => onUpdateRole(profile.id, val)}
            defaultValue={role}
          >
            <SelectTrigger className="w-[100px] h-8 text-[10px]">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Usuário</SelectItem>
              <SelectItem value="moderator">Moderador</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            disabled={isUpdating}
            onClick={() => onToggleBlock(profile.id, profile.blocked)}
            className={`h-8 w-8 ${profile.blocked ? "text-green-500" : "text-destructive"}`}
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
