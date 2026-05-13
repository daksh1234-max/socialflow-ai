-- First ensure pg_net is enabled (for HTTP requests from Postgres)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fix missing platform column in post_platforms if it hasn't been added yet
ALTER TABLE public.post_platforms ADD COLUMN IF NOT EXISTS platform TEXT;

-- Create a wrapper function that calls the Edge Function
CREATE OR REPLACE FUNCTION public.trigger_social_schedule()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status int;
BEGIN
  -- Call the Edge Function via HTTP POST
  -- Note: We disabled verify_jwt in the Edge Function, so we don't strictly need the Service Role Key here,
  -- but it's good practice to send it just in case.
  SELECT status INTO response_status
  FROM net.http_post(
    url := 'https://rfilxmrtqcrvfjlsawdj.supabase.co/functions/v1/social-schedule',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS response;
  
  -- Log for debugging (optional)
  RAISE NOTICE 'social-schedule triggered, status: %', response_status;
END;
$$;

-- Schedule it to run every 2 minutes
SELECT cron.schedule(
  'social-schedule-every-2-min',
  '*/2 * * * *',
  'SELECT public.trigger_social_schedule()'
);
