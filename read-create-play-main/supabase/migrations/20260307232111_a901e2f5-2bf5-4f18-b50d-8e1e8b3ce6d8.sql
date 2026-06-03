
CREATE TABLE public.saved_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id text NOT NULL,
  numbers integer[] NOT NULL,
  strategy text,
  score integer,
  grade text,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved bets" ON public.saved_bets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved bets" ON public.saved_bets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved bets" ON public.saved_bets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_saved_bets_user_lottery ON public.saved_bets(user_id, lottery_id);
