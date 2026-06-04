import { supabase } from "@/integrations/supabase/client";
import { AuditLog } from "@/types/database";

export const adminService = {
  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  },

  async createAuditLog(log: Omit<AuditLog, "id" | "created_at">) {
    const { error } = await supabase
      .from("admin_audit_logs")
      .insert(log);
    
    if (error) throw error;
  },

  async updateUserPlan(userId: string, plan: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ plan })
      .eq("id", userId);
    
    if (error) throw error;
  },

  async setUserBlockStatus(userId: string, blocked: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ blocked })
      .eq("id", userId);
    
    if (error) throw error;
  }
};
