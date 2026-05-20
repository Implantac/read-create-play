DROP POLICY IF EXISTS "Users cannot change own plan" ON public.profiles;

CREATE POLICY "Users cannot change own plan"
  ON public.profiles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    plan = (
      SELECT p.plan
      FROM public.profiles p
      WHERE p.id = profiles.id
    )
    OR public.is_super_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Public can create support tickets" ON public.support_tickets;

CREATE POLICY "Authenticated users can create support tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND email IS NOT NULL
    AND name IS NOT NULL
    AND subject IS NOT NULL
    AND message IS NOT NULL
    AND protocol IS NOT NULL
  );