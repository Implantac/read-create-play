-- Grant full and unrestricted access to the owner/support account.
-- Idempotent: safe to run more than once.

DO $$
DECLARE
  target_email constant text := 'etcsuporte889@gmail.com';
  target_user_id uuid;
BEGIN
  SELECT id
    INTO target_user_id
    FROM auth.users
   WHERE lower(email) = target_email
   LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User % not found yet. handle_new_user will grant full access when the account is created.', target_email;
    RETURN;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, plan, blocked)
  VALUES (target_user_id, target_email, 'Claudinei da Silva', 'lifetime', false)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    plan = 'lifetime',
    blocked = false,
    updated_at = now();

  DELETE FROM public.user_roles
   WHERE user_id = target_user_id
     AND role IN ('admin', 'user', 'moderator');

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_full_access_user boolean := lower(NEW.email) = 'etcsuporte889@gmail.com';
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, blocked)
  VALUES (
    NEW.id,
    NEW.email,
    CASE
      WHEN is_full_access_user THEN 'Claudinei da Silva'
      ELSE COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    END,
    CASE WHEN is_full_access_user THEN 'lifetime' ELSE 'free' END,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    plan = CASE WHEN is_full_access_user THEN 'lifetime' ELSE public.profiles.plan END,
    blocked = CASE WHEN is_full_access_user THEN false ELSE public.profiles.blocked END,
    updated_at = now();

  IF is_full_access_user THEN
    DELETE FROM public.user_roles
     WHERE user_id = NEW.id
       AND role IN ('admin', 'user', 'moderator');

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
