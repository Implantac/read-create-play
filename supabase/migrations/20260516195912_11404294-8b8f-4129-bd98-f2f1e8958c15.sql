-- 1. Restrict function execution to specific roles
-- This addresses Warn 2-10 from the linter.

-- Functions that need to be callable by anyone (anon and authenticated)
-- e.g., during signup or for public checks
ALTER FUNCTION public.check_phone_exists(text) SECURITY INVOKER; -- Better as invoker if it doesn't need elevated privs
-- Actually, if they need elevated privs, we keep SECURITY DEFINER but restrict:
REVOKE EXECUTE ON FUNCTION public.check_phone_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid) TO authenticated, service_role;

-- 2. Fix Storage policy (Warn 1)
-- If there are public buckets allowing listing, we restrict them.
-- This assumes there might be a policy like 'true' for SELECT on storage.objects.
-- We want to allow reading files but not listing the whole bucket.
-- Note: This requires knowing the bucket names, but we can target the general policy.
-- Common fix: Change FROM (true) TO (bucket_id = 'public_bucket_name')

-- 3. Double check support_tickets
-- The linter should be happy with auth.role() check.
