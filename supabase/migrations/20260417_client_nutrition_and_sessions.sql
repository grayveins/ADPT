-- ============================================================================
-- CLIENT NUTRITION & SESSIONS
-- Tables: client_macros, meal_plans, sessions, coach_notes
-- Storage: meal-plans bucket for PDF uploads
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CLIENT MACROS (coach-set nutrition targets)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_macros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  calories INTEGER,
  protein_g INTEGER,
  carbs_g INTEGER,
  fat_g INTEGER,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_client_macros_date UNIQUE (client_id, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_client_macros_client
  ON public.client_macros(client_id, effective_from DESC);

ALTER TABLE public.client_macros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage client macros"
  ON public.client_macros FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can view own macros"
  ON public.client_macros FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Service role full access to client_macros"
  ON public.client_macros FOR ALL
  USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS set_client_macros_updated_at ON public.client_macros;
CREATE TRIGGER set_client_macros_updated_at
  BEFORE UPDATE ON public.client_macros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MEAL PLANS (PDF uploads per client)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_client
  ON public.meal_plans(client_id, uploaded_at DESC);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage meal plans"
  ON public.meal_plans FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can view own meal plans"
  ON public.meal_plans FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Service role full access to meal_plans"
  ON public.meal_plans FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SESSIONS (in-person session bookings)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_session_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_client
  ON public.sessions(client_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_coach
  ON public.sessions(coach_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_upcoming
  ON public.sessions(client_id, scheduled_at)
  WHERE status = 'scheduled';

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage sessions"
  ON public.sessions FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can view own sessions"
  ON public.sessions FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Service role full access to sessions"
  ON public.sessions FOR ALL
  USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS set_sessions_updated_at ON public.sessions;
CREATE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COACH NOTES (private notes per client)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_notes_client
  ON public.coach_notes(coach_id, client_id, created_at DESC);

ALTER TABLE public.coach_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own notes"
  ON public.coach_notes FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Service role full access to coach_notes"
  ON public.coach_notes FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. MEAL PLANS STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-plans',
  'meal-plans',
  FALSE,
  20971520,  -- 20MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Coaches can upload meal plans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal-plans'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients can view own meal plans"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'meal-plans'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
    OR (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ANALYZE new tables
-- ─────────────────────────────────────────────────────────────────────────────

ANALYZE public.client_macros;
ANALYZE public.meal_plans;
ANALYZE public.sessions;
ANALYZE public.coach_notes;
