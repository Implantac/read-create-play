
CREATE TABLE public.ai_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id text NOT NULL,
  function_name text NOT NULL,
  cache_key text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '6 hours'),
  UNIQUE (lottery_id, function_name, cache_key)
);

ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read AI cache" ON public.ai_analysis_cache FOR SELECT USING (true);
CREATE POLICY "Service role can manage cache" ON public.ai_analysis_cache FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_ai_cache_lookup ON public.ai_analysis_cache (lottery_id, function_name, cache_key);
CREATE INDEX idx_ai_cache_expires ON public.ai_analysis_cache (expires_at);
