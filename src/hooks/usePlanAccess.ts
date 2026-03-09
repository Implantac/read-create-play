import { useAuth, PlanType } from "@/contexts/AuthContext";

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  premium: 1,
  professional: 2,
  lifetime: 3,
};

export type Feature =
  | "dashboard"
  | "gerador_basico"
  | "gerador_profissional"
  | "fechamentos"
  | "conferidor"
  | "estrategias_ml"
  | "estrategias_hp"
  | "estrategias_analytics"
  | "otimizacao"
  | "simulacoes"
  | "historico"
  | "export_pdf";

const FEATURE_MIN_PLAN: Record<Feature, PlanType> = {
  dashboard: "free",
  gerador_basico: "free",
  historico: "free",
  conferidor: "free",
  gerador_profissional: "premium",
  fechamentos: "premium",
  simulacoes: "premium",
  export_pdf: "premium",
  estrategias_ml: "professional",
  estrategias_hp: "professional",
  estrategias_analytics: "professional",
  otimizacao: "professional",
};

export function usePlanAccess() {
  const { profile } = useAuth();
  const currentPlan: PlanType = profile?.plan ?? "free";

  const hasAccess = (feature: Feature): boolean => {
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[FEATURE_MIN_PLAN[feature]];
  };

  const getMinPlan = (feature: Feature): PlanType => FEATURE_MIN_PLAN[feature];

  return { currentPlan, hasAccess, getMinPlan };
}
