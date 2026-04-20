
-- 1. Fix profiles admin UPDATE policy: restrict to only the 'blocked' column
DROP POLICY IF EXISTS "Admins can block users" ON public.profiles;

CREATE POLICY "Admins can block users"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND id <> auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND id <> auth.uid()
  -- Ensure no other column is changed besides 'blocked' and 'updated_at'
  AND email IS NOT DISTINCT FROM (SELECT email FROM public.profiles WHERE id = profiles.id)
  AND full_name IS NOT DISTINCT FROM (SELECT full_name FROM public.profiles WHERE id = profiles.id)
  AND avatar_url IS NOT DISTINCT FROM (SELECT avatar_url FROM public.profiles WHERE id = profiles.id)
  AND plan IS NOT DISTINCT FROM (SELECT plan FROM public.profiles WHERE id = profiles.id)
  AND theme_preference IS NOT DISTINCT FROM (SELECT theme_preference FROM public.profiles WHERE id = profiles.id)
  AND language IS NOT DISTINCT FROM (SELECT language FROM public.profiles WHERE id = profiles.id)
  AND currency_format IS NOT DISTINCT FROM (SELECT currency_format FROM public.profiles WHERE id = profiles.id)
  AND timezone IS NOT DISTINCT FROM (SELECT timezone FROM public.profiles WHERE id = profiles.id)
  AND phone_number IS NOT DISTINCT FROM (SELECT phone_number FROM public.profiles WHERE id = profiles.id)
  AND created_at IS NOT DISTINCT FROM (SELECT created_at FROM public.profiles WHERE id = profiles.id)
);

-- 2. Restrict check_phone_exists to anon role only (signup uses anon key, before auth)
-- Authenticated users should not be able to enumerate phone numbers
REVOKE EXECUTE ON FUNCTION public.check_phone_exists(text) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO anon;
