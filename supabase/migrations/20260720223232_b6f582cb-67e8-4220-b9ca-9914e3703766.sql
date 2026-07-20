DROP POLICY IF EXISTS "Anon read shared closings" ON public.closing_history;

CREATE OR REPLACE FUNCTION public.get_shared_closing(_share_id text)
RETURNS SETOF public.closing_history
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.closing_history
  WHERE share_id IS NOT NULL
    AND share_id = _share_id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_closing(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_closing(text) TO anon, authenticated;