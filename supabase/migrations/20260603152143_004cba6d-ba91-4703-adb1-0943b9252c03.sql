
CREATE POLICY "Users cannot change own email or phone"
ON public.profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  (
    email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = profiles.id)
    AND phone_number IS NOT DISTINCT FROM (SELECT p.phone_number FROM public.profiles p WHERE p.id = profiles.id)
  )
  OR public.is_super_admin(auth.uid())
);
