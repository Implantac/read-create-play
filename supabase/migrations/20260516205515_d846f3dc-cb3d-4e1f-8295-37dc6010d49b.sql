-- 1. Secure functions by revoking public execute permissions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_blocked(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- 2. Grant execution permissions only to necessary roles
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 3. Fix broad storage bucket listing permission
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;

-- Allow authenticated users to list files in the bucket
CREATE POLICY "Authenticated users can list avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Since the bucket itself is marked as public: true, 
-- file retrieval via public URL will still work even without an explicit SELECT policy for anon,
-- but the linter warning about 'listing' will be resolved.
