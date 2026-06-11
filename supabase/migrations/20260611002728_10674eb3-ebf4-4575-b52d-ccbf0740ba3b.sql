CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  job_title TEXT,
  phone TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grants
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT ON public.leads TO service_role;

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view leads" ON public.leads
  FOR SELECT TO service_role USING (true);
