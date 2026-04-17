-- Workout Templates (Hevy-style)
-- Save any workout as a reusable template

CREATE TABLE IF NOT EXISTS public.workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  times_used INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  source_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user
  ON public.workout_templates(user_id, updated_at DESC);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates: select own" ON public.workout_templates
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Templates: insert own" ON public.workout_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Templates: update own" ON public.workout_templates
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Templates: delete own" ON public.workout_templates
  FOR DELETE USING (user_id = auth.uid());

-- Auto-update timestamp trigger (reuse existing function)
CREATE TRIGGER set_workout_templates_updated_at
  BEFORE UPDATE ON public.workout_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add exercise notes and superset group_id to workout_exercises
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS group_id TEXT;
