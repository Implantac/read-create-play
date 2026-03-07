
-- Fix: Drop restrictive SELECT policies on lottery_draws and recreate as permissive
DROP POLICY IF EXISTS "Anyone can read lottery draws" ON public.lottery_draws;
CREATE POLICY "Anyone can read lottery draws"
  ON public.lottery_draws
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert draws" ON public.lottery_draws;
CREATE POLICY "Service role can insert draws"
  ON public.lottery_draws
  FOR INSERT
  WITH CHECK (true);

-- Recreate trigger for auto-profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix: Drop restrictive SELECT/INSERT/UPDATE/DELETE policies on saved_bets and recreate as permissive
DROP POLICY IF EXISTS "Users can view own saved bets" ON public.saved_bets;
CREATE POLICY "Users can view own saved bets"
  ON public.saved_bets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved bets" ON public.saved_bets;
CREATE POLICY "Users can insert own saved bets"
  ON public.saved_bets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved bets" ON public.saved_bets;
CREATE POLICY "Users can update own saved bets"
  ON public.saved_bets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved bets" ON public.saved_bets;
CREATE POLICY "Users can delete own saved bets"
  ON public.saved_bets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix profiles policies to be permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
