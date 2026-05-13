-- Add ai_credits to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 50;

-- Function to decrement AI credits atomically
CREATE OR REPLACE FUNCTION decrement_ai_credits(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT ai_credits INTO current_credits FROM public.profiles WHERE id = target_user_id;
  IF current_credits > 0 THEN
    UPDATE public.profiles SET ai_credits = ai_credits - 1 WHERE id = target_user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;
