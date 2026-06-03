import { useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AuthContextType, type PlanType, type Profile } from "./AuthContext";
import { isFullAccessEmail } from "@/core/fullAccess";

const asFullAccessProfile = (profile: Profile): Profile => ({
  ...profile,
  plan: "lifetime",
  blocked: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("user");

  const fetchProfile = async (userId: string, email?: string | null) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(
        isFullAccessEmail(email)
          ? asFullAccessProfile(data as Profile)
          : (data as Profile)
      );
    }
  };

  const checkAdmin = async (userId: string, email?: string | null) => {
    if (isFullAccessEmail(email)) {
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setUserRole("super_admin");
      return;
    }

    // Privileged status is sourced exclusively from the user_roles table.
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"]);

    const roles = (data || []).map((r: { role: string }) => r.role);

    setIsAdmin(roles.includes("admin") || roles.includes("super_admin"));
    setIsSuperAdmin(roles.includes("super_admin"));
    setUserRole(
      roles.includes("super_admin")
        ? "super_admin"
        : roles.includes("admin")
          ? "admin"
          : roles[0] || "user"
    );
  };

  const syncSubscription = async (accessToken: string) => {
    try {
      const { data } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (data?.plan) {
        setProfile((prev) => {
          if (!prev) return prev;
          return isFullAccessEmail(prev.email)
            ? asFullAccessProfile(prev)
            : { ...prev, plan: data.plan as PlanType };
        });
      }
    } catch (e) {
      // Keep behavior (no breaking UI): log and continue.
      console.error("Error checking subscription:", e);
    }
  };

  useEffect(() => {
    const authStorageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
    let initialLoad = true;

    const loadUserData = async (userId: string, accessToken?: string, email?: string | null) => {
      await Promise.all([
        fetchProfile(userId, email),
        checkAdmin(userId, email),
        ...(accessToken ? [syncSubscription(accessToken)] : []),
      ]);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          if (!initialLoad) {
            await loadUserData(nextSession.user.id, undefined, nextSession.user.email);
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

    supabase.auth
      .getSession()
      .then(async ({ data: { session: nextSession }, error }) => {
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

        setSession(nextSession);
        if (nextSession?.user) {
          await loadUserData(nextSession.user.id, nextSession.access_token, nextSession.user.email);
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

  const isTrialExpired =
    !isFullAccessEmail(session?.user.email) &&
    !isAdmin &&
    !isSuperAdmin &&
    profile?.plan === "free" &&
    trialDaysLeft <= 0;

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAdmin,
    isSuperAdmin,
    userRole,
    isTrialExpired,
    trialDaysLeft,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

