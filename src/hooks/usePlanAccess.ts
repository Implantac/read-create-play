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
  | "gerador_avancado"
  | "fechamentos"
  | "conferidor"
  | "estrategias_basicas"
  | "estrategias_ml"
  | "estrategias_hp"
  | "estrategias_analytics"
  | "otimizacao"
  | "simulacoes"
  | "simulacoes_avancadas"
  | "historico"
  | "export_pdf"
  | "ia_autonoma"
  | "ai_analyst"
  | "roi_dashboard";

const FEATURE_MIN_PLAN: Record<Feature, PlanType> = {
  dashboard: "free",
  gerador_basico: "free",
  historico: "free",
  conferidor: "free",
  gerador_avancado: "premium",
  gerador_profissional: "premium",
  fechamentos: "premium",
  simulacoes: "premium",
  simulacoes_avancadas: "premium",
  export_pdf: "premium",
  estrategias_basicas: "premium",
  roi_dashboard: "premium",
  ia_autonoma: "professional",
  ai_analyst: "professional",
  estrategias_ml: "professional",
  estrategias_hp: "professional",
  estrategias_analytics: "professional",
  otimizacao: "professional",
};

export const PLAN_LIMITS = {
  free: { savedBetsPerLottery: 3 },
  premium: { savedBetsPerLottery: Infinity },
  professional: { savedBetsPerLottery: Infinity },
  lifetime: { savedBetsPerLottery: Infinity },
} as const;

export function usePlanAccess() {
  const { profile, isAdmin } = useAuth();
  const currentPlan: PlanType = isAdmin ? "lifetime" : (profile?.plan ?? "free");

  const hasAccess = (feature: Feature): boolean => {
    if (isAdmin) return true;
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[FEATURE_MIN_PLAN[feature]];
  };

  const getMinPlan = (feature: Feature): PlanType => FEATURE_MIN_PLAN[feature];

  const getLimits = () => PLAN_LIMITS[currentPlan];

  return { currentPlan, hasAccess, getMinPlan, getLimits };
}
