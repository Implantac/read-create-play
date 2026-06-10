import { useAuth, PlanType } from "@/contexts/AuthContext";
import { Feature, PLAN_HIERARCHY, FEATURE_MIN_PLAN, PLAN_LIMITS } from "@/features/auth/constants";

export type { Feature };
export { PLAN_LIMITS } from "@/features/auth/constants";


export function usePlanAccess() {
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const currentPlan: PlanType = (isAdmin || isSuperAdmin) ? "lifetime" : (profile?.plan ?? "free");

  const hasAccess = (feature: Feature): boolean => {
    if (isAdmin || isSuperAdmin) return true;
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[FEATURE_MIN_PLAN[feature]];
  };

  const getMinPlan = (feature: Feature): PlanType => FEATURE_MIN_PLAN[feature];

  const getLimits = () => PLAN_LIMITS[currentPlan];

  return { currentPlan, hasAccess, getMinPlan, getLimits, isAdmin, isSuperAdmin };
}

