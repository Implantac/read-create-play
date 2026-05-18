import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FULL_ACCESS_USER_EMAIL = "etcsuporte889@gmail.com";

export function useAdminCheck() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    if (user.email?.trim().toLowerCase() === FULL_ACCESS_USER_EMAIL) {
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin"]);
      const roles = (data || []).map((r: any) => r.role as string);
      setIsAdmin(roles.includes("admin") || roles.includes("super_admin"));
      setIsSuperAdmin(roles.includes("super_admin"));
      setLoading(false);
    };

    check();
  }, [user]);

  return { isAdmin, isSuperAdmin, loading };
}
