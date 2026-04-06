import { describe, it, expect } from "vitest";

// Test the pure auth logic (trial calculation, lifetime owner check)
// without needing React context or Supabase.

const TRIAL_DAYS = 7;
const LIFETIME_OWNER_EMAIL = "etcsuporte889@gmail.com";

function isLifetimeOwner(email?: string | null): boolean {
  return email?.trim().toLowerCase() === LIFETIME_OWNER_EMAIL;
}

function computeTrialDaysLeft(createdAt: string, plan: string): number {
  if (plan !== "free") return TRIAL_DAYS;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - elapsed);
}

function isTrialExpired(plan: string, trialDaysLeft: number, isAdmin: boolean): boolean {
  return !isAdmin && plan === "free" && trialDaysLeft <= 0;
}

describe("Auth Logic — Lifetime Owner", () => {
  it("recognizes exact email", () => {
    expect(isLifetimeOwner("etcsuporte889@gmail.com")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isLifetimeOwner("ETCsuporte889@Gmail.com")).toBe(true);
  });

  it("trims whitespace", () => {
    expect(isLifetimeOwner("  etcsuporte889@gmail.com  ")).toBe(true);
  });

  it("rejects different emails", () => {
    expect(isLifetimeOwner("other@gmail.com")).toBe(false);
  });

  it("handles null/undefined", () => {
    expect(isLifetimeOwner(null)).toBe(false);
    expect(isLifetimeOwner(undefined)).toBe(false);
    expect(isLifetimeOwner("")).toBe(false);
  });
});

describe("Auth Logic — Trial Days", () => {
  it("returns 7 for non-free plans", () => {
    expect(computeTrialDaysLeft(new Date().toISOString(), "premium")).toBe(7);
    expect(computeTrialDaysLeft(new Date().toISOString(), "lifetime")).toBe(7);
  });

  it("returns 7 for brand new free account", () => {
    const now = new Date().toISOString();
    expect(computeTrialDaysLeft(now, "free")).toBe(7);
  });

  it("returns 0 for expired free account", () => {
    const old = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeTrialDaysLeft(old, "free")).toBe(0);
  });

  it("returns correct remaining days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeTrialDaysLeft(threeDaysAgo, "free")).toBe(4);
  });

  it("never goes negative", () => {
    const ancient = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    expect(computeTrialDaysLeft(ancient, "free")).toBe(0);
  });
});

describe("Auth Logic — Trial Expiration", () => {
  it("expired when free plan and 0 days left", () => {
    expect(isTrialExpired("free", 0, false)).toBe(true);
  });

  it("not expired when days remain", () => {
    expect(isTrialExpired("free", 3, false)).toBe(false);
  });

  it("not expired for paid plans", () => {
    expect(isTrialExpired("premium", 0, false)).toBe(false);
  });

  it("admin is never trial-expired", () => {
    expect(isTrialExpired("free", 0, true)).toBe(false);
  });
});
