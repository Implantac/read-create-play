import { Database } from "@/integrations/supabase/types";

export type PlanType = "free" | "premium" | "professional" | "lifetime";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type AuditLog = Database["public"]["Tables"]["admin_audit_logs"]["Row"];
export type SavedBet = Database["public"]["Tables"]["saved_bets"]["Row"];
export type LotteryDraw = Database["public"]["Tables"]["lottery_draws"]["Row"];
export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];

export type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserWithRole extends Profile {
  user_roles?: {
    role: AppRole;
  }[];
}
