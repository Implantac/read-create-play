-- Enforce absolute, permanent access for the support owner account.
-- Idempotent and intentionally repeated after access-restoration migrations.

CREATE OR REPLACE FUNCTION public.is_full_access_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT lower(COALESCE(_email, '')) = 'etcsuporte889@gmail.com';
$$;

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id
    INTO target_user_id
    FROM auth.users
   WHERE public.is_full_access_email(email)
   LIMIT 1;

  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, plan, blocked)
    VALUES (target_user_id, 'etcsuporte889@gmail.com', 'Claudinei da Silva', 'lifetime', false)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
      plan = 'lifetime',
      blocked = false,
      updated_at = now();

    DELETE FROM public.user_roles
     WHERE user_id = target_user_id
       AND role IN ('admin', 'moderator', 'user');

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_full_access_user boolean := public.is_full_access_email(NEW.email);
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
    full_name = CASE
      WHEN is_full_access_user THEN COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name)
      ELSE EXCLUDED.full_name
    END,
    plan = CASE WHEN is_full_access_user THEN 'lifetime' ELSE public.profiles.plan END,
    blocked = CASE WHEN is_full_access_user THEN false ELSE public.profiles.blocked END,
    updated_at = now();

  IF is_full_access_user THEN
    DELETE FROM public.user_roles
     WHERE user_id = NEW.id
       AND role IN ('admin', 'moderator', 'user');

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
  IF TG_OP = 'INSERT' AND public.is_full_access_email(NEW.email) THEN
    NEW.plan := 'lifetime';
    NEW.blocked := false;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF public.is_full_access_email(OLD.email) THEN
      NEW.email := OLD.email;
      NEW.plan := 'lifetime';
      NEW.blocked := false;
    END IF;

    IF public.is_full_access_email(NEW.email) THEN
      NEW.plan := 'lifetime';
      NEW.blocked := false;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_full_access_profile_on_profiles ON public.profiles;

CREATE TRIGGER enforce_full_access_profile_on_profiles
BEFORE INSERT OR UPDATE ON public.profiles
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
  SELECT email
    INTO target_email
    FROM public.profiles
   WHERE id = target_user_id;

  IF public.is_full_access_email(target_email) THEN
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

DROP POLICY IF EXISTS "Super admins can manage all saved bets" ON public.saved_bets;
CREATE POLICY "Super admins can manage all saved bets"
  ON public.saved_bets
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
CREATE POLICY "Super admins can insert profiles"
  ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super admins can manage all roles"
  ON public.user_roles
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can delete audit logs" ON public.admin_audit_logs;
CREATE POLICY "Super admins can delete audit logs"
  ON public.admin_audit_logs
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));
