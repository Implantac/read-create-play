import { useAuth, PlanType } from "@/contexts/AuthContext";

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  lifetime: 1,
  // Keep others for backward compatibility if needed, but treat as lifetime
  premium: 1,
  professional: 1,
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
  gerador_avancado: "lifetime",
  gerador_profissional: "lifetime",
  fechamentos: "lifetime",
  simulacoes: "lifetime",
  simulacoes_avancadas: "lifetime",
  export_pdf: "lifetime",
  estrategias_basicas: "lifetime",
  roi_dashboard: "lifetime",
  ia_autonoma: "lifetime",
  ai_analyst: "lifetime",
  estrategias_ml: "lifetime",
  estrategias_hp: "lifetime",
  estrategias_analytics: "lifetime",
  otimizacao: "lifetime",
};

export const PLAN_LIMITS = {
  free: { savedBetsPerLottery: 3 },
  premium: { savedBetsPerLottery: Infinity },
  professional: { savedBetsPerLottery: Infinity },
  lifetime: { savedBetsPerLottery: Infinity },
} as const;

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
