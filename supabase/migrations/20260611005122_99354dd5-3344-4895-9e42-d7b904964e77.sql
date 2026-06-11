
-- ============ LEADS ============
-- Drop overly permissive insert policy and recreate with basic validation
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

CREATE POLICY "Public can submit leads with valid data"
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 200
    AND char_length(email) BETWEEN 5 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR char_length(phone) BETWEEN 6 AND 32)
    AND (company_name IS NULL OR char_length(company_name) <= 200)
    AND (job_title IS NULL OR char_length(job_title) <= 120)
    AND consent_given = true
  );

-- Allow admins to read leads via client (in addition to existing service_role policy)
CREATE POLICY "Admins can view leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============ AFFILIATE_COMMISSIONS ============
-- Explicitly deny client writes; only service_role / SECURITY DEFINER funcs can modify
CREATE POLICY "Deny client inserts on affiliate_commissions"
  ON public.affiliate_commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on affiliate_commissions"
  ON public.affiliate_commissions
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client deletes on affiliate_commissions"
  ON public.affiliate_commissions
  FOR DELETE
  TO authenticated
  USING (false);

-- ============ AFFILIATE_PROGRAM ============
CREATE POLICY "Deny client inserts on affiliate_program"
  ON public.affiliate_program
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on affiliate_program"
  ON public.affiliate_program
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client deletes on affiliate_program"
  ON public.affiliate_program
  FOR DELETE
  TO authenticated
  USING (false);

-- ============ AFFILIATE_REFERRALS ============
CREATE POLICY "Deny client inserts on affiliate_referrals"
  ON public.affiliate_referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Deny client updates on affiliate_referrals"
  ON public.affiliate_referrals
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client deletes on affiliate_referrals"
  ON public.affiliate_referrals
  FOR DELETE
  TO authenticated
  USING (false);
