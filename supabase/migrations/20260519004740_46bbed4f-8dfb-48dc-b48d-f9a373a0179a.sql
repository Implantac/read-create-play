-- Create a table for generation history
CREATE TABLE public.generation_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lottery_id TEXT NOT NULL,
    numbers INTEGER[] NOT NULL,
    score NUMERIC NOT NULL,
    strategy TEXT NOT NULL,
    description TEXT,
    pipeline JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own generation history" 
ON public.generation_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation history" 
ON public.generation_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generation history" 
ON public.generation_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_generation_history_user_id ON public.generation_history(user_id);
CREATE INDEX idx_generation_history_lottery_id ON public.generation_history(lottery_id);
CREATE INDEX idx_generation_history_created_at ON public.generation_history(created_at DESC);
