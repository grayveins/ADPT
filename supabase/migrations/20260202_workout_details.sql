-- Workout Details Migration
-- Adds tables for storing complete workout data (exercises, sets) and streak tracking

--------------------------------------------------------------------------------
-- WORKOUT EXERCISES TABLE
-- Links exercises to workout sessions with order tracking
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session 
  ON public.workout_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise 
  ON public.workout_exercises(exercise_id);

--------------------------------------------------------------------------------
-- WORKOUT SETS TABLE
-- Individual set data with weight, reps, and RIR tracking
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight_lbs DECIMAL(7,2),           -- Weight in pounds (imperial default)
  reps INTEGER,                       -- Number of reps performed
  rir INTEGER CHECK (rir >= 0 AND rir <= 4),  -- Reps In Reserve (0=failure, 4=easy)
  is_warmup BOOLEAN NOT NULL DEFAULT FALSE,
  is_pr BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise 
  ON public.workout_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_pr 
  ON public.workout_sets(is_pr) WHERE is_pr = TRUE;

--------------------------------------------------------------------------------
-- USER STREAKS TABLE
-- Tracks workout consistency streaks
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  streak_freeze_available BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by date
CREATE INDEX IF NOT EXISTS idx_user_streaks_date 
  ON public.user_streaks(last_workout_date);

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS set_user_streaks_updated_at ON public.user_streaks;
CREATE TRIGGER set_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

--------------------------------------------------------------------------------
-- PERSONAL RECORDS VIEW
-- Aggregates best lifts per exercise per user for quick PR lookups
--------------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.user_personal_records AS
SELECT 
  ws.user_id,
  we.exercise_id,
  we.exercise_name,
  MAX(wset.weight_lbs) as max_weight_lbs,
  MAX(wset.reps) FILTER (WHERE wset.weight_lbs = (
    SELECT MAX(ws2.weight_lbs) 
    FROM public.workout_sets ws2 
    JOIN public.workout_exercises we2 ON ws2.workout_exercise_id = we2.id
    WHERE we2.exercise_name = we.exercise_name 
    AND we2.session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = ws.user_id)
  )) as reps_at_max_weight,
  MAX(wset.weight_lbs * wset.reps) as max_volume_single_set,
  COUNT(DISTINCT wset.id) FILTER (WHERE wset.is_pr = TRUE) as total_prs,
  MAX(wset.completed_at) FILTER (WHERE wset.is_pr = TRUE) as last_pr_date
FROM public.workout_sessions ws
JOIN public.workout_exercises we ON we.session_id = ws.id
JOIN public.workout_sets wset ON wset.workout_exercise_id = we.id
WHERE wset.is_warmup = FALSE
GROUP BY ws.user_id, we.exercise_id, we.exercise_name;

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- workout_exercises policies
CREATE POLICY "Users can view own workout exercises" 
  ON public.workout_exercises FOR SELECT 
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout exercises" 
  ON public.workout_exercises FOR INSERT 
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout exercises" 
  ON public.workout_exercises FOR UPDATE 
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout exercises" 
  ON public.workout_exercises FOR DELETE 
  USING (
    session_id IN (
      SELECT id FROM public.workout_sessions WHERE user_id = auth.uid()
    )
  );

-- workout_sets policies
CREATE POLICY "Users can view own workout sets" 
  ON public.workout_sets FOR SELECT 
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON we.session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own workout sets" 
  ON public.workout_sets FOR INSERT 
  WITH CHECK (
    workout_exercise_id IN (
      SELECT we.id FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON we.session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout sets" 
  ON public.workout_sets FOR UPDATE 
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON we.session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout sets" 
  ON public.workout_sets FOR DELETE 
  USING (
    workout_exercise_id IN (
      SELECT we.id FROM public.workout_exercises we
      JOIN public.workout_sessions ws ON we.session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

-- user_streaks policies
CREATE POLICY "Users can view own streaks" 
  ON public.user_streaks FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks" 
  ON public.user_streaks FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own streaks" 
  ON public.user_streaks FOR UPDATE 
  USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- HELPER FUNCTION: Update streak on workout completion
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  is_new_record BOOLEAN
) AS $$
DECLARE
  v_last_date DATE;
  v_current INTEGER;
  v_longest INTEGER;
  v_today DATE := CURRENT_DATE;
  v_is_new_record BOOLEAN := FALSE;
BEGIN
  -- Get current streak data
  SELECT us.last_workout_date, us.current_streak, us.longest_streak
  INTO v_last_date, v_current, v_longest
  FROM public.user_streaks us
  WHERE us.user_id = p_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_workout_date)
    VALUES (p_user_id, 1, 1, v_today);
    
    RETURN QUERY SELECT 1, 1, TRUE;
    RETURN;
  END IF;

  -- If already worked out today, no change
  IF v_last_date = v_today THEN
    RETURN QUERY SELECT v_current, v_longest, FALSE;
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    v_current := v_current + 1;
  ELSIF v_last_date < v_today - INTERVAL '1 day' THEN
    -- Streak broken - reset to 1
    v_current := 1;
  END IF;

  -- Check for new record
  IF v_current > v_longest THEN
    v_longest := v_current;
    v_is_new_record := TRUE;
  END IF;

  -- Update the record
  UPDATE public.user_streaks
  SET 
    current_streak = v_current,
    longest_streak = v_longest,
    last_workout_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current, v_longest, v_is_new_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID) TO authenticated;
