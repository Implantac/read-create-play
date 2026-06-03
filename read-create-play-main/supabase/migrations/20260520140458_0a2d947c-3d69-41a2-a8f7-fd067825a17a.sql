DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;

CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can block users" ON public.profiles;

CREATE POLICY "Admins can block users"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND id <> auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND id <> auth.uid()
    AND blocked IS DISTINCT FROM (
      SELECT p.blocked
      FROM public.profiles p
      WHERE p.id = profiles.id
    )
    AND NOT (email IS DISTINCT FROM (
      SELECT p.email
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (full_name IS DISTINCT FROM (
      SELECT p.full_name
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (avatar_url IS DISTINCT FROM (
      SELECT p.avatar_url
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (plan IS DISTINCT FROM (
      SELECT p.plan
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (theme_preference IS DISTINCT FROM (
      SELECT p.theme_preference
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (language IS DISTINCT FROM (
      SELECT p.language
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (currency_format IS DISTINCT FROM (
      SELECT p.currency_format
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (timezone IS DISTINCT FROM (
      SELECT p.timezone
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (phone_number IS DISTINCT FROM (
      SELECT p.phone_number
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
    AND NOT (created_at IS DISTINCT FROM (
      SELECT p.created_at
      FROM public.profiles p
      WHERE p.id = profiles.id
    ))
  );