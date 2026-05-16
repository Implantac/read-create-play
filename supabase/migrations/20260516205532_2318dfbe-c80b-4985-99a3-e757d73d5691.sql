-- 1. Remove execution permission from 'authenticated' for sensitive functions
-- These are used in RLS policies, so 'service_role' access is sufficient
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

-- 2. Remove the 'list' permission for the storage bucket entirely
-- Public access to files via URL still works because the bucket is public,
-- but listing/searching files is now restricted to prevent information disclosure.
DROP POLICY IF EXISTS "Authenticated users can list avatars" ON storage.objects;
