CREATE TABLE public.engine_performance_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id TEXT NOT NULL,
  preset_hash TEXT NOT NULL,
  preset_label TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  games JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluated_concurso INTEGER,
  evaluated_at TIMESTAMPTZ,
  avg_hits REAL,
  max_hits INTEGER,
  tiers_hit JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_engine_perf_user_lottery ON public.engine_performance_log (user_id, lottery_id, generated_at DESC);
CREATE INDEX idx_engine_perf_preset ON public.engine_performance_log (user_id, preset_hash);
CREATE INDEX idx_engine_perf_pending ON public.engine_performance_log (evaluated_concurso) WHERE evaluated_concurso IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.engine_performance_log TO authenticated;
GRANT ALL ON public.engine_performance_log TO service_role;

ALTER TABLE public.engine_performance_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their engine perf logs"
  ON public.engine_performance_log
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access engine perf"
  ON public.engine_performance_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);