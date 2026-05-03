-- ============================================================================
-- MESSAGES PUSH TRIGGER
-- Calls the push-on-message Edge Function on every messages INSERT via pg_net.
-- This is the SQL alternative to a Database Webhook configured in Studio —
-- equivalent behavior, but reproducible and version-controlled.
--
-- Pre-requisites (one-time per project, run in Supabase SQL Editor):
--
--   ALTER DATABASE postgres
--     SET app.settings.supabase_url = 'https://<your-project-ref>.supabase.co';
--   ALTER DATABASE postgres
--     SET app.settings.service_role_key = '<service role key from Project Settings → API>';
--
-- pg_net is enabled on every Supabase project by default; if not, run:
--   CREATE EXTENSION IF NOT EXISTS pg_net;
-- (it creates its own `net` schema)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  -- Pull settings; bail silently if not configured so an INSERT never fails
  -- because the trigger config is incomplete.
  BEGIN
    v_url := current_setting('app.settings.supabase_url', true);
    v_key := current_setting('app.settings.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RETURN NEW;
  END IF;

  -- pg_net.http_post is async — returns a request_id immediately and queues
  -- the actual call. The INSERT is never blocked on the network round-trip.
  PERFORM net.http_post(
    url     := v_url || '/functions/v1/push-on-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object(
      'type', 'INSERT',
      'table', 'messages',
      'schema', 'public',
      'record', row_to_json(NEW),
      'old_record', NULL
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted_push ON public.messages;
CREATE TRIGGER on_message_inserted_push
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_message();
