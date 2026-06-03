import { createContext, useContext } from "react";
import { Session, User } from "@supabase/supabase-js";

export type PlanType = "free" | "premium" | "professional" | "lifetime";


export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: PlanType;
  theme_preference: string;
  language: string;
  timezone: string;
  currency_format: string;
  blocked: boolean;
  created_at: string;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: string;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}

