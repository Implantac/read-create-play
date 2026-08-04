import { useEffect, useState, ReactNode, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type AuthContextType, type PlanType, type Profile } from "./AuthContext";
import { isFullAccessEmail } from "@/core/fullAccess";
import { AuthService } from "@/services/auth/auth.service";
import { checkAdminStatus, syncSubscriptionPlan } from "@/features/auth/services/auth-queries";

const TRIAL_DAYS = 7;

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

  const fetchProfile = useCallback(async (userId: string, email?: string | null) => {
    try {
      const data = await AuthService.getProfile(userId);
      if (data) {
        setProfile(
          isFullAccessEmail(email)
            ? asFullAccessProfile(data as Profile)
            : (data as Profile)
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, []);

  const checkAdmin = useCallback(async (userId: string, email?: string | null) => {
    if (isFullAccessEmail(email)) {
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setUserRole("super_admin");
      return;
    }

    try {
      const { isAdmin: admin, isSuperAdmin: superAdmin, roles } = await checkAdminStatus(userId);
      setIsAdmin(admin);
      setIsSuperAdmin(superAdmin);
      setUserRole(superAdmin ? "super_admin" : admin ? "admin" : roles[0] || "user");
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }, []);

  const syncSubscription = useCallback(async (accessToken: string) => {
    try {
      const data = await syncSubscriptionPlan(accessToken);
      if (data?.plan) {
        setProfile((prev) => {
          if (!prev) return prev;
          return isFullAccessEmail(prev.email)
            ? asFullAccessProfile(prev)
            : { ...prev, plan: data.plan as PlanType };
        });
      }
    } catch (e) {
      console.error("Error checking subscription:", e);
    }
  }, []);

  const loadUserData = useCallback(async (userId: string, accessToken?: string, email?: string | null) => {
    await Promise.all([
      fetchProfile(userId, email),
      checkAdmin(userId, email),
      ...(accessToken ? [syncSubscription(accessToken)] : []),
    ]);
  }, [fetchProfile, checkAdmin, syncSubscription]);

  useEffect(() => {
    const authStorageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
    let initialLoad = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        console.log(`[Auth] State change: ${event}`);
        setSession(nextSession);
        
        if (nextSession?.user) {
          try {
            await loadUserData(nextSession.user.id, undefined, nextSession.user.email);
          } catch (err) {
            console.error("[Auth] Error loading user data:", err);
          }
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setUserRole("user");
        }
        
        // Critical: Ensure loading is cleared even if event is initial
        setLoading(false);
        initialLoad = false;
      }
    );

    supabase.auth
      .getSession()
      .then(async ({ data: { session: nextSession }, error }) => {
        if (error) {
          console.error("[Auth] Initial session fetch error:", error);
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

        if (nextSession?.user) {
          console.log("[Auth] Found initial session for user:", nextSession.user.id);
          setSession(nextSession);
          await loadUserData(nextSession.user.id, nextSession.access_token, nextSession.user.email);
        } else {
          console.log("[Auth] No initial session found");
        }
      })
      .catch((err) => {
        console.error("[Auth] Fatal session fetch error:", err);
        localStorage.removeItem(authStorageKey);
        setSession(null);
        setProfile(null);
      })
      .finally(() => {
        initialLoad = false;
        setLoading(false);
        console.log("[Auth] Initial auth flow complete");
      });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signOut = async () => {
    await AuthService.signOut();
    setSession(null);
    setProfile(null);
  };

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


