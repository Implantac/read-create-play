
CREATE TABLE IF NOT EXISTS public.closing_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lottery_id text NOT NULL,
  lottery_name text,
  strategy text NOT NULL,
  base_numbers integer[] NOT NULL,
  min_hits integer NOT NULL,
  max_games integer,
  game_count integer NOT NULL,
  cost numeric(12,2) NOT NULL DEFAULT 0,
  games jsonb NOT NULL,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  score jsonb NOT NULL DEFAULT '{}'::jsonb,
  lower_bound integer,
  elapsed_ms integer,
  notes text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS closing_history_user_lottery_idx
  ON public.closing_history (user_id, lottery_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.closing_history TO authenticated;
GRANT ALL ON public.closing_history TO service_role;

ALTER TABLE public.closing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own closings"
  ON public.closing_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own closings"
  ON public.closing_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own closings"
  ON public.closing_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
