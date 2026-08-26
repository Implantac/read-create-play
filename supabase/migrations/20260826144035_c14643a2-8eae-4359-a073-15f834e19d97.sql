CREATE OR REPLACE FUNCTION public.ensure_user_gamification()
RETURNS public.user_gamification
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.user_gamification;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.user_gamification WHERE user_id = v_uid;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  INSERT INTO public.user_gamification (user_id, xp, level)
  VALUES (v_uid, 0, 1)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_user_gamification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_user_gamification() TO authenticated, service_role;