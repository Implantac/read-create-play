-- Create the function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create table
CREATE TABLE public.simulation_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lottery_id TEXT NOT NULL,
  name TEXT NOT NULL,
  risk_profile TEXT NOT NULL,
  volatility FLOAT NOT NULL,
  regime_stability FLOAT NOT NULL,
  weights JSONB NOT NULL,
  result_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulation_scenarios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own scenarios" 
ON public.simulation_scenarios 
FOR ALL
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_simulation_scenarios_updated_at
BEFORE UPDATE ON public.simulation_scenarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();