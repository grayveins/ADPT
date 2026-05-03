-- ============================================================================
-- MESSAGES PUSH TRIGGER
-- Calls the push-on-message Edge Function on every messages INSERT via pg_net.
-- This is the SQL alternative to a Database Webhook configured in Studio —
-- equivalent behavior, but reproducible and version-controlled.
--
-- ----------------------------------------------------------------------------
-- Pre-requisites (one-time per project):
--
--   1. Supabase Studio → Project Settings → Vault → Add new secret:
--        Name:  service_role_key
--        Value: <copy from Project Settings → API → service_role>
--
--   2. The function URL below is hardcoded for this project. If you fork or
--      stage to a new project, update FN_URL.
--      TODO: parameterize once we add a staging environment.
--
-- pg_net is enabled on every Supabase project by default.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $$
DECLARE
  -- Project-pinned. Update if you fork to a new Supabase project.
  FN_URL CONSTANT TEXT :=
    'https://yckodvjabgkemhddrzle.supabase.co/functions/v1/push-on-message';
  v_key TEXT;
BEGIN
  -- Read the service-role key from Vault. If Vault is misconfigured or the
  -- secret hasn't been created yet, silently no-op so an INSERT into messages
  -- never fails because of push-notification plumbing.
  BEGIN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF v_key IS NULL OR v_key = '' THEN
    RETURN NEW;
  END IF;

  -- net.http_post is async — returns a request_id immediately and queues
  -- the actual call. The INSERT is never blocked on the network round-trip.
  PERFORM net.http_post(
    url     := FN_URL,
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
