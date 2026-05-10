-- ============================================================================
-- client_invitations: persist coach-supplied full_name
--
-- Why: the dashboard's invite dialog already captures a name field, but it
-- was only being passed as auth metadata (which never lands when the email
-- send fails or is rate-limited). Storing it on the invitation row lets
-- the pending-invites list show real names and lets the onboarding form
-- pre-fill the field instead of asking the client to type it again.
-- ============================================================================

ALTER TABLE public.client_invitations
  ADD COLUMN IF NOT EXISTS full_name TEXT;
