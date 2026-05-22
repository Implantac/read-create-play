-- Grant full and unrestricted access to the owner/support account.
-- Grants access to the confirmed support address.
-- Idempotent: safe to run more than once.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.profiles'::regclass
      AND tgname = 'enforce_profile_plan_changes_on_profiles'
  ) THEN
    ALTER TABLE public.profiles DISABLE TRIGGER enforce_profile_plan_changes_on_profiles;
  END IF;
END $$;

DO $$
DECLARE
  full_access_emails constant text[] := ARRAY['etcsuporte889@gmail.com'];
  target_email text;
  target_user_id uuid;
BEGIN
  FOREACH target_email IN ARRAY full_access_emails LOOP
    SELECT id
      INTO target_user_id
      FROM auth.users
     WHERE lower(email) = target_email
     LIMIT 1;

    IF target_user_id IS NULL THEN
      RAISE NOTICE 'User % not found yet. handle_new_user will grant full access when the account is created.', target_email;
      CONTINUE;
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
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.profiles'::regclass
      AND tgname = 'enforce_profile_plan_changes_on_profiles'
  ) THEN
    ALTER TABLE public.profiles ENABLE TRIGGER enforce_profile_plan_changes_on_profiles;
  END IF;
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

CREATE OR REPLACE FUNCTION public.enforce_full_access_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF lower(COALESCE(OLD.email, '')) = 'etcsuporte889@gmail.com' THEN
    NEW.email := OLD.email;
    NEW.plan := 'lifetime';
    NEW.blocked := false;
  END IF;

  IF lower(COALESCE(NEW.email, '')) = 'etcsuporte889@gmail.com' THEN
    NEW.plan := 'lifetime';
    NEW.blocked := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_full_access_profile_on_profiles ON public.profiles;

CREATE TRIGGER enforce_full_access_profile_on_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_full_access_profile();

CREATE OR REPLACE FUNCTION public.prevent_full_access_role_downgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  target_user_id uuid := COALESCE(OLD.user_id, NEW.user_id);
  target_email text;
BEGIN
  SELECT lower(email)
    INTO target_email
    FROM public.profiles
   WHERE id = target_user_id;

  IF target_email = 'etcsuporte889@gmail.com' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'The full access account cannot lose super_admin privileges';
    END IF;

    IF NEW.role IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'The full access account must remain super_admin';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS prevent_full_access_role_delete_on_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS prevent_full_access_role_update_on_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS prevent_full_access_role_insert_on_user_roles ON public.user_roles;

CREATE TRIGGER prevent_full_access_role_delete_on_user_roles
BEFORE DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_full_access_role_downgrade();

CREATE TRIGGER prevent_full_access_role_update_on_user_roles
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_full_access_role_downgrade();

CREATE TRIGGER prevent_full_access_role_insert_on_user_roles
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_full_access_role_downgrade();
