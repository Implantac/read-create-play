
ALTER TABLE public.closing_history ADD COLUMN IF NOT EXISTS share_id text UNIQUE;

CREATE INDEX IF NOT EXISTS closing_history_share_idx ON public.closing_history (share_id) WHERE share_id IS NOT NULL;

DROP POLICY IF EXISTS "Users update own closings" ON public.closing_history;
CREATE POLICY "Users update own closings"
  ON public.closing_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anon read shared closings" ON public.closing_history;
CREATE POLICY "Anon read shared closings"
  ON public.closing_history FOR SELECT
  TO anon, authenticated
  USING (share_id IS NOT NULL);

GRANT SELECT ON public.closing_history TO anon;
