CREATE OR REPLACE FUNCTION public.get_top_numbers(p_lottery_id TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (number INTEGER, frequency BIGINT) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT n, count(*)::BIGINT
    FROM (
        SELECT unnest(ld.numbers) as n 
        FROM lottery_draws ld
        WHERE ld.lottery_id = p_lottery_id
    ) as sub 
    GROUP BY n 
    ORDER BY count(*) DESC 
    LIMIT p_limit;
END;
$$;

-- Revoke all to be safe, then grant only to roles that need it
REVOKE ALL ON FUNCTION public.get_top_numbers(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_top_numbers(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_numbers(TEXT, INTEGER) TO service_role;
