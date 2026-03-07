
-- 1. Create the trigger to auto-create profiles on signup (was missing!)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Add UPDATE policy for saved_bets so users can edit labels/strategy
CREATE POLICY "Users can update own saved bets"
  ON public.saved_bets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Add index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles (plan);
