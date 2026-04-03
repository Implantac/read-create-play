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
  isSuperAdmin: boolean;
  userRole: string;
  isTrialExpired: boolean;
  trialDaysLeft: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LIFETIME_OWNER_EMAIL = "etcsuporte889@gmail.com";

const isLifetimeOwner = (email?: string | null) =>
  email?.trim().toLowerCase() === LIFETIME_OWNER_EMAIL;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");

  const fetchProfile = async (userId: string, forceLifetime = false) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      const p = data as Profile;
      if ((forceLifetime || isLifetimeOwner(p.email)) && p.plan !== "lifetime") {
        p.plan = "lifetime";
      }
      setProfile(p);
    }
  };

  const checkAdmin = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);
    const roles = (data || []).map((r: any) => r.role as string);
    const isSA = roles.includes("super_admin");
    setIsAdmin(roles.includes("admin") || isSA);
    setIsSuperAdmin(isSA);
    setUserRole(isSA ? "super_admin" : roles.includes("admin") ? "admin" : roles[0] || "user");
    return isSA;
  };

  const syncSubscription = async (accessToken: string) => {
    try {
      const { data } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // If token was expired, try refreshing session and retry
      if (data?.expired_token) {
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData?.session?.access_token) {
          const { data: retryData } = await supabase.functions.invoke("check-subscription", {
            headers: { Authorization: `Bearer ${refreshData.session.access_token}` },
          });
          if (retryData?.plan) {
            setProfile(prev => prev ? { ...prev, plan: retryData.plan as PlanType } : prev);
          }
          return;
        }
      }
      if (data?.plan) {
        setProfile(prev => prev ? { ...prev, plan: data.plan as PlanType } : prev);
      }
    } catch (e) {
      console.error("Error checking subscription:", e);
    }
  };

  useEffect(() => {
    const authStorageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
    let initialLoad = true;

    const loadUserData = async (userId: string, accessToken?: string, email?: string | null) => {
      const shouldForceLifetime = isLifetimeOwner(email);
      const isSA = await checkAdmin(userId);
      await Promise.all([
        fetchProfile(userId, isSA || shouldForceLifetime),
        ...(accessToken && !isSA && !shouldForceLifetime ? [syncSubscription(accessToken)] : []),
      ]);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          if (!initialLoad) {
            await loadUserData(session.user.id, undefined, session.user.email);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserRole("user");
        }
        if (!initialLoad) setLoading(false);
      }
    );

    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
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
          await loadUserData(session.user.id, session.access_token, session.user.email);
        }
      })
      .catch(() => {
        localStorage.removeItem(authStorageKey);
        setSession(null);
        setProfile(null);
      })
      .finally(() => {
        initialLoad = false;
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

  const isTrialExpired = !isAdmin && profile?.plan === "free" && trialDaysLeft <= 0;

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, isAdmin, isSuperAdmin, userRole, isTrialExpired, trialDaysLeft, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
