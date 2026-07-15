/**
 * Auth / Profile contracts — reexports from the feature module so the rest of
 * the app depends on `@/core/contracts` rather than the feature folder.
 */

export type { PlanType, Profile, AuthState } from "@/features/auth/types";
