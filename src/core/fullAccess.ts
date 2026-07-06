/**
 * Legacy compatibility shim.
 *
 * Historically this module exposed a hardcoded list of "full access" e-mails
 * that granted super_admin + lifetime status on the client. That is a
 * privilege-escalation risk (anyone reading the bundle sees the address; a
 * value change on the client could be spoofed).
 *
 * The single source of truth for privileged status is now the database:
 *   - `public.user_roles` (role = 'super_admin' | 'admin' | ...)
 *   - `public.profiles.plan`
 * These are further protected by the SECURITY DEFINER triggers
 * `protect_super_admin_etcsuporte`, `enforce_full_access_profile`,
 * `prevent_full_access_profile_delete` and `prevent_full_access_role_downgrade`,
 * which keep the protected account as super_admin + lifetime at the DB layer.
 *
 * These exports remain only so existing callers keep compiling; they no longer
 * carry any e-mail hardcode.
 */
export const FULL_ACCESS_EMAILS: readonly string[] = [];

export function isFullAccessEmail(_email?: string | null): boolean {
  return false;
}
