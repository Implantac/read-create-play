import { useAuth } from "@/contexts/AuthContext";

export function useAdminCheck() {
  const { isAdmin, isSuperAdmin, loading } = useAuth();
  return { isAdmin, isSuperAdmin, loading };
}

