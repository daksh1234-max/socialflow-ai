-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Generations
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  result TEXT NOT NULL,
  generation_type TEXT NOT NULL, -- caption, hook, image
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Accounts
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- instagram, facebook, linkedin, twitter
  platform_account_id TEXT NOT NULL,
  handle TEXT,
  access_token TEXT NOT NULL, -- in production, should be secured or encrypted via Supabase Vault
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_account_id)
);

-- Posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- draft, scheduled, publishing, published, failed
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Platforms (which post goes to which platform account)
CREATE TABLE public.post_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, published, failed
  external_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, social_account_id)
);

-- Analytics
CREATE TABLE public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  views INT DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, social_account_id, recorded_at)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- post_published, post_failed, system
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Other tables:
-- Standard "Users can CRUD their own data"
CREATE POLICY "Users can CRUD own social accounts" ON public.social_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own posts" ON public.posts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own post platforms" ON public.post_platforms 
  FOR ALL USING (post_id IN (SELECT id FROM public.posts WHERE user_id = auth.uid()));
CREATE POLICY "Users can CRUD own analytics" ON public.analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ai_generations" ON public.ai_generations FOR ALL USING (auth.uid() = user_id);

-- Functions & Triggers
-- Auth Trigger for auto-profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Stub Functions requested
CREATE OR REPLACE FUNCTION public.schedule_post(p_post_id UUID, p_run_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  -- In a full implementation, this integrates heavily with pg_cron
  -- e.g., SELECT cron.schedule(...)
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_best_posting_times(p_user_id UUID, p_platform TEXT)
RETURNS JSON AS $$
BEGIN
  -- Stub returning sample data
  RETURN '["09:00", "12:00", "18:00"]'::JSON;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_trending_hashtags(p_platform TEXT)
RETURNS JSON AS $$
BEGIN
  -- Stub returning sample data
  RETURN '["#ai", "#trending", "#socialmedia"]'::JSON;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
