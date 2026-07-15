import { supabase } from "@/integrations/supabase/client";
import { isCheckSubscriptionResponse, type CheckSubscriptionResponse } from "@/core/contracts";

export async function checkAdminStatus(userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"]);

  const roles = (data || []).map((r: { role: string }) => r.role);

  return {
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
    isSuperAdmin: roles.includes("super_admin"),
    roles
  };
}

export async function syncSubscriptionPlan(accessToken: string): Promise<CheckSubscriptionResponse | null> {
  const { data } = await supabase.functions.invoke("check-subscription", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return isCheckSubscriptionResponse(data) ? data : null;
}
