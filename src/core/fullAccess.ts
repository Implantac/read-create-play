export const FULL_ACCESS_EMAILS = ["etcsuporte889@gmail.com"] as const;

export function isFullAccessEmail(email?: string | null) {
  if (!email) return false;
  return FULL_ACCESS_EMAILS.some((fullAccessEmail) => fullAccessEmail === email.toLowerCase());
}
