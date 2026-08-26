CREATE OR REPLACE FUNCTION public.ensure_affiliate_program()
RETURNS public.affiliate_program
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.affiliate_program;
  v_code text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.affiliate_program WHERE user_id = v_uid;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  LOOP
    v_code := 'TITAN-' || upper(substr(replace(v_uid::text, '-', ''), 1, 4)) || '-' ||
              upper(substr(md5(gen_random_uuid()::text), 1, 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliate_program WHERE referral_code = v_code);
  END LOOP;

  INSERT INTO public.affiliate_program (user_id, referral_code, total_referrals, active_subscriptions, total_earned, balance_available)
  VALUES (v_uid, v_code, 0, 0, 0, 0)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_affiliate_program() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_affiliate_program() TO authenticated, service_role;