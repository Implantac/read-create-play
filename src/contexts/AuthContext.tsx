import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type PlanType = "free" | "premium" | "professional" | "lifetime";

interface Profile {
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

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data as Profile);
    }
  };

  const syncSubscription = async (accessToken: string) => {
    try {
      const { data } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (data?.plan) {
        setProfile(prev => prev ? { ...prev, plan: data.plan as PlanType } : prev);
      }
    } catch (e) {
      console.error("Error checking subscription:", e);
    }
  };

  useEffect(() => {
    const authStorageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          const message = error.message.toLowerCase();
          const isInvalidRefreshToken =
            message.includes("invalid refresh token") ||
            message.includes("refresh token not found");

          if (isInvalidRefreshToken) {
            localStorage.removeItem(authStorageKey);
          }

          setSession(null);
          setProfile(null);
          return;
        }

        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
          syncSubscription(session.access_token);
        }
      })
      .catch(() => {
        localStorage.removeItem(authStorageKey);
        setSession(null);
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const TRIAL_DAYS = 7;

  const trialDaysLeft = (() => {
    if (!profile?.created_at || profile.plan !== "free") return TRIAL_DAYS;
    const created = new Date(profile.created_at).getTime();
    const now = Date.now();
    const elapsed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    return Math.max(0, TRIAL_DAYS - elapsed);
  })();

  const isTrialExpired = profile?.plan === "free" && trialDaysLeft <= 0;

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, isTrialExpired, trialDaysLeft, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
