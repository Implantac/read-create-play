CREATE OR REPLACE FUNCTION public.get_top_numbers(p_lottery_id TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (number INTEGER, frequency BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT n, count(*)::BIGINT
    FROM (
        SELECT unnest(numbers) as n 
        FROM lottery_draws 
        WHERE lottery_id = p_lottery_id
    ) as sub 
    GROUP BY n 
    ORDER BY count(*) DESC 
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_top_numbers(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_numbers(TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_top_numbers(TEXT, INTEGER) TO anon;
