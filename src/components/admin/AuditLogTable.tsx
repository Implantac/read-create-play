import { AuditLog } from "@/types/database";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLogTableProps {
  logs: AuditLog[];
  getAdminEmail: (id: string) => string;
  getTargetEmail: (id: string | null) => string;
}

export function AuditLogTable({ logs, getAdminEmail, getTargetEmail }: AuditLogTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Admin</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Alvo</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium text-xs truncate max-w-[150px]">
                {getAdminEmail(log.admin_id)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell className="text-xs truncate max-w-[150px]">
                {getTargetEmail(log.target_user_id)}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
