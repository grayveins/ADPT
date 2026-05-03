-- ============================================================================
-- MESSAGING POLISH
-- Backfill conversations for legacy coach_clients rows that pre-date the
-- auto_create_conversation trigger, and add a client-callable RPC that
-- finds-or-creates a conversation idempotently.
-- ============================================================================

-- Backfill: ensure every active or paused coach_clients pair has a conversation row.
INSERT INTO public.conversations (coach_id, client_id)
SELECT coach_id, client_id
FROM public.coach_clients
WHERE status IN ('active', 'paused')
ON CONFLICT (coach_id, client_id) DO NOTHING;

-- Client-side safety net: lets the mobile app conjure a conversation if the
-- trigger missed it, without granting clients INSERT on conversations.
CREATE OR REPLACE FUNCTION public.find_or_create_conversation(p_coach_id UUID)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.coach_clients
    WHERE coach_id = p_coach_id
      AND client_id = auth.uid()
      AND status IN ('active', 'paused')
  ) THEN
    RAISE EXCEPTION 'Not a client of this coach';
  END IF;

  SELECT id INTO v_id
  FROM public.conversations
  WHERE coach_id = p_coach_id AND client_id = auth.uid();

  IF v_id IS NULL THEN
    INSERT INTO public.conversations (coach_id, client_id)
    VALUES (p_coach_id, auth.uid())
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.find_or_create_conversation(UUID) TO authenticated;
