CREATE OR REPLACE FUNCTION public.check_phone_exists(_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone_number = _phone
  )
$$;