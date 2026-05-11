-- supabase/migrations/20240511_ai_system.sql

-- 1. Enhance ai_generations table
-- Rename existing column if it exists from initial schema
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_generations' AND column_name='generation_type') THEN
    ALTER TABLE public.ai_generations RENAME COLUMN generation_type TO type;
  END IF;
END $$;

-- Add missing columns to ai_generations
ALTER TABLE public.ai_generations 
ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS used_in_post UUID REFERENCES public.posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create ai_rate_limits table
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  openrouter_count INTEGER DEFAULT 0,
  openrouter_reset_at TIMESTAMPTZ DEFAULT NOW(),
  huggingface_count INTEGER DEFAULT 0,
  huggingface_reset_at TIMESTAMPTZ DEFAULT NOW(),
  pollinations_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on ai_rate_limits (ai_generations RLS is already enabled in initial schema)
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- ai_generations policies (Ensure they exist or overwrite)
DROP POLICY IF EXISTS "Users can CRUD own ai_generations" ON public.ai_generations;
CREATE POLICY "Users can CRUD own ai_generations" ON public.ai_generations 
  FOR ALL USING (auth.uid() = user_id);

-- ai_rate_limits policies
DROP POLICY IF EXISTS "Users can view own rate limits" ON public.ai_rate_limits;
CREATE POLICY "Users can view own rate limits" ON public.ai_rate_limits 
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_type ON public.ai_generations(user_id, type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON public.ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_generations_favorite ON public.ai_generations(user_id) WHERE is_favorite = true;

-- 5. Rate Limit Function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id UUID, p_provider TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Initialize rate limit record if it doesn't exist
  INSERT INTO public.ai_rate_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF p_provider = 'openrouter' THEN
    SELECT openrouter_count, openrouter_reset_at INTO v_count, v_reset_at
    FROM public.ai_rate_limits WHERE user_id = p_user_id;

    -- Reset if minute passed
    IF v_reset_at < v_now - INTERVAL '1 minute' THEN
      UPDATE public.ai_rate_limits 
      SET openrouter_count = 1, openrouter_reset_at = v_now 
      WHERE user_id = p_user_id;
      RETURN TRUE;
    END IF;

    IF v_count >= 20 THEN
      RETURN FALSE;
    END IF;

    UPDATE public.ai_rate_limits 
    SET openrouter_count = openrouter_count + 1 
    WHERE user_id = p_user_id;
    RETURN TRUE;

  ELSIF p_provider = 'huggingface' THEN
    SELECT huggingface_count, huggingface_reset_at INTO v_count, v_reset_at
    FROM public.ai_rate_limits WHERE user_id = p_user_id;

    -- Reset if month passed
    IF v_reset_at < v_now - INTERVAL '1 month' THEN
      UPDATE public.ai_rate_limits 
      SET huggingface_count = 1, huggingface_reset_at = v_now 
      WHERE user_id = p_user_id;
      RETURN TRUE;
    END IF;

    IF v_count >= 1000 THEN
      RETURN FALSE;
    END IF;

    UPDATE public.ai_rate_limits 
    SET huggingface_count = huggingface_count + 1 
    WHERE user_id = p_user_id;
    RETURN TRUE;

  ELSIF p_provider = 'pollinations' THEN
    -- Unlimited as per requirements
    UPDATE public.ai_rate_limits 
    SET pollinations_count = pollinations_count + 1 
    WHERE user_id = p_user_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
