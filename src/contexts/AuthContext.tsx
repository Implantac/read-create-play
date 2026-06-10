import { createContext, useContext } from "react";
import { AuthState } from "@/features/auth/types";

export type { PlanType, Profile } from "@/features/auth/types";

export interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}


