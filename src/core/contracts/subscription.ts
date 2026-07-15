/**
 * Subscription / Plan DTOs (edge function boundary).
 *
 * These describe the shape returned by the following edge functions:
 *   - check-subscription
 *   - create-checkout
 *   - customer-portal
 *
 * The Supabase client returns `data` typed as `any`, so we validate at the
 * boundary using the guards below before consuming the payload.
 */

import type { PlanType } from "@/features/auth/types";

export interface CheckSubscriptionResponse {
  plan: PlanType;
  subscribed: boolean;
  subscription_end?: string | null;
}

export interface CheckoutSessionResponse {
  /** Stripe Checkout URL — null when user is already lifetime / admin. */
  url: string | null;
  /** Optional plan echoed back (present on shortcut paths). */
  plan?: PlanType;
  subscribed?: boolean;
}

export interface CustomerPortalResponse {
  url: string | null;
  /** Present when there is no Stripe customer yet. */
  error?: "no_customer" | string;
  plan?: PlanType;
  subscribed?: boolean;
}

export interface EdgeErrorResponse {
  error: string;
  expired_token?: boolean;
}

// ─── Guards ────────────────────────────────────────────────────────────

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

const PLAN_VALUES: readonly PlanType[] = ["free", "premium", "professional", "lifetime"];

function isPlanType(x: unknown): x is PlanType {
  return typeof x === "string" && (PLAN_VALUES as readonly string[]).includes(x);
}

export function isCheckSubscriptionResponse(x: unknown): x is CheckSubscriptionResponse {
  if (!isRecord(x)) return false;
  if (!isPlanType(x.plan)) return false;
  if (typeof x.subscribed !== "boolean") return false;
  if (x.subscription_end !== undefined && x.subscription_end !== null && typeof x.subscription_end !== "string") return false;
  return true;
}

export function isCheckoutSessionResponse(x: unknown): x is CheckoutSessionResponse {
  if (!isRecord(x)) return false;
  if (x.url !== null && typeof x.url !== "string") return false;
  return true;
}

export function isCustomerPortalResponse(x: unknown): x is CustomerPortalResponse {
  if (!isRecord(x)) return false;
  if (x.url !== null && x.url !== undefined && typeof x.url !== "string") return false;
  if (x.error !== undefined && typeof x.error !== "string") return false;
  return true;
}

export function isEdgeError(x: unknown): x is EdgeErrorResponse {
  return isRecord(x) && typeof x.error === "string";
}
