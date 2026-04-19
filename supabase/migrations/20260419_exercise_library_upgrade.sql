-- ============================================================================
-- EXERCISE LIBRARY UPGRADE
-- Adds coaching fields: instructions, cues, muscles, equipment category
-- Supports coach-specific overrides per exercise
-- ============================================================================

-- Expand exercises table with coaching data
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS coaching_cues TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS common_mistakes TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS primary_muscles TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS force TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS mechanic TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'intermediate';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Coach-specific exercise overrides (coaches can customize cues per exercise)
CREATE TABLE IF NOT EXISTS public.exercise_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  custom_cues TEXT[] DEFAULT '{}',
  custom_notes TEXT,
  custom_video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_coach_exercise_override UNIQUE (coach_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_overrides_coach
  ON exercise_overrides(coach_id);

ALTER TABLE exercise_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches manage own overrides"
  ON exercise_overrides FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Clients can read coach overrides"
  ON exercise_overrides FOR SELECT
  USING (
    coach_id IN (
      SELECT coach_id FROM coach_clients
      WHERE client_id = auth.uid() AND status = 'active'
    )
  );

DROP TRIGGER IF EXISTS set_exercise_overrides_updated_at ON exercise_overrides;
CREATE TRIGGER set_exercise_overrides_updated_at
  BEFORE UPDATE ON exercise_overrides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Better index for exercise search
CREATE INDEX IF NOT EXISTS idx_exercises_name_search
  ON exercises USING gin (to_tsvector('english', name));

ANALYZE exercises;
ANALYZE exercise_overrides;
