-- Add push token to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Webhook function to trigger notifications
CREATE OR REPLACE FUNCTION public.trigger_post_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger on status change
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Trigger edge function via pg_net
    PERFORM net.http_post(
      url := 'https://rfilxmrtqcrvfjlsawdj.supabase.co/functions/v1/notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_post_status_change ON public.post_platforms;

-- Create trigger on post_platforms
CREATE TRIGGER on_post_status_change
  AFTER UPDATE OF status ON public.post_platforms
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_post_notification();
