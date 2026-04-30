-- ============================================================================
-- FIX SCHEMA GAPS — Comprehensive patch
-- Fixes: client onboarding, coach auto-creation, invitations, conversations,
--        storage buckets, RPC functions, photo type standardization
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RPC: get_user_id_by_email — coaches need to look up clients
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = p_email LIMIT 1;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_id_by_email(TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Auto-create coaches row when profiles.role is set to 'coach'
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_coach_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'coach' AND (OLD.role IS NULL OR OLD.role != 'coach') THEN
    INSERT INTO coaches (id, display_name, is_accepting_clients)
    VALUES (NEW.id, COALESCE(NEW.first_name, 'Coach'), true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
CREATE TRIGGER on_profile_role_change
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_coach_role();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Auto-create profile on auth signup (if not exists)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Client invitations table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'expired')),
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days'
);

CREATE INDEX IF NOT EXISTS idx_client_invitations_coach
  ON client_invitations(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email
  ON client_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_client_invitations_token
  ON client_invitations(token) WHERE status = 'pending';

ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own invitations"
  ON client_invitations FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Read by token for acceptance"
  ON client_invitations FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Accept invitation RPC
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION accept_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT * INTO inv FROM client_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;

  -- Ensure profile exists and is a client
  UPDATE profiles SET role = 'client' WHERE id = auth.uid() AND role = 'client';

  -- Create coach-client relationship
  INSERT INTO coach_clients (coach_id, client_id, status, started_at)
  VALUES (inv.coach_id, auth.uid(), 'active', now())
  ON CONFLICT (coach_id, client_id) DO UPDATE SET status = 'active', started_at = now();

  -- Mark invitation accepted
  UPDATE client_invitations SET status = 'accepted' WHERE id = inv.id;

  RETURN jsonb_build_object('coach_id', inv.coach_id, 'status', 'accepted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_invitation(TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Conversations table (proper, not derived)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coach_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_coach
  ON conversations(coach_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_client
  ON conversations(client_id);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = coach_id OR auth.uid() = client_id);

CREATE POLICY "Coaches create conversations"
  ON conversations FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Service role full access to conversations"
  ON conversations FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Auto-create conversation when coach-client relationship is created
CREATE OR REPLACE FUNCTION auto_create_conversation()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'active' THEN
    INSERT INTO conversations (coach_id, client_id)
    VALUES (NEW.coach_id, NEW.client_id)
    ON CONFLICT (coach_id, client_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_coach_client_created ON coach_clients;
CREATE TRIGGER on_coach_client_created
  AFTER INSERT OR UPDATE OF status ON coach_clients
  FOR EACH ROW EXECUTE FUNCTION auto_create_conversation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Fix check_in_photos — standardize photo_type to match all codebases
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE check_in_photos DROP CONSTRAINT IF EXISTS valid_photo_type;
ALTER TABLE check_in_photos ADD CONSTRAINT valid_photo_type
  CHECK (photo_type IN ('front', 'back', 'side', 'side_left', 'side_right', 'other'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Ensure check-in-photos storage bucket exists with proper RLS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'check-in-photos',
  'check-in-photos',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop + recreate to avoid policy conflicts
DO $$ BEGIN
  DROP POLICY IF EXISTS "Clients can upload check-in photos" ON storage.objects;
  DROP POLICY IF EXISTS "Clients can view own check-in photos" ON storage.objects;
  DROP POLICY IF EXISTS "Coaches can view client check-in photos" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Clients upload check-in photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'check-in-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients view own check-in photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'check-in-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches view client check-in photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'check-in-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Ensure avatars storage bucket exists
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Progress photos table (simpler alternative to check_in_photos for
--     direct client uploads not tied to a check-in)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  thumbnail_url TEXT,
  pose          TEXT CHECK (pose IN ('front', 'side', 'back', 'other')),
  notes         TEXT,
  taken_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_client
  ON progress_photos(client_id, taken_at DESC);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own progress photos"
  ON progress_photos FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "Coaches view client progress photos"
  ON progress_photos FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Fix profiles RLS — ensure coaches can read client profiles
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  DROP POLICY IF EXISTS "Coaches can read client profiles" ON profiles;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Coaches can read client profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT client_id FROM coach_clients
      WHERE coach_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Ensure profiles has email column for lookups
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill emails from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Keep email in sync
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_email_change ON auth.users;
CREATE TRIGGER on_auth_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_profile_email();

-- Update handle_new_user to also set email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────────
-- ANALYZE
-- ─────────────────────────────────────────────────────────────────────────────

ANALYZE client_invitations;
ANALYZE conversations;
ANALYZE progress_photos;
