-- ============================================================================
-- COACHING PLATFORM MIGRATION
-- B2B coaching system (Trainerize replacement)
-- Tables: coaches, coach_clients, coaching_programs, program_phases,
--         phase_workouts, check_in_templates, check_ins, check_in_photos,
--         body_stats, messages, client_subscriptions, habit_assignments,
--         habit_logs
-- Also adds `role` column to existing profiles table
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXTEND PROFILES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client'
  CONSTRAINT valid_role CHECK (role IN ('client', 'coach', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. COACHES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  specialties TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  stripe_account_id TEXT,
  max_clients INTEGER NOT NULL DEFAULT 50,
  branding JSONB DEFAULT '{}'::jsonb,
  is_accepting_clients BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaches_accepting
  ON public.coaches(is_accepting_clients) WHERE is_accepting_clients = TRUE;

DROP TRIGGER IF EXISTS set_coaches_updated_at ON public.coaches;
CREATE TRIGGER set_coaches_updated_at
  BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own profile
CREATE POLICY "Coaches can view own profile"
  ON public.coaches FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Coaches can insert own profile"
  ON public.coaches FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Coaches can update own profile"
  ON public.coaches FOR UPDATE
  USING (id = auth.uid());

-- Clients can view their coach's profile
CREATE POLICY "Clients can view their coach"
  ON public.coaches FOR SELECT
  USING (
    id IN (
      SELECT coach_id FROM public.coach_clients
      WHERE client_id = auth.uid() AND status IN ('active', 'paused', 'pending')
    )
  );

-- Public coach discovery (anyone authenticated can browse coaches accepting clients)
CREATE POLICY "Authenticated users can browse coaches"
  ON public.coaches FOR SELECT
  USING (is_accepting_clients = TRUE);

-- Service role bypass for API operations
CREATE POLICY "Service role full access to coaches"
  ON public.coaches FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. COACH-CLIENT RELATIONSHIPS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  notes TEXT,
  monthly_rate_cents INTEGER,
  billing_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_cc_status CHECK (status IN ('active', 'paused', 'archived', 'pending')),
  CONSTRAINT valid_billing_status CHECK (billing_status IN ('active', 'past_due', 'cancelled')),
  CONSTRAINT unique_coach_client UNIQUE (coach_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_clients_coach
  ON public.coach_clients(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client
  ON public.coach_clients(client_id, status);
CREATE INDEX IF NOT EXISTS idx_coach_clients_active
  ON public.coach_clients(coach_id) WHERE status = 'active';

DROP TRIGGER IF EXISTS set_coach_clients_updated_at ON public.coach_clients;
CREATE TRIGGER set_coach_clients_updated_at
  BEFORE UPDATE ON public.coach_clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

-- Coaches can see and manage their own clients
CREATE POLICY "Coaches can view own clients"
  ON public.coach_clients FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert clients"
  ON public.coach_clients FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own clients"
  ON public.coach_clients FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own clients"
  ON public.coach_clients FOR DELETE
  USING (coach_id = auth.uid());

-- Clients can see their own coaching relationships
CREATE POLICY "Clients can view own coach relationship"
  ON public.coach_clients FOR SELECT
  USING (client_id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role full access to coach_clients"
  ON public.coach_clients FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COACHING PROGRAMS (assigned by coach to client)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coaching_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_program_status CHECK (status IN ('active', 'completed', 'draft', 'paused'))
);

CREATE INDEX IF NOT EXISTS idx_coaching_programs_coach
  ON public.coaching_programs(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_coaching_programs_client
  ON public.coaching_programs(client_id, status);
CREATE INDEX IF NOT EXISTS idx_coaching_programs_active
  ON public.coaching_programs(client_id) WHERE status = 'active';

DROP TRIGGER IF EXISTS set_coaching_programs_updated_at ON public.coaching_programs;
CREATE TRIGGER set_coaching_programs_updated_at
  BEFORE UPDATE ON public.coaching_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.coaching_programs ENABLE ROW LEVEL SECURITY;

-- Coaches can manage programs they created
CREATE POLICY "Coaches can view own programs"
  ON public.coaching_programs FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert programs"
  ON public.coaching_programs FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own programs"
  ON public.coaching_programs FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own programs"
  ON public.coaching_programs FOR DELETE
  USING (coach_id = auth.uid());

-- Clients can view programs assigned to them
CREATE POLICY "Clients can view own programs"
  ON public.coaching_programs FOR SELECT
  USING (client_id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role full access to coaching_programs"
  ON public.coaching_programs FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PROGRAM PHASES (blocks within a program)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.coaching_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phase_number INTEGER NOT NULL DEFAULT 1,
  duration_weeks INTEGER NOT NULL DEFAULT 4,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_phase_status CHECK (status IN ('active', 'completed', 'upcoming')),
  CONSTRAINT valid_phase_goal CHECK (goal IS NULL OR goal IN (
    'accumulation', 'intensification', 'deload', 'peaking',
    'hypertrophy', 'strength', 'power', 'endurance', 'general'
  ))
);

CREATE INDEX IF NOT EXISTS idx_program_phases_program
  ON public.program_phases(program_id, phase_number);

DROP TRIGGER IF EXISTS set_program_phases_updated_at ON public.program_phases;
CREATE TRIGGER set_program_phases_updated_at
  BEFORE UPDATE ON public.program_phases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.program_phases ENABLE ROW LEVEL SECURITY;

-- Coaches can manage phases of their own programs
CREATE POLICY "Coaches can view phases of own programs"
  ON public.program_phases FOR SELECT
  USING (
    program_id IN (
      SELECT id FROM public.coaching_programs WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert phases"
  ON public.program_phases FOR INSERT
  WITH CHECK (
    program_id IN (
      SELECT id FROM public.coaching_programs WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update phases"
  ON public.program_phases FOR UPDATE
  USING (
    program_id IN (
      SELECT id FROM public.coaching_programs WHERE coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete phases"
  ON public.program_phases FOR DELETE
  USING (
    program_id IN (
      SELECT id FROM public.coaching_programs WHERE coach_id = auth.uid()
    )
  );

-- Clients can view phases of their own programs
CREATE POLICY "Clients can view own program phases"
  ON public.program_phases FOR SELECT
  USING (
    program_id IN (
      SELECT id FROM public.coaching_programs WHERE client_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access to program_phases"
  ON public.program_phases FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. PHASE WORKOUTS (workout templates within a phase)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.phase_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES public.program_phases(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- exercises: [{exercise_id, exercise_name, sets, reps, rir, rest_seconds, notes, order, superset_group}]
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phase_workouts_phase
  ON public.phase_workouts(phase_id, day_number);

DROP TRIGGER IF EXISTS set_phase_workouts_updated_at ON public.phase_workouts;
CREATE TRIGGER set_phase_workouts_updated_at
  BEFORE UPDATE ON public.phase_workouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.phase_workouts ENABLE ROW LEVEL SECURITY;

-- Coaches can manage workouts in their own program phases
CREATE POLICY "Coaches can view phase workouts"
  ON public.phase_workouts FOR SELECT
  USING (
    phase_id IN (
      SELECT pp.id FROM public.program_phases pp
      JOIN public.coaching_programs cp ON pp.program_id = cp.id
      WHERE cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can insert phase workouts"
  ON public.phase_workouts FOR INSERT
  WITH CHECK (
    phase_id IN (
      SELECT pp.id FROM public.program_phases pp
      JOIN public.coaching_programs cp ON pp.program_id = cp.id
      WHERE cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update phase workouts"
  ON public.phase_workouts FOR UPDATE
  USING (
    phase_id IN (
      SELECT pp.id FROM public.program_phases pp
      JOIN public.coaching_programs cp ON pp.program_id = cp.id
      WHERE cp.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can delete phase workouts"
  ON public.phase_workouts FOR DELETE
  USING (
    phase_id IN (
      SELECT pp.id FROM public.program_phases pp
      JOIN public.coaching_programs cp ON pp.program_id = cp.id
      WHERE cp.coach_id = auth.uid()
    )
  );

-- Clients can view workouts in their own programs
CREATE POLICY "Clients can view own phase workouts"
  ON public.phase_workouts FOR SELECT
  USING (
    phase_id IN (
      SELECT pp.id FROM public.program_phases pp
      JOIN public.coaching_programs cp ON pp.program_id = cp.id
      WHERE cp.client_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access to phase_workouts"
  ON public.phase_workouts FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CHECK-IN TEMPLATES (coach creates reusable templates)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.check_in_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- questions: [{id, label, type, options?, required}]
  -- types: scale_1_10, text, single_select, multi_select, number, photo
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_checkin_frequency CHECK (frequency IN ('weekly', 'biweekly', 'monthly'))
);

CREATE INDEX IF NOT EXISTS idx_check_in_templates_coach
  ON public.check_in_templates(coach_id);

DROP TRIGGER IF EXISTS set_check_in_templates_updated_at ON public.check_in_templates;
CREATE TRIGGER set_check_in_templates_updated_at
  BEFORE UPDATE ON public.check_in_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.check_in_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view own templates"
  ON public.check_in_templates FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert templates"
  ON public.check_in_templates FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own templates"
  ON public.check_in_templates FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own templates"
  ON public.check_in_templates FOR DELETE
  USING (coach_id = auth.uid());

-- Clients can view check-in templates assigned by their coach
CREATE POLICY "Clients can view their coach templates"
  ON public.check_in_templates FOR SELECT
  USING (
    coach_id IN (
      SELECT coach_id FROM public.coach_clients
      WHERE client_id = auth.uid() AND status IN ('active', 'paused')
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access to check_in_templates"
  ON public.check_in_templates FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. CHECK-INS (client submissions)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.check_in_templates(id) ON DELETE SET NULL,
  program_id UUID REFERENCES public.coaching_programs(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES public.program_phases(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  responses JSONB DEFAULT '{}'::jsonb,
  coach_feedback TEXT,
  coach_notes TEXT,  -- private, client cannot see
  flag_reasons TEXT[] DEFAULT '{}',
  -- auto-detected flags: weight_stall, missed_workouts, low_energy, pain, compliance_drop
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_checkin_status CHECK (status IN ('pending', 'submitted', 'reviewed', 'flagged'))
);

CREATE INDEX IF NOT EXISTS idx_check_ins_coach
  ON public.check_ins(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_check_ins_client
  ON public.check_ins(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_pending
  ON public.check_ins(coach_id) WHERE status IN ('submitted', 'flagged');

DROP TRIGGER IF EXISTS set_check_ins_updated_at ON public.check_ins;
CREATE TRIGGER set_check_ins_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Coaches can see and manage check-ins from their clients
CREATE POLICY "Coaches can view client check-ins"
  ON public.check_ins FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can update client check-ins"
  ON public.check_ins FOR UPDATE
  USING (coach_id = auth.uid());

-- Clients can view and submit their own check-ins
CREATE POLICY "Clients can view own check-ins"
  ON public.check_ins FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own check-ins"
  ON public.check_ins FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own check-ins"
  ON public.check_ins FOR UPDATE
  USING (client_id = auth.uid() AND status IN ('pending', 'submitted'));

-- Service role bypass
CREATE POLICY "Service role full access to check_ins"
  ON public.check_ins FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. CHECK-IN PHOTOS (progress photos)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.check_in_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id UUID NOT NULL REFERENCES public.check_ins(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_photo_type CHECK (photo_type IN ('front', 'side', 'back', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_check_in_photos_checkin
  ON public.check_in_photos(check_in_id);
CREATE INDEX IF NOT EXISTS idx_check_in_photos_client
  ON public.check_in_photos(client_id, created_at DESC);

ALTER TABLE public.check_in_photos ENABLE ROW LEVEL SECURITY;

-- Coaches can view photos from their clients' check-ins
CREATE POLICY "Coaches can view client check-in photos"
  ON public.check_in_photos FOR SELECT
  USING (
    check_in_id IN (
      SELECT id FROM public.check_ins WHERE coach_id = auth.uid()
    )
  );

-- Clients can manage their own photos
CREATE POLICY "Clients can view own photos"
  ON public.check_in_photos FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own photos"
  ON public.check_in_photos FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can delete own photos"
  ON public.check_in_photos FOR DELETE
  USING (client_id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role full access to check_in_photos"
  ON public.check_in_photos FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. BODY STATS (weight, measurements)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.body_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(4,1),
  -- Measurements (all in cm)
  waist_cm DECIMAL(5,1),
  chest_cm DECIMAL(5,1),
  hips_cm DECIMAL(5,1),
  left_arm_cm DECIMAL(5,1),
  right_arm_cm DECIMAL(5,1),
  left_thigh_cm DECIMAL(5,1),
  right_thigh_cm DECIMAL(5,1),
  neck_cm DECIMAL(5,1),
  shoulders_cm DECIMAL(5,1),
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_stat_source CHECK (source IN ('manual', 'check_in', 'wearable')),
  -- One entry per client per date per source
  CONSTRAINT unique_body_stat_date UNIQUE (client_id, date, source)
);

CREATE INDEX IF NOT EXISTS idx_body_stats_client
  ON public.body_stats(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_body_stats_coach
  ON public.body_stats(coach_id, client_id, date DESC);

ALTER TABLE public.body_stats ENABLE ROW LEVEL SECURITY;

-- Coaches can view their clients' body stats
CREATE POLICY "Coaches can view client body stats"
  ON public.body_stats FOR SELECT
  USING (
    coach_id = auth.uid()
    OR client_id IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Clients can manage their own body stats
CREATE POLICY "Clients can view own body stats"
  ON public.body_stats FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own body stats"
  ON public.body_stats FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own body stats"
  ON public.body_stats FOR UPDATE
  USING (client_id = auth.uid());

CREATE POLICY "Clients can delete own body stats"
  ON public.body_stats FOR DELETE
  USING (client_id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role full access to body_stats"
  ON public.body_stats FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. MESSAGES (coach-client communication)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,  -- derived from coach_id + client_id pair
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  attachment_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_message_type CHECK (message_type IN (
    'text', 'voice', 'image', 'video', 'check_in_response', 'program_update'
  ))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread
  ON public.messages(recipient_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON public.messages(sender_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages they sent or received
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can send messages (insert as sender)
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Recipients can mark messages as read
CREATE POLICY "Recipients can update messages"
  ON public.messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role full access to messages"
  ON public.messages FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. CLIENT SUBSCRIPTIONS (payments via Stripe Connect)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  plan_name TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_sub_interval CHECK (interval IN ('monthly', 'quarterly', 'yearly')),
  CONSTRAINT valid_sub_status CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  CONSTRAINT unique_client_sub UNIQUE (coach_id, client_id, stripe_subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_client_subs_coach
  ON public.client_subscriptions(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_client_subs_client
  ON public.client_subscriptions(client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_subs_stripe
  ON public.client_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

DROP TRIGGER IF EXISTS set_client_subscriptions_updated_at ON public.client_subscriptions;
CREATE TRIGGER set_client_subscriptions_updated_at
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

-- Coaches can view their client subscriptions
CREATE POLICY "Coaches can view own client subscriptions"
  ON public.client_subscriptions FOR SELECT
  USING (coach_id = auth.uid());

-- Clients can view their own subscriptions
CREATE POLICY "Clients can view own subscriptions"
  ON public.client_subscriptions FOR SELECT
  USING (client_id = auth.uid());

-- Only service role can insert/update subscriptions (Stripe webhooks)
CREATE POLICY "Service role full access to client_subscriptions"
  ON public.client_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. HABIT ASSIGNMENTS (coach assigns habits)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.habit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_value INTEGER,
  unit TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_habit_frequency CHECK (frequency IN ('daily', 'weekly'))
);

CREATE INDEX IF NOT EXISTS idx_habit_assignments_coach
  ON public.habit_assignments(coach_id, client_id);
CREATE INDEX IF NOT EXISTS idx_habit_assignments_client
  ON public.habit_assignments(client_id) WHERE active = TRUE;

DROP TRIGGER IF EXISTS set_habit_assignments_updated_at ON public.habit_assignments;
CREATE TRIGGER set_habit_assignments_updated_at
  BEFORE UPDATE ON public.habit_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.habit_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches can manage habits for their clients
CREATE POLICY "Coaches can view own habit assignments"
  ON public.habit_assignments FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can insert habit assignments"
  ON public.habit_assignments FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update own habit assignments"
  ON public.habit_assignments FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own habit assignments"
  ON public.habit_assignments FOR DELETE
  USING (coach_id = auth.uid());

-- Clients can view habits assigned to them
CREATE POLICY "Clients can view own habit assignments"
  ON public.habit_assignments FOR SELECT
  USING (client_id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role full access to habit_assignments"
  ON public.habit_assignments FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. HABIT LOGS (client logs completion)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.habit_assignments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  value DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One log per assignment per date
  CONSTRAINT unique_habit_log_date UNIQUE (assignment_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_assignment
  ON public.habit_logs(assignment_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_logs_client
  ON public.habit_logs(client_id, date DESC);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own habit logs
CREATE POLICY "Clients can view own habit logs"
  ON public.habit_logs FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can insert own habit logs"
  ON public.habit_logs FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own habit logs"
  ON public.habit_logs FOR UPDATE
  USING (client_id = auth.uid());

-- Coaches can view their clients' habit logs
CREATE POLICY "Coaches can view client habit logs"
  ON public.habit_logs FOR SELECT
  USING (
    assignment_id IN (
      SELECT id FROM public.habit_assignments WHERE coach_id = auth.uid()
    )
  );

-- Service role bypass
CREATE POLICY "Service role full access to habit_logs"
  ON public.habit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. COACH ACCESS TO EXISTING WORKOUT DATA
-- Add RLS policies so coaches can view their clients' workout sessions/exercises/sets
-- ─────────────────────────────────────────────────────────────────────────────

-- Coaches can view their active clients' workout sessions
CREATE POLICY "Coaches can view client workout sessions"
  ON public.workout_sessions FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Coaches can view their active clients' workout exercises
CREATE POLICY "Coaches can view client workout exercises"
  ON public.workout_exercises FOR SELECT
  USING (
    session_id IN (
      SELECT ws.id FROM public.workout_sessions ws
      WHERE ws.user_id IN (
        SELECT client_id FROM public.coach_clients
        WHERE coach_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Coaches can view their active clients' workout sets
CREATE POLICY "Coaches can view client workout sets"
  ON public.workout_sets FOR SELECT
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON we.session_id = ws.id
      WHERE ws.user_id IN (
        SELECT client_id FROM public.coach_clients
        WHERE coach_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Coaches can view their active clients' streaks
CREATE POLICY "Coaches can view client streaks"
  ON public.user_streaks FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Coaches can view their active clients' XP
CREATE POLICY "Coaches can view client XP"
  ON public.user_xp FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Coaches can view their active clients' limitations
CREATE POLICY "Coaches can view client limitations"
  ON public.user_limitations FOR SELECT
  USING (
    user_id IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Generate a deterministic conversation_id from two user IDs
-- Always sorts UUIDs so both parties get the same conversation_id
CREATE OR REPLACE FUNCTION public.get_conversation_id(user_a UUID, user_b UUID)
RETURNS UUID AS $$
BEGIN
  IF user_a < user_b THEN
    RETURN gen_random_uuid();  -- In practice, use a deterministic hash
  END IF;
  -- Use md5 to create a deterministic UUID from the pair
  RETURN (
    SELECT uuid(md5(LEAST(user_a::text, user_b::text) || GREATEST(user_a::text, user_b::text)))
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get coach dashboard stats
CREATE OR REPLACE FUNCTION public.get_coach_dashboard(p_coach_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH client_counts AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') AS active_clients,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending_clients,
      COUNT(*) FILTER (WHERE status = 'paused') AS paused_clients
    FROM public.coach_clients
    WHERE coach_id = p_coach_id
  ),
  pending_checkins AS (
    SELECT COUNT(*) AS count
    FROM public.check_ins
    WHERE coach_id = p_coach_id AND status IN ('submitted', 'flagged')
  ),
  unread_messages AS (
    SELECT COUNT(*) AS count
    FROM public.messages
    WHERE recipient_id = p_coach_id AND read_at IS NULL
  ),
  revenue AS (
    SELECT
      COALESCE(SUM(amount_cents) FILTER (WHERE status = 'active'), 0) AS monthly_revenue_cents
    FROM public.client_subscriptions
    WHERE coach_id = p_coach_id
  )
  SELECT jsonb_build_object(
    'activeClients', cc.active_clients,
    'pendingClients', cc.pending_clients,
    'pausedClients', cc.paused_clients,
    'pendingCheckIns', pc.count,
    'unreadMessages', um.count,
    'monthlyRevenueCents', r.monthly_revenue_cents
  )
  INTO v_result
  FROM client_counts cc
  CROSS JOIN pending_checkins pc
  CROSS JOIN unread_messages um
  CROSS JOIN revenue r;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_coach_dashboard(UUID) TO authenticated;

-- Get client compliance summary (for coach's client list view)
CREATE OR REPLACE FUNCTION public.get_client_compliance(p_coach_id UUID, p_client_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH workout_compliance AS (
    SELECT
      COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '7 days') AS workouts_this_week,
      COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '30 days') AS workouts_this_month
    FROM public.workout_sessions
    WHERE user_id = p_client_id
  ),
  habit_compliance AS (
    SELECT
      COUNT(*) FILTER (WHERE completed = TRUE AND date >= NOW() - INTERVAL '7 days') AS habits_completed_week,
      COUNT(*) FILTER (WHERE date >= NOW() - INTERVAL '7 days') AS habits_total_week
    FROM public.habit_logs
    WHERE client_id = p_client_id
  ),
  latest_checkin AS (
    SELECT
      id,
      status,
      submitted_at,
      flag_reasons
    FROM public.check_ins
    WHERE client_id = p_client_id AND coach_id = p_coach_id
    ORDER BY created_at DESC
    LIMIT 1
  ),
  latest_weight AS (
    SELECT weight_kg, date
    FROM public.body_stats
    WHERE client_id = p_client_id AND weight_kg IS NOT NULL
    ORDER BY date DESC
    LIMIT 1
  )
  SELECT jsonb_build_object(
    'workoutsThisWeek', wc.workouts_this_week,
    'workoutsThisMonth', wc.workouts_this_month,
    'habitsCompletedThisWeek', hc.habits_completed_week,
    'habitsTotalThisWeek', hc.habits_total_week,
    'habitCompliancePct', CASE
      WHEN hc.habits_total_week > 0
      THEN ROUND(100.0 * hc.habits_completed_week / hc.habits_total_week)
      ELSE NULL
    END,
    'latestCheckIn', CASE
      WHEN lc.id IS NOT NULL THEN jsonb_build_object(
        'id', lc.id,
        'status', lc.status,
        'submittedAt', lc.submitted_at,
        'flagReasons', lc.flag_reasons
      )
      ELSE NULL
    END,
    'latestWeight', CASE
      WHEN lw.weight_kg IS NOT NULL THEN jsonb_build_object(
        'weightKg', lw.weight_kg,
        'date', lw.date
      )
      ELSE NULL
    END
  )
  INTO v_result
  FROM workout_compliance wc
  CROSS JOIN habit_compliance hc
  LEFT JOIN latest_checkin lc ON TRUE
  LEFT JOIN latest_weight lw ON TRUE;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_client_compliance(UUID, UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. STORAGE BUCKETS FOR PROGRESS PHOTOS
-- ─────────────────────────────────────────────────────────────────────────────

-- Create storage bucket for check-in photos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'check-in-photos',
  'check-in-photos',
  FALSE,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: clients can upload to their own folder
CREATE POLICY "Clients can upload check-in photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'check-in-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients can view own check-in photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'check-in-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Coaches can view their clients' photos
CREATE POLICY "Coaches can view client check-in photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'check-in-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. REALTIME SUBSCRIPTIONS (enable for messaging)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_ins;

-- ─────────────────────────────────────────────────────────────────────────────
-- ANALYZE new tables for query planner
-- ─────────────────────────────────────────────────────────────────────────────

ANALYZE public.coaches;
ANALYZE public.coach_clients;
ANALYZE public.coaching_programs;
ANALYZE public.program_phases;
ANALYZE public.phase_workouts;
ANALYZE public.check_in_templates;
ANALYZE public.check_ins;
ANALYZE public.check_in_photos;
ANALYZE public.body_stats;
ANALYZE public.messages;
ANALYZE public.client_subscriptions;
ANALYZE public.habit_assignments;
ANALYZE public.habit_logs;
