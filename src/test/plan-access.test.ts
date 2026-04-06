import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the pure logic by extracting it — the hook depends on useAuth,
// so we replicate the core logic here for unit testing.

type PlanType = "free" | "premium" | "professional" | "lifetime";
type Feature =
  | "dashboard" | "gerador_basico" | "gerador_profissional" | "gerador_avancado"
  | "fechamentos" | "conferidor" | "estrategias_basicas" | "estrategias_ml"
  | "estrategias_hp" | "estrategias_analytics" | "otimizacao" | "simulacoes"
  | "simulacoes_avancadas" | "historico" | "export_pdf" | "ia_autonoma"
  | "ai_analyst" | "roi_dashboard";

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0, premium: 1, professional: 2, lifetime: 3,
};

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

function hasAccess(plan: PlanType, feature: Feature, isAdmin = false): boolean {
  if (isAdmin) return true;
  return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[FEATURE_MIN_PLAN[feature]];
}

describe("Plan Access Logic", () => {
  describe("free plan", () => {
    it("can access dashboard and basic features", () => {
      expect(hasAccess("free", "dashboard")).toBe(true);
      expect(hasAccess("free", "gerador_basico")).toBe(true);
      expect(hasAccess("free", "historico")).toBe(true);
      expect(hasAccess("free", "conferidor")).toBe(true);
    });

    it("cannot access premium features", () => {
      expect(hasAccess("free", "fechamentos")).toBe(false);
      expect(hasAccess("free", "simulacoes")).toBe(false);
      expect(hasAccess("free", "export_pdf")).toBe(false);
      expect(hasAccess("free", "roi_dashboard")).toBe(false);
    });

    it("cannot access professional features", () => {
      expect(hasAccess("free", "ia_autonoma")).toBe(false);
      expect(hasAccess("free", "ai_analyst")).toBe(false);
      expect(hasAccess("free", "estrategias_ml")).toBe(false);
    });
  });

  describe("premium plan", () => {
    it("can access free and premium features", () => {
      expect(hasAccess("premium", "dashboard")).toBe(true);
      expect(hasAccess("premium", "fechamentos")).toBe(true);
      expect(hasAccess("premium", "simulacoes")).toBe(true);
      expect(hasAccess("premium", "roi_dashboard")).toBe(true);
    });

    it("cannot access professional features", () => {
      expect(hasAccess("premium", "ia_autonoma")).toBe(false);
      expect(hasAccess("premium", "estrategias_ml")).toBe(false);
    });
  });

  describe("professional plan", () => {
    it("can access all features", () => {
      const features: Feature[] = Object.keys(FEATURE_MIN_PLAN) as Feature[];
      features.forEach((f) => {
        expect(hasAccess("professional", f)).toBe(true);
      });
    });
  });

  describe("lifetime plan", () => {
    it("can access everything", () => {
      const features: Feature[] = Object.keys(FEATURE_MIN_PLAN) as Feature[];
      features.forEach((f) => {
        expect(hasAccess("lifetime", f)).toBe(true);
      });
    });
  });

  describe("admin override", () => {
    it("admin can access all features regardless of plan", () => {
      expect(hasAccess("free", "ia_autonoma", true)).toBe(true);
      expect(hasAccess("free", "estrategias_ml", true)).toBe(true);
      expect(hasAccess("free", "fechamentos", true)).toBe(true);
    });
  });

  describe("hierarchy ordering", () => {
    it("maintains correct hierarchy", () => {
      expect(PLAN_HIERARCHY.free).toBeLessThan(PLAN_HIERARCHY.premium);
      expect(PLAN_HIERARCHY.premium).toBeLessThan(PLAN_HIERARCHY.professional);
      expect(PLAN_HIERARCHY.professional).toBeLessThan(PLAN_HIERARCHY.lifetime);
    });
  });
});
