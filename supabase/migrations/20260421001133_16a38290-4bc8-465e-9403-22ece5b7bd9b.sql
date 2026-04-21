
-- Fix broken "Admins can block users" WITH CHECK policy.
-- The previous policy used profiles_1.id = profiles_1.id (always true), allowing admins to edit any column.
-- Rewrite using a trigger-free approach: compare to the OLD row via a correlated subquery on profiles using the outer row's id.

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
  AND email          IS NOT DISTINCT FROM (SELECT p.email          FROM public.profiles p WHERE p.id = profiles.id)
  AND full_name      IS NOT DISTINCT FROM (SELECT p.full_name      FROM public.profiles p WHERE p.id = profiles.id)
  AND avatar_url     IS NOT DISTINCT FROM (SELECT p.avatar_url     FROM public.profiles p WHERE p.id = profiles.id)
  AND plan           IS NOT DISTINCT FROM (SELECT p.plan           FROM public.profiles p WHERE p.id = profiles.id)
  AND theme_preference IS NOT DISTINCT FROM (SELECT p.theme_preference FROM public.profiles p WHERE p.id = profiles.id)
  AND language       IS NOT DISTINCT FROM (SELECT p.language       FROM public.profiles p WHERE p.id = profiles.id)
  AND currency_format IS NOT DISTINCT FROM (SELECT p.currency_format FROM public.profiles p WHERE p.id = profiles.id)
  AND timezone       IS NOT DISTINCT FROM (SELECT p.timezone       FROM public.profiles p WHERE p.id = profiles.id)
  AND phone_number   IS NOT DISTINCT FROM (SELECT p.phone_number   FROM public.profiles p WHERE p.id = profiles.id)
  AND created_at     IS NOT DISTINCT FROM (SELECT p.created_at     FROM public.profiles p WHERE p.id = profiles.id)
);
