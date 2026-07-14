
ALTER TABLE public.closing_history
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.closing_history(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'engine';
CREATE INDEX IF NOT EXISTS closing_history_parent_id_idx ON public.closing_history(parent_id);
