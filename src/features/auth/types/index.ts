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

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: string;
  isTrialExpired: boolean;
  trialDaysLeft: number;
}
