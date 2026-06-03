-- Create table to store all lottery draws
CREATE TABLE public.lottery_draws (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lottery_id TEXT NOT NULL,
  concurso INTEGER NOT NULL,
  draw_date TEXT,
  numbers INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lottery_id, concurso)
);

-- Enable RLS
ALTER TABLE public.lottery_draws ENABLE ROW LEVEL SECURITY;

-- Public read access (lottery data is public)
CREATE POLICY "Anyone can read lottery draws"
  ON public.lottery_draws FOR SELECT
  USING (true);

-- Only service role can insert (edge functions)
CREATE POLICY "Service role can insert draws"
  ON public.lottery_draws FOR INSERT
  WITH CHECK (true);

-- Indexes for fast queries
CREATE INDEX idx_lottery_draws_lottery_concurso 
  ON public.lottery_draws(lottery_id, concurso DESC);

CREATE INDEX idx_lottery_draws_lottery_id 
  ON public.lottery_draws(lottery_id);