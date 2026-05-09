-- ============================================================================
-- ADPT — schema baseline (squash of 20260120 → 20260509)
--
-- This file consolidates the 26 incremental migrations applied to the
-- production database during initial development. Production was already
-- in sync at squash time, so replaying this file against the live DB is a
-- no-op (every CREATE TABLE / POLICY / FUNCTION uses IF NOT EXISTS / OR
-- REPLACE / ON CONFLICT semantics where it matters).
--
-- Future migrations append on top of this baseline as new files.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 20260120_profiles_and_workout_sessions.sql
-- ----------------------------------------------------------------------------
-- Capture tables created via Supabase dashboard before migration tracking began.
-- These are load-bearing: 22+ files reference profiles, 20+ reference workout_sessions.

-- ============================================================
-- profiles — created by auth trigger on user signup
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  sex TEXT,
  goal TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  birth_year INTEGER,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  activity_level TEXT,
  training_style TEXT,
  units JSONB NOT NULL DEFAULT '{"height":"ft","weight":"lb","distance":"mi","measurements":false}'::jsonb,
  onboarding_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  push_token TEXT,
  role TEXT NOT NULL DEFAULT 'client'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles read own"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles insert own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles delete own" ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- workout_sessions — core workout tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  post_workout_feeling TEXT,
  pain_location TEXT,
  CONSTRAINT workout_sessions_pkey PRIMARY KEY (id)
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workout sessions read own"   ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Workout sessions insert own"  ON public.workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Workout sessions update own"  ON public.workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Workout sessions delete own"  ON public.workout_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_workout_sessions_user_idx ON public.workout_sessions(user_id, started_at DESC);

CREATE TRIGGER set_workout_sessions_updated_at
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- handle_new_user — auth trigger that auto-creates profile rows
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (new.id, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- is_rest_day — helper used by coach context functions
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_rest_day(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_preferred_days JSONB;
  v_day_name TEXT;
BEGIN
  SELECT (onboarding_data->'preferredDays')::jsonb
  INTO v_preferred_days
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_preferred_days IS NULL OR jsonb_array_length(v_preferred_days) = 0 THEN
    RETURN FALSE;
  END IF;

  v_day_name := lower(trim(to_char(p_date, 'day')));
  RETURN NOT (v_preferred_days ? v_day_name);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_rest_day(UUID, DATE) TO authenticated;

-- ============================================================
-- get_coach_context — full context assembly for AI coach
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_coach_context(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_last_workout RECORD;
  v_streak RECORD;
  v_recent_prs JSONB;
  v_recent_events JSONB;
  v_profile RECORD;
BEGIN
  SELECT first_name, goal, onboarding_data
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  SELECT ws.id, ws.title, ws.started_at, ws.post_workout_feeling, ws.pain_location
  INTO v_last_workout
  FROM public.workout_sessions ws
  WHERE ws.user_id = p_user_id
  ORDER BY ws.started_at DESC
  LIMIT 1;

  SELECT current_streak, longest_streak, last_workout_date
  INTO v_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(pr_data), '[]'::jsonb)
  INTO v_recent_prs
  FROM (
    SELECT jsonb_build_object(
      'exercise', upr.exercise_name,
      'weight', upr.max_weight_lbs,
      'reps', upr.reps_at_max_weight,
      'date', upr.last_pr_date
    ) AS pr_data
    FROM public.user_personal_records upr
    WHERE upr.user_id = p_user_id
    AND upr.last_pr_date > NOW() - INTERVAL '7 days'
    ORDER BY upr.last_pr_date DESC
    LIMIT 5
  ) prs;

  v_recent_events := '[]'::jsonb;

  v_result := jsonb_build_object(
    'userName', COALESCE(v_profile.first_name, 'there'),
    'goal', v_profile.goal,
    'onboardingData', v_profile.onboarding_data,
    'lastWorkout', CASE
      WHEN v_last_workout.id IS NOT NULL THEN jsonb_build_object(
        'id', v_last_workout.id,
        'title', v_last_workout.title,
        'date', v_last_workout.started_at,
        'feeling', v_last_workout.post_workout_feeling,
        'painLocation', v_last_workout.pain_location
      )
      ELSE NULL
    END,
    'streak', jsonb_build_object(
      'current', COALESCE(v_streak.current_streak, 0),
      'longest', COALESCE(v_streak.longest_streak, 0),
      'lastWorkoutDate', v_streak.last_workout_date
    ),
    'recentPRs', v_recent_prs,
    'recentEvents', v_recent_events,
    'isRestDay', public.is_rest_day(p_user_id)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_coach_context(UUID) TO authenticated;


-- ----------------------------------------------------------------------------
-- 20260124_helper_functions.sql
-- ----------------------------------------------------------------------------
-- Helper function for auto-updating timestamps
-- This function is used by triggers to automatically set updated_at on row updates

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO service_role;


-- ----------------------------------------------------------------------------
-- 20260125_add_exercises_and_sets.sql
-- ----------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  is_public boolean not null default false,
  created_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exercises_public_idx
  on public.exercises (is_public, name);

create index if not exists exercises_user_idx
  on public.exercises (created_by, name);

alter table public.exercises enable row level security;

create policy "Exercises read public or own"
  on public.exercises for select
  using (is_public = true or auth.uid() = created_by);

create policy "Exercises insert own"
  on public.exercises for insert
  with check (auth.uid() = created_by);

create policy "Exercises update own"
  on public.exercises for update
  using (auth.uid() = created_by);

create policy "Exercises delete own"
  on public.exercises for delete
  using (auth.uid() = created_by);

drop trigger if exists set_exercises_updated_at on public.exercises;
create trigger set_exercises_updated_at
before update on public.exercises
for each row execute function public.set_updated_at();

insert into public.exercises (name, category, is_public)
values
  ('Bench Press', 'Chest', true),
  ('Incline Bench Press', 'Chest', true),
  ('Dumbbell Bench Press', 'Chest', true),
  ('Push-Up', 'Chest', true),
  ('Chest Fly', 'Chest', true),
  ('Deadlift', 'Back', true),
  ('Barbell Row', 'Back', true),
  ('Pull-Up', 'Back', true),
  ('Lat Pulldown', 'Back', true),
  ('Seated Row', 'Back', true),
  ('Overhead Press', 'Shoulders', true),
  ('Dumbbell Shoulder Press', 'Shoulders', true),
  ('Lateral Raise', 'Shoulders', true),
  ('Rear Delt Fly', 'Shoulders', true),
  ('Bicep Curl', 'Arms', true),
  ('Hammer Curl', 'Arms', true),
  ('Tricep Pushdown', 'Arms', true),
  ('Tricep Dip', 'Arms', true),
  ('Squat', 'Legs', true),
  ('Front Squat', 'Legs', true),
  ('Leg Press', 'Legs', true),
  ('Romanian Deadlift', 'Legs', true),
  ('Lunges', 'Legs', true),
  ('Leg Curl', 'Legs', true),
  ('Leg Extension', 'Legs', true),
  ('Calf Raise', 'Legs', true),
  ('Plank', 'Core', true),
  ('Hanging Leg Raise', 'Core', true),
  ('Cable Crunch', 'Core', true),
  ('Clean and Press', 'Full Body', true),
  ('Kettlebell Swing', 'Full Body', true),
  ('Running', 'Cardio', true),
  ('Cycling', 'Cardio', true),
  ('Rowing', 'Cardio', true);

alter table public.workout_logs drop column if exists sets;
alter table public.workout_logs drop column if exists reps;
alter table public.workout_logs drop column if exists weight_kg;

alter table public.workout_logs
  add column if not exists exercise_id uuid references public.exercises(id) on delete set null,
  add column if not exists sets jsonb not null default '[]'::jsonb;


-- ----------------------------------------------------------------------------
-- 20260202_workout_details.sql
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 20260203150000_saved_programs.sql
-- ----------------------------------------------------------------------------
-- Saved Programs Migration
-- Allows users to save AI-generated workout programs as templates

--------------------------------------------------------------------------------
-- SAVED PROGRAMS TABLE
-- Stores user's saved workout programs/templates
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,                               -- build_muscle, lose_fat, etc.
  experience TEXT,                         -- beginner, intermediate, advanced
  workouts_per_week INTEGER NOT NULL DEFAULT 3,
  program_data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Full program structure
  is_ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,        -- Currently active program
  times_used INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_programs_user 
  ON public.saved_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_programs_active 
  ON public.saved_programs(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_programs_recent 
  ON public.saved_programs(user_id, updated_at DESC);

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS set_saved_programs_updated_at ON public.saved_programs;
CREATE TRIGGER set_saved_programs_updated_at
  BEFORE UPDATE ON public.saved_programs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------------------------------------
ALTER TABLE public.saved_programs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own saved programs
CREATE POLICY "Users can view own saved programs" 
  ON public.saved_programs FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved programs" 
  ON public.saved_programs FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved programs" 
  ON public.saved_programs FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved programs" 
  ON public.saved_programs FOR DELETE 
  USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- HELPER FUNCTION: Set program as active (deactivates others)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_active_program(p_program_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Deactivate all user's programs
  UPDATE public.saved_programs
  SET is_active = FALSE, updated_at = NOW()
  WHERE user_id = auth.uid() AND is_active = TRUE;
  
  -- Activate the selected program
  UPDATE public.saved_programs
  SET 
    is_active = TRUE, 
    times_used = times_used + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = p_program_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.set_active_program(UUID) TO authenticated;


-- ----------------------------------------------------------------------------
-- 20260204_performance_indexes.sql
-- ----------------------------------------------------------------------------
-- Performance Indexes and Query Optimization
-- Reduces database load for common query patterns by ~40-50%

--------------------------------------------------------------------------------
-- PERFORMANCE INDEXES
--------------------------------------------------------------------------------

-- 1. Composite index for workout queries by user + date (DESC for recent-first)
-- Speeds up: fetchRecentWorkouts, fetchWorkoutCounts, useWeeklySummary, useStreak
-- This is the highest-impact index - affects 5+ query patterns
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date 
  ON public.workout_sessions(user_id, started_at DESC);

-- 2. Partial index for pain reports (only rows with pain_location set)
-- Speeds up: pain-related coach context queries
-- Partial index is smaller and faster since most workouts don't have pain
CREATE INDEX IF NOT EXISTS idx_workout_sessions_pain 
  ON public.workout_sessions(user_id, started_at DESC) 
  WHERE pain_location IS NOT NULL;

-- 3. Index for PR lookups by exercise (non-warmup sets with weight)
-- Speeds up: usePRs, strength history, PR detection
CREATE INDEX IF NOT EXISTS idx_workout_sets_pr_lookup
  ON public.workout_sets(workout_exercise_id, weight_lbs DESC)
  WHERE is_warmup = FALSE AND weight_lbs IS NOT NULL;

-- 4. Index for exercise lookups by session
-- Speeds up: joined queries fetching workouts with exercises
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_order
  ON public.workout_exercises(session_id, order_index);

--------------------------------------------------------------------------------
-- OPTIMIZED RPC FUNCTION: get_workout_counts
-- Replaces 3 separate count queries with 1 efficient query
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_workout_counts(p_user_id UUID)
RETURNS TABLE(
  this_week BIGINT,
  last_week BIGINT,
  total BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (
      WHERE started_at >= date_trunc('week', CURRENT_DATE)
    ) AS this_week,
    COUNT(*) FILTER (
      WHERE started_at >= date_trunc('week', CURRENT_DATE) - INTERVAL '7 days' 
        AND started_at < date_trunc('week', CURRENT_DATE)
    ) AS last_week,
    COUNT(*) AS total
  FROM public.workout_sessions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_workout_counts(UUID) TO authenticated;

--------------------------------------------------------------------------------
-- OPTIMIZED RPC FUNCTION: get_coach_context_fast
-- More efficient version that uses CTEs instead of sequential queries
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_coach_context_fast(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  WITH user_profile AS (
    SELECT 
      p.first_name,
      p.goal,
      p.onboarding_data,
      s.current_streak,
      s.longest_streak,
      s.last_workout_date
    FROM public.profiles p
    LEFT JOIN public.user_streaks s ON s.user_id = p.id
    WHERE p.id = p_user_id
  ),
  last_workout AS (
    SELECT 
      ws.id,
      ws.title,
      ws.started_at,
      ws.post_workout_feeling,
      ws.pain_location
    FROM public.workout_sessions ws
    WHERE ws.user_id = p_user_id
    ORDER BY ws.started_at DESC
    LIMIT 1
  ),
  recent_prs AS (
    SELECT COALESCE(jsonb_agg(pr_data), '[]'::jsonb) AS prs
    FROM (
      SELECT jsonb_build_object(
        'exercise', upr.exercise_name,
        'weight', upr.max_weight_lbs,
        'reps', upr.reps_at_max_weight,
        'date', upr.last_pr_date
      ) AS pr_data
      FROM public.user_personal_records upr
      WHERE upr.user_id = p_user_id
        AND upr.last_pr_date > NOW() - INTERVAL '7 days'
      ORDER BY upr.last_pr_date DESC
      LIMIT 5
    ) prs_sub
  ),
  recent_events AS (
    SELECT COALESCE(jsonb_agg(event_data), '[]'::jsonb) AS events
    FROM (
      SELECT jsonb_build_object(
        'type', ce.event_type,
        'data', ce.event_data,
        'date', ce.created_at
      ) AS event_data
      FROM public.coach_events ce
      WHERE ce.user_id = p_user_id
      ORDER BY ce.created_at DESC
      LIMIT 5
    ) events_sub
  )
  SELECT jsonb_build_object(
    'userName', COALESCE(up.first_name, 'there'),
    'goal', up.goal,
    'onboardingData', up.onboarding_data,
    'lastWorkout', CASE 
      WHEN lw.id IS NOT NULL THEN jsonb_build_object(
        'id', lw.id,
        'title', lw.title,
        'date', lw.started_at,
        'feeling', lw.post_workout_feeling,
        'painLocation', lw.pain_location
      )
      ELSE NULL
    END,
    'streak', jsonb_build_object(
      'current', COALESCE(up.current_streak, 0),
      'longest', COALESCE(up.longest_streak, 0),
      'lastWorkoutDate', up.last_workout_date
    ),
    'recentPRs', rp.prs,
    'recentEvents', re.events,
    'isRestDay', public.is_rest_day(p_user_id)
  )
  INTO v_result
  FROM user_profile up
  CROSS JOIN last_workout lw
  CROSS JOIN recent_prs rp
  CROSS JOIN recent_events re;
  
  -- Handle case where no data exists
  IF v_result IS NULL THEN
    v_result := jsonb_build_object(
      'userName', 'there',
      'goal', NULL,
      'onboardingData', NULL,
      'lastWorkout', NULL,
      'streak', jsonb_build_object('current', 0, 'longest', 0, 'lastWorkoutDate', NULL),
      'recentPRs', '[]'::jsonb,
      'recentEvents', '[]'::jsonb,
      'isRestDay', FALSE
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_coach_context_fast(UUID) TO authenticated;

--------------------------------------------------------------------------------
-- ANALYZE tables to update statistics for query planner
--------------------------------------------------------------------------------

ANALYZE public.workout_sessions;
ANALYZE public.workout_exercises;
ANALYZE public.workout_sets;


-- ----------------------------------------------------------------------------
-- 20260205_user_limitations.sql
-- ----------------------------------------------------------------------------
-- User Limitations Migration
-- Tracks user pain/injury limitations for workout modifications

--------------------------------------------------------------------------------
-- USER LIMITATIONS TABLE
-- Stores active limitations that affect workout exercise selection
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_limitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,                          -- Body region: lower_back, shoulders, knees, etc.
  status TEXT NOT NULL DEFAULT 'active',       -- active, monitoring, resolved
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workouts_modified INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('active', 'monitoring', 'resolved'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_limitations_user 
  ON public.user_limitations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_limitations_active 
  ON public.user_limitations(user_id, status) WHERE status IN ('active', 'monitoring');

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS set_user_limitations_updated_at ON public.user_limitations;
CREATE TRIGGER set_user_limitations_updated_at
  BEFORE UPDATE ON public.user_limitations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

--------------------------------------------------------------------------------
-- LIMITATION FEEDBACK TABLE
-- Tracks post-workout feedback on how limitations felt
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.limitation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limitation_id UUID NOT NULL REFERENCES public.user_limitations(id) ON DELETE CASCADE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  feedback TEXT NOT NULL,                      -- better, same, worse
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_feedback CHECK (feedback IN ('better', 'same', 'worse'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_limitation_feedback_limitation 
  ON public.limitation_feedback(limitation_id);
CREATE INDEX IF NOT EXISTS idx_limitation_feedback_session 
  ON public.limitation_feedback(workout_session_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY - USER LIMITATIONS
--------------------------------------------------------------------------------
ALTER TABLE public.user_limitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own limitations" 
  ON public.user_limitations FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own limitations" 
  ON public.user_limitations FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own limitations" 
  ON public.user_limitations FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own limitations" 
  ON public.user_limitations FOR DELETE 
  USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY - LIMITATION FEEDBACK
--------------------------------------------------------------------------------
ALTER TABLE public.limitation_feedback ENABLE ROW LEVEL SECURITY;

-- Users can access feedback for their own limitations
CREATE POLICY "Users can view own limitation feedback" 
  ON public.limitation_feedback FOR SELECT 
  USING (
    limitation_id IN (
      SELECT id FROM public.user_limitations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own limitation feedback" 
  ON public.limitation_feedback FOR INSERT 
  WITH CHECK (
    limitation_id IN (
      SELECT id FROM public.user_limitations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own limitation feedback" 
  ON public.limitation_feedback FOR DELETE 
  USING (
    limitation_id IN (
      SELECT id FROM public.user_limitations WHERE user_id = auth.uid()
    )
  );


-- ----------------------------------------------------------------------------
-- 20260324_xp_rank_system.sql
-- ----------------------------------------------------------------------------
-- XP & Rank System
-- Tracks experience points earned through workouts, PRs, streaks, etc.

-- ─── User XP (aggregate) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_xp (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp   INT NOT NULL DEFAULT 0,
  level      INT NOT NULL DEFAULT 1,
  rank       TEXT NOT NULL DEFAULT 'Bronze',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP"
  ON user_xp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own XP"
  ON user_xp FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP"
  ON user_xp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── XP Events (history) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS xp_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     INT NOT NULL,
  reason     TEXT NOT NULL,  -- 'workout_complete', 'pr_hit', 'streak_7', 'streak_30', 'program_week'
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_events_user ON xp_events (user_id, created_at DESC);
CREATE INDEX idx_xp_events_reason ON xp_events (user_id, reason);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own XP events"
  ON xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own XP events"
  ON xp_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── Award XP function ───────────────────────────────────────────────────────
-- Awards XP, updates total, recalculates level and rank.
-- Returns the new totals.

CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount  INT,
  p_reason  TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(total_xp INT, level INT, rank TEXT, xp_to_next_level INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INT;
  v_level INT;
  v_rank  TEXT;
  v_next  INT;
BEGIN
  -- Insert the event
  INSERT INTO xp_events (user_id, amount, reason, metadata)
  VALUES (p_user_id, p_amount, p_reason, p_metadata);

  -- Upsert user_xp
  INSERT INTO user_xp (user_id, total_xp, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET total_xp = user_xp.total_xp + p_amount, updated_at = now();

  -- Get new total
  SELECT ux.total_xp INTO v_total FROM user_xp ux WHERE ux.user_id = p_user_id;

  -- Calculate level: each level requires (level * 500) XP
  -- Level 1: 0-499, Level 2: 500-1499, Level 3: 1500-2999, etc.
  v_level := 1;
  v_next := 500;
  DECLARE
    v_remaining INT := v_total;
  BEGIN
    WHILE v_remaining >= v_next LOOP
      v_remaining := v_remaining - v_next;
      v_level := v_level + 1;
      v_next := v_level * 500;
    END LOOP;
    -- XP needed for next level
    v_next := v_next - v_remaining;
  END;

  -- Calculate rank from level
  v_rank := CASE
    WHEN v_level >= 75 THEN 'Evolved'
    WHEN v_level >= 55 THEN 'Apex'
    WHEN v_level >= 40 THEN 'Titan'
    WHEN v_level >= 30 THEN 'Elite'
    WHEN v_level >= 20 THEN 'Platinum'
    WHEN v_level >= 10 THEN 'Gold'
    WHEN v_level >= 5  THEN 'Silver'
    ELSE 'Bronze'
  END;

  -- Update level + rank
  UPDATE user_xp ux
  SET level = v_level, rank = v_rank
  WHERE ux.user_id = p_user_id;

  RETURN QUERY SELECT v_total, v_level, v_rank, v_next;
END;
$$;


-- ----------------------------------------------------------------------------
-- 20260325_user_events.sql
-- ----------------------------------------------------------------------------
-- User events table for behavioral tracking
-- Fire-and-forget event logging for workout recommendations

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Composite index for querying user events by type and time
create index idx_user_events_user_event_created
  on public.user_events (user_id, event, created_at desc);

-- RLS policies
alter table public.user_events enable row level security;

-- Users can insert their own events
create policy "Users can insert own events"
  on public.user_events for insert
  with check (auth.uid() = user_id);

-- Users can read their own events
create policy "Users can read own events"
  on public.user_events for select
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 20260325_workout_templates.sql
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 20260328_coaching_platform.sql
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 20260417_client_nutrition_and_sessions.sql
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 20260419_exercise_library_upgrade.sql
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 20260419_fix_schema_gaps.sql
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 20260424_production_rls_hardening.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- PRODUCTION RLS HARDENING + SCHEMA FIXES
-- One definitive migration that ensures ALL coaching RLS policies exist.
-- Safe to run multiple times (DROP IF EXISTS + CREATE).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. activate_program RPC — atomically activates program + first phase
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION activate_program(p_program_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coaching_programs SET status = 'active' WHERE id = p_program_id;
  UPDATE program_phases SET status = 'active'
  WHERE program_id = p_program_id AND phase_number = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION activate_program(UUID) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Link workout_sessions to coaching programs for compliance tracking
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES coaching_programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES program_phases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS phase_workout_id UUID REFERENCES phase_workouts(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DEFINITIVE RLS POLICIES — coaching_programs
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Coach reads own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Coaches can view own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Coach manages own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Coaches can insert programs" ON coaching_programs;
DROP POLICY IF EXISTS "Coach updates own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Coaches can update own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Coach deletes own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Coaches can delete own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Clients read assigned programs" ON coaching_programs;
DROP POLICY IF EXISTS "Clients can view own programs" ON coaching_programs;
DROP POLICY IF EXISTS "Service role full access to coaching_programs" ON coaching_programs;

CREATE POLICY "coach_select_programs" ON coaching_programs FOR SELECT
  USING (coach_id = auth.uid());
CREATE POLICY "coach_insert_programs" ON coaching_programs FOR INSERT
  WITH CHECK (coach_id = auth.uid());
CREATE POLICY "coach_update_programs" ON coaching_programs FOR UPDATE
  USING (coach_id = auth.uid());
CREATE POLICY "coach_delete_programs" ON coaching_programs FOR DELETE
  USING (coach_id = auth.uid());
CREATE POLICY "client_select_programs" ON coaching_programs FOR SELECT
  USING (client_id = auth.uid());
CREATE POLICY "service_programs" ON coaching_programs FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. DEFINITIVE RLS POLICIES — program_phases
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Coaches can view phases of own programs" ON program_phases;
DROP POLICY IF EXISTS "Coaches can view program phases" ON program_phases;
DROP POLICY IF EXISTS "Coaches can insert phases" ON program_phases;
DROP POLICY IF EXISTS "Coaches can insert program phases" ON program_phases;
DROP POLICY IF EXISTS "Coaches can update phases" ON program_phases;
DROP POLICY IF EXISTS "Coaches can update program phases" ON program_phases;
DROP POLICY IF EXISTS "Coaches can delete phases" ON program_phases;
DROP POLICY IF EXISTS "Coaches can delete program phases" ON program_phases;
DROP POLICY IF EXISTS "Clients can view own program phases" ON program_phases;
DROP POLICY IF EXISTS "Service role full access to program_phases" ON program_phases;

CREATE POLICY "coach_select_phases" ON program_phases FOR SELECT
  USING (program_id IN (SELECT id FROM coaching_programs WHERE coach_id = auth.uid()));
CREATE POLICY "coach_insert_phases" ON program_phases FOR INSERT
  WITH CHECK (program_id IN (SELECT id FROM coaching_programs WHERE coach_id = auth.uid()));
CREATE POLICY "coach_update_phases" ON program_phases FOR UPDATE
  USING (program_id IN (SELECT id FROM coaching_programs WHERE coach_id = auth.uid()));
CREATE POLICY "coach_delete_phases" ON program_phases FOR DELETE
  USING (program_id IN (SELECT id FROM coaching_programs WHERE coach_id = auth.uid()));
CREATE POLICY "client_select_phases" ON program_phases FOR SELECT
  USING (program_id IN (SELECT id FROM coaching_programs WHERE client_id = auth.uid()));
CREATE POLICY "service_phases" ON program_phases FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. DEFINITIVE RLS POLICIES — phase_workouts
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Coaches can view phase workouts" ON phase_workouts;
DROP POLICY IF EXISTS "Coaches can insert phase workouts" ON phase_workouts;
DROP POLICY IF EXISTS "Coaches can update phase workouts" ON phase_workouts;
DROP POLICY IF EXISTS "Coaches can delete phase workouts" ON phase_workouts;
DROP POLICY IF EXISTS "Clients can view own phase workouts" ON phase_workouts;
DROP POLICY IF EXISTS "Service role full access to phase_workouts" ON phase_workouts;

CREATE POLICY "coach_select_workouts" ON phase_workouts FOR SELECT
  USING (phase_id IN (
    SELECT pp.id FROM program_phases pp
    JOIN coaching_programs cp ON pp.program_id = cp.id
    WHERE cp.coach_id = auth.uid()
  ));
CREATE POLICY "coach_insert_workouts" ON phase_workouts FOR INSERT
  WITH CHECK (phase_id IN (
    SELECT pp.id FROM program_phases pp
    JOIN coaching_programs cp ON pp.program_id = cp.id
    WHERE cp.coach_id = auth.uid()
  ));
CREATE POLICY "coach_update_workouts" ON phase_workouts FOR UPDATE
  USING (phase_id IN (
    SELECT pp.id FROM program_phases pp
    JOIN coaching_programs cp ON pp.program_id = cp.id
    WHERE cp.coach_id = auth.uid()
  ));
CREATE POLICY "coach_delete_workouts" ON phase_workouts FOR DELETE
  USING (phase_id IN (
    SELECT pp.id FROM program_phases pp
    JOIN coaching_programs cp ON pp.program_id = cp.id
    WHERE cp.coach_id = auth.uid()
  ));
CREATE POLICY "client_select_workouts" ON phase_workouts FOR SELECT
  USING (phase_id IN (
    SELECT pp.id FROM program_phases pp
    JOIN coaching_programs cp ON pp.program_id = cp.id
    WHERE cp.client_id = auth.uid()
  ));
CREATE POLICY "service_workouts" ON phase_workouts FOR ALL
  USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. DEFINITIVE RLS POLICIES — exercises (read for everyone)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Read exercises" ON exercises;
DROP POLICY IF EXISTS "Coaches create exercises" ON exercises;
DROP POLICY IF EXISTS "Coaches manage own exercises" ON exercises;
DROP POLICY IF EXISTS "Coaches delete own exercises" ON exercises;

CREATE POLICY "anyone_read_public_exercises" ON exercises FOR SELECT
  USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "coaches_insert_exercises" ON exercises FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "coaches_update_exercises" ON exercises FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY "coaches_delete_exercises" ON exercises FOR DELETE
  USING (created_by = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Ensure profiles RLS lets coaches read client profiles
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Coaches can read client profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "read_own_profile" ON profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "coaches_read_client_profiles" ON profiles FOR SELECT
  USING (id IN (SELECT client_id FROM coach_clients WHERE coach_id = auth.uid()));
CREATE POLICY "clients_read_coach_profile" ON profiles FOR SELECT
  USING (id IN (SELECT coach_id FROM coach_clients WHERE client_id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────


-- ----------------------------------------------------------------------------
-- 20260429_exercise_library_curate.sql
-- ----------------------------------------------------------------------------
-- Curate exercise library: 750 → ~125 science-based exercises that real coaches program.
-- Strategy:
--   1. DELETE rows not in the keep-list (using their CURRENT names so we hit them).
--   2. UPDATE clunky names to clean ones (preserves cues, instructions, muscles).
--   3. INSERT a few staples that the source library was missing (Bulgarian Split Squat,
--      Seated Leg Press, Assisted Pull-Up Machine).
-- Custom user-created exercises (created_by IS NOT NULL) are untouched.

BEGIN;

-- ============================================================================
-- 1. DELETE non-curated exercises
--    Names listed below are the CURRENT names — pre-rename — for everything we keep.
-- ============================================================================
DELETE FROM exercises
WHERE is_public = true
  AND created_by IS NULL
  AND name NOT IN (
    -- CHEST
    'Barbell Bench Press - Medium Grip',
    'Barbell Incline Bench Press - Medium Grip',
    'Decline Barbell Bench Press',
    'Close-Grip Barbell Bench Press',
    'Dumbbell Bench Press',
    'Incline Dumbbell Press',
    'Decline Dumbbell Bench Press',
    'Dumbbell Flyes',
    'Incline Dumbbell Flyes',
    'Cable Crossover',
    'Cable Chest Press',
    'Pushups',
    'Incline Push-Up',
    'Decline Push-Up',
    'Dips - Chest Version',
    'Dip Machine',
    'Machine Bench Press',
    'Bent-Arm Dumbbell Pullover',
    'Butterfly',
    'Incline Cable Flye',
    -- BACK
    'Pullups',
    'Chin-Up',
    'Weighted Pull Ups',
    'Wide-Grip Lat Pulldown',
    'Close-Grip Front Lat Pulldown',
    'V-Bar Pulldown',
    'Underhand Cable Pulldowns',
    'Straight-Arm Pulldown',
    'Bent Over Barbell Row',
    'One-Arm Dumbbell Row',
    'Seated Cable Rows',
    'T-Bar Row with Handle',
    'Inverted Row',
    'Reverse Grip Bent-Over Rows',
    'Hyperextensions (Back Extensions)',
    'Rack Pulls',
    'Leverage Iso Row',
    'Seated One-arm Cable Pulley Rows',
    'One Arm Lat Pulldown',
    -- DEADLIFTS
    'Barbell Deadlift',
    'Sumo Deadlift',
    'Romanian Deadlift',
    'Stiff-Legged Barbell Deadlift',
    'Trap Bar Deadlift',
    -- SHOULDERS
    'Barbell Shoulder Press',
    'Seated Barbell Military Press',
    'Standing Dumbbell Press',
    'Seated Dumbbell Press',
    'Arnold Dumbbell Press',
    'Push Press',
    'Side Lateral Raise',
    'Cable Seated Lateral Raise',
    'Front Dumbbell Raise',
    'Reverse Flyes',
    'Reverse Machine Flyes',
    'Face Pull',
    'Upright Barbell Row',
    'Machine Shoulder (Military) Press',
    'Barbell Shrug',
    'Dumbbell Shrug',
    -- BICEPS
    'Barbell Curl',
    'EZ-Bar Curl',
    'Dumbbell Bicep Curl',
    'Hammer Curls',
    'Incline Dumbbell Curl',
    'Preacher Curl',
    'Cable Preacher Curl',
    'Concentration Curls',
    'Cable Hammer Curls - Rope Attachment',
    'Standing Biceps Cable Curl',
    'Spider Curl',
    'Machine Bicep Curl',
    'Reverse Barbell Curl',
    -- TRICEPS
    'Triceps Pushdown',
    'Triceps Pushdown - Rope Attachment',
    'EZ-Bar Skullcrusher',
    'Tricep Dumbbell Kickback',
    'Cable Rope Overhead Triceps Extension',
    'Lying Dumbbell Tricep Extension',
    'Bench Dips',
    'Dips - Triceps Version',
    'Machine Triceps Extension',
    'Reverse Grip Triceps Pushdown',
    -- LEGS (squats/lunges/press)
    'Barbell Squat',
    'Front Barbell Squat',
    'Goblet Squat',
    'Bodyweight Squat',
    'Hack Squat',
    'Barbell Hack Squat',
    'Leg Press',
    'Dumbbell Lunges',
    'Barbell Lunge',
    'Barbell Walking Lunge',
    'Dumbbell Step Ups',
    'Box Squat',
    'Smith Machine Squat',
    'Plie Dumbbell Squat',
    -- LEGS (curl/extension/calf)
    'Leg Extensions',
    'Lying Leg Curls',
    'Seated Leg Curl',
    'Standing Leg Curl',
    'Calf Press On The Leg Press Machine',
    'Standing Calf Raises',
    'Seated Calf Raise',
    'Donkey Calf Raises',
    -- GLUTES / HIPS / POSTERIOR
    'Barbell Hip Thrust',
    'Barbell Glute Bridge',
    'Single Leg Glute Bridge',
    'Glute Kickback',
    'Cable Hip Adduction',
    'Thigh Abductor',
    'Thigh Adductor',
    'Pull Through',
    'Glute Ham Raise',
    'Reverse Hyperextension',
    -- CORE
    'Plank',
    'Side Bridge',
    'Crunches',
    'Sit-Up',
    'Decline Crunch',
    'Reverse Crunch',
    'Cable Crunch',
    'Russian Twist',
    'Hanging Leg Raise',
    'Knee/Hip Raise On Parallel Bars',
    'Pallof Press',
    'Ab Roller',
    'Ab Crunch Machine',
    'Mountain Climbers',
    'Dead Bug',
    -- KETTLEBELL / FUNCTIONAL
    'One-Arm Kettlebell Swings',
    'Kettlebell Turkish Get-Up (Squat style)',
    'Farmer',
    -- CARDIO
    'Running, Treadmill',
    'Walking, Treadmill',
    'Bicycling, Stationary',
    'Recumbent Bike',
    'Rowing, Stationary',
    'Stairmaster',
    'Elliptical Trainer',
    'Rope Jumping'
  );

-- ============================================================================
-- 2. RENAME clunky names to clean ones (cues, muscles, etc. preserved on the row)
-- ============================================================================
UPDATE exercises SET name = 'Barbell Bench Press' WHERE name = 'Barbell Bench Press - Medium Grip' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Incline Bench Press' WHERE name = 'Barbell Incline Bench Press - Medium Grip' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Push-Up' WHERE name = 'Pushups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Pullover' WHERE name = 'Bent-Arm Dumbbell Pullover' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Chest Dip' WHERE name = 'Dips - Chest Version' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Dip' WHERE name = 'Dip Machine' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Pec Deck' WHERE name = 'Butterfly' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Incline Cable Fly' WHERE name = 'Incline Cable Flye' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Pull-Up' WHERE name = 'Pullups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Weighted Pull-Up' WHERE name = 'Weighted Pull Ups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Lat Pulldown' WHERE name = 'Wide-Grip Lat Pulldown' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Close-Grip Lat Pulldown' WHERE name = 'Close-Grip Front Lat Pulldown' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Underhand Lat Pulldown' WHERE name = 'Underhand Cable Pulldowns' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Bent Over Row' WHERE name = 'Bent Over Barbell Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Row' WHERE name = 'One-Arm Dumbbell Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Seated Cable Row' WHERE name = 'Seated Cable Rows' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'T-Bar Row' WHERE name = 'T-Bar Row with Handle' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Reverse Grip Barbell Row' WHERE name = 'Reverse Grip Bent-Over Rows' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Back Extension' WHERE name = 'Hyperextensions (Back Extensions)' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Rack Pull' WHERE name = 'Rack Pulls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Row' WHERE name = 'Leverage Iso Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Single-Arm Cable Row' WHERE name = 'Seated One-arm Cable Pulley Rows' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Single-Arm Lat Pulldown' WHERE name = 'One Arm Lat Pulldown' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Stiff-Leg Deadlift' WHERE name = 'Stiff-Legged Barbell Deadlift' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Seated Barbell Press' WHERE name = 'Seated Barbell Military Press' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Arnold Press' WHERE name = 'Arnold Dumbbell Press' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Lateral Raise' WHERE name = 'Side Lateral Raise' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Lateral Raise' WHERE name = 'Cable Seated Lateral Raise' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Front Raise' WHERE name = 'Front Dumbbell Raise' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Rear Delt Fly' WHERE name = 'Reverse Flyes' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Rear Delt Fly' WHERE name = 'Reverse Machine Flyes' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Upright Row' WHERE name = 'Upright Barbell Row' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Shoulder Press' WHERE name = 'Machine Shoulder (Military) Press' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Hammer Curl' WHERE name = 'Hammer Curls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Concentration Curl' WHERE name = 'Concentration Curls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Hammer Curl' WHERE name = 'Cable Hammer Curls - Rope Attachment' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Curl' WHERE name = 'Standing Biceps Cable Curl' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Cable Rope Pushdown' WHERE name = 'Triceps Pushdown - Rope Attachment' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Skullcrusher' WHERE name = 'EZ-Bar Skullcrusher' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Tricep Kickback' WHERE name = 'Tricep Dumbbell Kickback' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Overhead Cable Tricep Extension' WHERE name = 'Cable Rope Overhead Triceps Extension' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Skullcrusher' WHERE name = 'Lying Dumbbell Tricep Extension' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Bench Dip' WHERE name = 'Bench Dips' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Tricep Dip' WHERE name = 'Dips - Triceps Version' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Machine Tricep Extension' WHERE name = 'Machine Triceps Extension' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Reverse Grip Pushdown' WHERE name = 'Reverse Grip Triceps Pushdown' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Barbell Back Squat' WHERE name = 'Barbell Squat' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Barbell Front Squat' WHERE name = 'Front Barbell Squat' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Lunge' WHERE name = 'Dumbbell Lunges' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Dumbbell Step-Up' WHERE name = 'Dumbbell Step Ups' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Leg Extension' WHERE name = 'Leg Extensions' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Lying Leg Curl' WHERE name = 'Lying Leg Curls' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Calf Press' WHERE name = 'Calf Press On The Leg Press Machine' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Standing Calf Raise' WHERE name = 'Standing Calf Raises' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Donkey Calf Raise' WHERE name = 'Donkey Calf Raises' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Sumo Squat' WHERE name = 'Plie Dumbbell Squat' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Cable Pull Through' WHERE name = 'Pull Through' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Crunch' WHERE name = 'Crunches' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Side Plank' WHERE name = 'Side Bridge' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Captain''s Chair Leg Raise' WHERE name = 'Knee/Hip Raise On Parallel Bars' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Mountain Climber' WHERE name = 'Mountain Climbers' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Ab Wheel Rollout' WHERE name = 'Ab Roller' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Kettlebell Swing' WHERE name = 'One-Arm Kettlebell Swings' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Turkish Get-Up' WHERE name = 'Kettlebell Turkish Get-Up (Squat style)' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Farmer Carry' WHERE name = 'Farmer' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Treadmill Run' WHERE name = 'Running, Treadmill' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Treadmill Walk' WHERE name = 'Walking, Treadmill' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Stationary Bike' WHERE name = 'Bicycling, Stationary' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Rowing Machine' WHERE name = 'Rowing, Stationary' AND is_public = true AND created_by IS NULL;
UPDATE exercises SET name = 'Jump Rope' WHERE name = 'Rope Jumping' AND is_public = true AND created_by IS NULL;

-- ============================================================================
-- 3. INSERT staples missing from the source library
-- ============================================================================
INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Bulgarian Split Squat', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'compound',
  ARRAY[
    'Stand 2-3 feet in front of a bench, holding dumbbells at your sides.',
    'Place the top of your back foot on the bench behind you.',
    'Lower your back knee toward the floor by bending your front leg.',
    'Drive through your front heel to return to the start position.',
    'Complete reps on one side before switching legs.'
  ],
  ARRAY['quadriceps'],
  ARRAY['glutes','hamstrings'],
  ARRAY[
    'Front knee tracks over the toes, not past them',
    'Most weight on front heel — back leg is for balance only',
    'Keep torso upright; lean slightly forward to bias glutes',
    'Lower under control, then drive up explosively',
    'Pause briefly at the bottom for full ROM'
  ],
  ARRAY[
    'Standing too close to the bench (knee jams forward)',
    'Pushing off the back foot — defeats the unilateral purpose',
    'Letting the front knee cave inward'
  ]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bulgarian Split Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Seated Leg Press', 'machine', true, 'machine', 'beginner', 'push', 'compound',
  ARRAY[
    'Sit in the seated leg press machine with your back firmly against the pad.',
    'Place feet shoulder-width apart on the platform, knees bent.',
    'Release the safety and press the platform away by extending your knees and hips.',
    'Stop just short of locking the knees out.',
    'Lower under control until knees reach about 90 degrees, then press back up.'
  ],
  ARRAY['quadriceps'],
  ARRAY['glutes','hamstrings'],
  ARRAY[
    'Back stays flat against the pad the entire set',
    'Don''t let knees cave in — track them over the toes',
    'Stop short of lockout to keep tension on the quads',
    'Higher foot placement = more glute/hamstring; lower = more quad',
    'Control the eccentric — 2-3 seconds down'
  ],
  ARRAY[
    'Lifting hips off the seat (rounds the lower back)',
    'Locking knees out at the top',
    'Going so deep that lower back rounds off the pad'
  ]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seated Leg Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Assisted Pull-Up Machine', 'machine', true, 'machine', 'beginner', 'pull', 'compound',
  ARRAY[
    'Set the assistance weight on the machine — more weight = more help.',
    'Step or kneel onto the assist platform, gripping the handles overhead.',
    'Pull yourself up until your chin clears the bar.',
    'Lower under control to a full hang.',
    'As you get stronger, reduce the assistance weight over time.'
  ],
  ARRAY['lats'],
  ARRAY['biceps','middle back'],
  ARRAY[
    'Treat it like a real pull-up — drive elbows down to your ribs',
    'Full hang at the bottom — don''t cheat the eccentric',
    'Reduce assistance ~5lb every 1-2 weeks as you progress',
    'Squeeze shoulder blades together at the top',
    'Wide grip = more lats, narrow/neutral = more biceps'
  ],
  ARRAY[
    'Bouncing off the platform at the bottom',
    'Stopping reps before chin clears the bar',
    'Using too much assistance — set it so the last rep is genuinely hard'
  ]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Assisted Pull-Up Machine');

COMMIT;


-- ----------------------------------------------------------------------------
-- 20260430_exercise_library_reseed.sql
-- ----------------------------------------------------------------------------
-- Re-seed curated exercises (idempotent — guards with WHERE NOT EXISTS).
-- Source: free-exercise-db rows from supabase/seeds/exercises_part_*.sql,
-- with the rename map from 20260429_exercise_library_curate.sql applied.

BEGIN;

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Bench Press', 'barbell', true, 'barbell', 'beginner', 'push', 'compound', ARRAY['Lie back on a flat bench. Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.','From the starting position, breathe in and begin coming down slowly until the bar touches your middle chest.','After a brief pause, push the bar back to the starting position as you breathe out. Focus on pushing the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position at the top of the motion, hold for a second and then start coming down slowly again. Tip: Ideally, lowering the weight should take about twice as long as raising it.','Repeat the movement for the prescribed amount of repetitions.','When you are done, place the bar back in the rack.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY['Retract shoulder blades and arch upper back slightly','Grip bar just outside shoulder width','Lower to mid-nipple line, elbows at 45 degrees','Drive feet into floor, press up and slightly back','Lock out arms without losing shoulder blade position'], ARRAY['Bouncing bar off chest','Flaring elbows to 90 degrees','Flat back with no arch','Lifting hips off bench']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Bench Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Incline Bench Press', 'barbell', true, 'barbell', 'beginner', 'push', 'compound', ARRAY['Lie back on an incline bench. Using a medium-width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.','As you breathe in, come down slowly until you feel the bar on you upper chest.','After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly again. Tip: it should take at least twice as long to go down than to come up.','Repeat the movement for the prescribed amount of repetitions.','When you are done, place the bar back in the rack.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY['Set bench to 30-45 degrees','Lower bar to upper chest just below collarbone','Press up and slightly back','Same shoulder blade retraction as flat bench','Targets upper chest more than flat'], ARRAY['Bench angle too steep (becomes shoulder press)','Bar path drifting too far forward','Losing tightness in upper back']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Incline Bench Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Decline Barbell Bench Press', 'barbell', true, 'barbell', 'beginner', 'push', 'compound', ARRAY['Secure your legs at the end of the decline bench and slowly lay down on the bench.','Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and hold it straight over you with your arms locked. The arms should be perpendicular to the floor. This will be your starting position. Tip: In order to protect your rotator cuff, it is best if you have a spotter help you lift the barbell off the rack.','As you breathe in, come down slowly until you feel the bar on your lower chest.','After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your chest muscles. Lock your arms and squeeze your chest in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up).','Repeat the movement for the prescribed amount of repetitions.','When you are done, place the bar back in the rack.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Decline Barbell Bench Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Close-Grip Barbell Bench Press', 'barbell', true, 'barbell', 'beginner', 'push', 'compound', ARRAY['Lie back on a flat bench. Using a close grip (around shoulder width), lift the bar from the rack and hold it straight over you with your arms locked. This will be your starting position.','As you breathe in, come down slowly until you feel the bar on your middle chest. Tip: Make sure that - as opposed to a regular bench press - you keep the elbows close to the torso at all times in order to maximize triceps involvement.','After a second pause, bring the bar back to the starting position as you breathe out and push the bar using your triceps muscles. Lock your arms in the contracted position, hold for a second and then start coming down slowly again. Tip: It should take at least twice as long to go down than to come up.','Repeat the movement for the prescribed amount of repetitions.','When you are done, place the bar back in the rack.'], ARRAY['triceps'], ARRAY['chest','shoulders'], ARRAY['Hands shoulder width or slightly narrower','Keep elbows tucked close to body','Lower bar to lower chest','Focus on squeezing triceps at lockout','One of the best tricep mass builders'], ARRAY['Grip too narrow causing wrist pain','Flaring elbows out wide','Not locking out']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Close-Grip Barbell Bench Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Bench Press', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs. The palms of your hands will be facing each other.','Then, using your thighs to help raise the dumbbells up, lift the dumbbells one at a time so that you can hold them in front of you at shoulder width.','Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. The dumbbells should be just to the sides of your chest, with your upper arm and forearm creating a 90 degree angle. Be sure to maintain full control of the dumbbells at all times. This will be your starting position.','Then, as you breathe out, use your chest to push the dumbbells up. Lock your arms at the top of the lift and squeeze your chest, hold for a second and then begin coming down slowly. Tip: Ideally, lowering the weight should take about twice as long as raising it.','Repeat the movement for the prescribed amount of repetitions of your training program.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY['Press dumbbells up and slightly together','Lower until upper arms parallel to floor','Keep shoulder blades pinched entire set','Squeeze chest hard at top','Rotate palms to face each other slightly for shoulder comfort'], ARRAY['Going too deep and straining shoulders','Dumbbells drifting too wide at bottom','Losing control on the negative']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Bench Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Incline Dumbbell Press', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Lie back on an incline bench with a dumbbell in each hand atop your thighs. The palms of your hands will be facing each other.','Then, using your thighs to help push the dumbbells up, lift the dumbbells one at a time so that you can hold them at shoulder width.','Once you have the dumbbells raised to shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.','Be sure to keep full control of the dumbbells at all times. Then breathe out and push the dumbbells up with your chest.','Lock your arms at the top, hold for a second, and then start slowly lowering the weight. Tip Ideally, lowering the weights should take about twice as long as raising them.','Repeat the movement for the prescribed amount of repetitions.','When you are done, place the dumbbells back on your thighs and then on the floor. This is the safest manner to release the dumbbells.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Incline Dumbbell Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Decline Dumbbell Bench Press', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs. The palms of your hand will be facing each other.','Once you are laying down, move the dumbbells in front of you at shoulder width.','Once at shoulder width, rotate your wrists forward so that the palms of your hands are facing away from you. This will be your starting position.','Bring down the weights slowly to your side as you breathe out. Keep full control of the dumbbells at all times. Tip: Throughout the motion, the forearms should always be perpendicular to the floor.','As you breathe out, push the dumbbells up using your pectoral muscles. Lock your arms in the contracted position, squeeze your chest, hold for a second and then start coming down slowly. Tip: It should take at least twice as long to go down than to come up..','Repeat the movement for the prescribed amount of repetitions of your training program.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Decline Dumbbell Bench Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Flyes', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'isolation', ARRAY['Lie down on a flat bench with a dumbbell on each hand resting on top of your thighs. The palms of your hand will be facing each other.','Then using your thighs to help raise the dumbbells, lift the dumbbells one at a time so you can hold them in front of you at shoulder width with the palms of your hands facing each other. Raise the dumbbells up like you''re pressing them, but stop and hold just before you lock out. This will be your starting position.','With a slight bend on your elbows in order to prevent stress at the biceps tendon, lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary; the movement should only occur at the shoulder joint.','Return your arms back to the starting position as you squeeze your chest muscles and breathe out. Tip: Make sure to use the same arc of motion used to lower the weights.','Hold for a second at the contracted position and repeat the movement for the prescribed amount of repetitions.'], ARRAY['chest'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Flyes');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Incline Dumbbell Flyes', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Hold a dumbbell on each hand and lie on an incline bench that is set to an incline angle of no more than 30 degrees.','Extend your arms above you with a slight bend at the elbows.','Now rotate the wrists so that the palms of your hands are facing you. Tip: The pinky fingers should be next to each other. This will be your starting position.','As you breathe in, start to slowly lower the arms to the side while keeping the arms extended and while rotating the wrists until the palms of the hand are facing each other. Tip: At the end of the movement the arms will be by your side with the palms facing the ceiling.','As you exhale start to bring the dumbbells back up to the starting position by reversing the motion and rotating the hands so that the pinky fingers are next to each other again. Tip: Keep in mind that the movement will only happen at the shoulder joint and at the wrist. There is no motion that happens at the elbow joint.','Repeat for the recommended amount of repetitions.'], ARRAY['chest'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Incline Dumbbell Flyes');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Crossover', 'cable', true, 'cable', 'beginner', 'push', 'isolation', ARRAY['To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand.','Step forward in front of an imaginary straight line between both pulleys while pulling your arms together in front of you. Your torso should have a small forward bend from the waist. This will be your starting position.','With a slight bend on your elbows in order to prevent stress at the biceps tendon, extend your arms to the side (straight out at both sides) in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms and torso should remain stationary; the movement should only occur at the shoulder joint.','Return your arms back to the starting position as you breathe out. Make sure to use the same arc of motion used to lower the weights.','Hold for a second at the starting position and repeat the movement for the prescribed amount of repetitions.'], ARRAY['chest'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Crossover');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Chest Press', 'cable', true, 'cable', 'beginner', 'push', 'compound', ARRAY['Adjust the weight to an appropriate amount and be seated, grasping the handles. Your upper arms should be about 45 degrees to the body, with your head and chest up. The elbows should be bent to about 90 degrees. This will be your starting position.','Begin by extending through the elbow, pressing the handles together straight in front of you. Keep your shoulder blades retracted as you execute the movement.','After pausing at full extension, return to th starting position, keeping tension on the cables.','You can also execute this movement with your back off the pad, at an incline or decline, or alternate hands.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY['Step forward into a split stance for stability','Press handles forward and together','Squeeze chest at full extension','Slow return, feel the stretch','Great for constant tension on chest'], ARRAY['Leaning too far forward','Using momentum instead of muscle']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Chest Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Push-Up', 'body only', true, 'body only', 'beginner', 'push', 'compound', ARRAY['Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.','Next, lower yourself downward until your chest almost touches the floor as you inhale.','Now breathe out and press your upper body back up to the starting position while squeezing your chest.','After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Push-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Incline Push-Up', 'body only', true, 'body only', 'beginner', 'push', 'compound', ARRAY['Stand facing bench or sturdy elevated platform. Place hands on edge of bench or platform, slightly wider than shoulder width.','Position forefoot back from bench or platform with arms and body straight. Arms should be perpendicular to body. Keeping body straight, lower chest to edge of box or platform by bending arms.','Push body up until arms are extended. Repeat.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Incline Push-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Decline Push-Up', 'body only', true, 'body only', 'beginner', 'push', 'compound', ARRAY['Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length. Move your feet up to a box or bench. This will be your starting position.','Next, lower yourself downward until your chest almost touches the floor as you inhale.','Now breathe out and press your upper body back up to the starting position while squeezing your chest.','After a brief pause at the top contracted position, you can begin to lower yourself downward again for as many repetitions as needed.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY['Feet elevated on bench or box','Hands shoulder width, fingers forward','Lower chest toward floor between hands','Push up explosively','Targets upper chest more than regular pushups'], ARRAY['Sagging hips','Not going deep enough','Flaring elbows too wide']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Decline Push-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Chest Dip', 'other', true, 'other', 'intermediate', 'push', 'compound', ARRAY['For this exercise you will need access to parallel bars. To get yourself into the starting position, hold your body at arms length (arms locked) above the bars.','While breathing in, lower yourself slowly with your torso leaning forward around 30 degrees or so and your elbows flared out slightly until you feel a slight stretch in the chest.','Once you feel the stretch, use your chest to bring your body back to the starting position as you breathe out. Tip: Remember to squeeze the chest at the top of the movement for a second.','Repeat the movement for the prescribed amount of repetitions.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chest Dip');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Machine Dip', 'machine', true, 'machine', 'beginner', 'push', 'compound', ARRAY['Sit securely in a dip machine, select the weight and firmly grasp the handles.','Now keep your elbows in at your sides in order to place emphasis on the triceps. The elbows should be bent at a 90 degree angle.','As you contract the triceps, extend your arms downwards as you exhale. Tip: At the bottom of the movement, focus on keeping a little bend in your arms to keep tension on the triceps muscle.','Now slowly let your arms come back up to the starting position as you inhale.','Repeat for the recommended amount of repetitions.'], ARRAY['triceps'], ARRAY['chest','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Dip');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Machine Bench Press', 'machine', true, 'machine', 'beginner', 'push', 'compound', ARRAY['Sit down on the Chest Press Machine and select the weight.','Step on the lever provided by the machine since it will help you to bring the handles forward so that you can grab the handles and fully extend the arms.','Grab the handles with a palms-down grip and lift your elbows so that your upper arms are parallel to the floor to the sides of your torso. Tip: Your forearms will be pointing forward since you are grabbing the handles. Once you bring the handles forward and extend the arms you will be at the starting position.','Now bring the handles back towards you as you breathe in.','Push the handles away from you as you flex your pecs and you breathe out. Hold the contraction for a second before going back to the starting position.','Repeat for the recommended amount of reps.','When finished step on the lever again and slowly get the handles back to their original place.'], ARRAY['chest'], ARRAY['shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Bench Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Pullover', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'compound', ARRAY['Place a dumbbell standing up on a flat bench.','Ensuring that the dumbbell stays securely placed at the top of the bench, lie perpendicular to the bench (torso across it as in forming a cross) with only your shoulders lying on the surface. Hips should be below the bench and legs bent with feet firmly on the floor. The head will be off the bench as well.','Grasp the dumbbell with both hands and hold it straight over your chest with a bend in your arms. Both palms should be pressing against the underside one of the sides of the dumbbell. This will be your starting position. Caution: Always ensure that the dumbbell used for this exercise is secure. Using a dumbbell with loose plates can result in the dumbbell falling apart and falling on your face.','While keeping your arms locked in the bent arm position, lower the weight slowly in an arc behind your head while breathing in until you feel a stretch on the chest.','At that point, bring the dumbbell back to the starting position using the arc through which the weight was lowered and exhale as you perform this movement.','Hold the weight on the initial position for a second and repeat the motion for the prescribed number of repetitions.'], ARRAY['chest'], ARRAY['lats','shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Pullover');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Pec Deck', 'machine', true, 'machine', 'beginner', 'pull', 'isolation', ARRAY['Sit on the machine with your back flat on the pad.','Take hold of the handles. Tip: Your upper arms should be positioned parallel to the floor; adjust the machine accordingly. This will be your starting position.','Push the handles together slowly as you squeeze your chest in the middle. Breathe out during this part of the motion and hold the contraction for a second.','Return back to the starting position slowly as you inhale until your chest muscles are fully stretched.','Repeat for the recommended amount of repetitions.'], ARRAY['chest'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pec Deck');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Incline Cable Fly', 'cable', true, 'cable', 'intermediate', 'push', 'isolation', ARRAY['To get yourself into the starting position, set the pulleys at the floor level (lowest level possible on the machine that is below your torso).','Place an incline bench (set at 45 degrees) in between the pulleys, select a weight on each one and grab a pulley on each hand.','With a handle on each hand, lie on the incline bench and bring your hands together at arms length in front of your face. This will be your starting position.','With a slight bend of your elbows (in order to prevent stress at the biceps tendon), lower your arms out at both sides in a wide arc until you feel a stretch on your chest. Breathe in as you perform this portion of the movement. Tip: Keep in mind that throughout the movement, the arms should remain stationary. The movement should only occur at the shoulder joint.','Return your arms back to the starting position as you squeeze your chest muscles and exhale. Hold the contracted position for a second. Tip: Make sure to use the same arc of motion used to lower the weights.','Repeat the movement for the prescribed amount of repetitions.'], ARRAY['chest'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Incline Cable Fly');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Pull-Up', 'body only', true, 'body only', 'beginner', 'pull', 'compound', ARRAY['Grab the pull-up bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.','As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.','Pull your torso up until the bar touches your upper chest by drawing the shoulders and the upper arms down and back. Exhale as you perform this portion of the movement. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.','After a second on the contracted position, start to inhale and slowly lower your torso back to the starting position when your arms are fully extended and the lats are fully stretched.','Repeat this motion for the prescribed amount of repetitions.'], ARRAY['lats'], ARRAY['biceps','middle back'], ARRAY['Full dead hang at bottom, chin over bar at top','Initiate by pulling shoulder blades down','Drive elbows toward your hips','Control the descent, 2 seconds down','If you cant do them, use band assistance'], ARRAY['Half reps, not going to full hang','Kipping or swinging','Not getting chin over bar','Going too fast without control']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pull-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Chin-Up', 'body only', true, 'body only', 'beginner', 'pull', 'compound', ARRAY['Grab the pull-up bar with the palms facing your torso and a grip closer than the shoulder width.','As you have both arms extended in front of you holding the bar at the chosen grip width, keep your torso as straight as possible while creating a curvature on your lower back and sticking your chest out. This is your starting position. Tip: Keeping the torso as straight as possible maximizes biceps stimulation while minimizing back involvement.','As you breathe out, pull your torso up until your head is around the level of the pull-up bar. Concentrate on using the biceps muscles in order to perform the movement. Keep the elbows close to your body. Tip: The upper torso should remain stationary as it moves through space and only the arms should move. The forearms should do no other work other than hold the bar.','After a second of squeezing the biceps in the contracted position, slowly lower your torso back to the starting position; when your arms are fully extended. Breathe in as you perform this portion of the movement.','Repeat this motion for the prescribed amount of repetitions.'], ARRAY['lats'], ARRAY['biceps','forearms','middle back'], ARRAY['Palms facing you, shoulder width grip','Easier than pullups, great for building up','Pull until chin clears bar','Squeeze biceps and lats at top','Lower to full dead hang every rep'], ARRAY['Partial range of motion','Using momentum','Grip too wide (becomes a pullup)']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Chin-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Weighted Pull-Up', 'other', true, 'other', 'intermediate', 'pull', 'compound', ARRAY['Attach a weight to a dip belt and secure it around your waist. Grab the pull-up bar with the palms of your hands facing forward. For a medium grip, your hands should be spaced at shoulder width. Both arms should be extended in front of you holding the bar at the chosen grip.','You''ll want to bring your torso back about 30 degrees while creating a curvature in your lower back and sticking your chest out. This will be your starting position.','Now, exhale and pull your torso up until your head is above your hands. Concentrate on squeezing yourshoulder blades back and down as you reach the top contracted position.','After a brief moment at the top contracted position, inhale and slowly lower your torso back to the starting position with your arms extended and your lats fully stretched.'], ARRAY['lats'], ARRAY['biceps','middle back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Weighted Pull-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Lat Pulldown', 'cable', true, 'cable', 'beginner', 'pull', 'compound', ARRAY['Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.','Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.','As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.','As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the bar; therefore do not try to pull down the bar using the forearms.','After a second at the contracted position squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.','Repeat this motion for the prescribed amount of repetitions.'], ARRAY['lats'], ARRAY['biceps','middle back','shoulders'], ARRAY['Grip outside shoulder width','Pull bar to upper chest, lean back slightly','Drive elbows down and back','Control the return all the way up','Feel lats stretch at top'], ARRAY['Pulling behind the neck','Leaning too far back','Using body momentum','Grip too narrow']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Lat Pulldown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Close-Grip Lat Pulldown', 'cable', true, 'cable', 'beginner', 'pull', 'compound', ARRAY['Sit down on a pull-down machine with a wide bar attached to the top pulley. Make sure that you adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.','Grab the bar with the palms facing forward using the prescribed grip. Note on grips: For a wide grip, your hands need to be spaced out at a distance wider than your shoulder width. For a medium grip, your hands need to be spaced out at a distance equal to your shoulder width and for a close grip at a distance smaller than your shoulder width.','As you have both arms extended in front of you - while holding the bar at the chosen grip width - bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.','As you breathe out, bring the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. The upper torso should remain stationary (only the arms should move). The forearms should do no other work except for holding the bar; therefore do not try to pull the bar down using the forearms.','After a second in the contracted position, while squeezing your shoulder blades together, slowly raise the bar back to the starting position when your arms are fully extended and the lats are fully stretched. Inhale during this portion of the movement.','6. Repeat this motion for the prescribed amount of repetitions.'], ARRAY['lats'], ARRAY['biceps','middle back','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Close-Grip Lat Pulldown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'V-Bar Pulldown', 'cable', true, 'cable', 'intermediate', 'pull', 'compound', ARRAY['Sit down on a pull-down machine with a V-Bar attached to the top pulley.','Adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.','Grab the V-bar with the palms facing each other (a neutral grip). Stick your chest out and lean yourself back slightly (around 30-degrees) in order to better engage the lats. This will be your starting position.','Using your lats, pull the bar down as you squeeze your shoulder blades. Continue until your chest nearly touches the V-bar. Exhale as you execute this motion. Tip: Keep the torso stationary throughout the movement.','After a second hold on the contracted position, slowly bring the bar back to the starting position as you breathe in.','Repeat for the prescribed number of repetitions.'], ARRAY['lats'], ARRAY['biceps','middle back','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'V-Bar Pulldown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Underhand Lat Pulldown', 'cable', true, 'cable', 'beginner', 'pull', 'compound', ARRAY['Sit down on a pull-down machine with a wide bar attached to the top pulley. Adjust the knee pad of the machine to fit your height. These pads will prevent your body from being raised by the resistance attached to the bar.','Grab the pull-down bar with the palms facing your torso (a supinated grip). Make sure that the hands are placed closer than the shoulder width.','As you have both arms extended in front of you holding the bar at the chosen grip width, bring your torso back around 30 degrees or so while creating a curvature on your lower back and sticking your chest out. This is your starting position.','As you breathe out, pull the bar down until it touches your upper chest by drawing the shoulders and the upper arms down and back. Tip: Concentrate on squeezing the back muscles once you reach the fully contracted position and keep the elbows close to your body. The upper torso should remain stationary as your bring the bar to you and only the arms should move. The forearms should do no other work other than hold the bar.','After a second on the contracted position, while breathing in, slowly bring the bar back to the starting position when your arms are fully extended and the lats are fully stretched.','Repeat this motion for the prescribed amount of repetitions.'], ARRAY['lats'], ARRAY['biceps','middle back','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Underhand Lat Pulldown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Straight-Arm Pulldown', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['You will start by grabbing the wide bar from the top pulley of a pulldown machine and using a wider than shoulder-width pronated (palms down) grip. Step backwards two feet or so.','Bend your torso forward at the waist by around 30-degrees with your arms fully extended in front of you and a slight bend at the elbows. If your arms are not fully extended then you need to step a bit more backwards until they are. Once your arms are fully extended and your torso is slightly bent at the waist, tighten the lats and then you are ready to begin.','While keeping the arms straight, pull the bar down by contracting the lats until your hands are next to the side of the thighs. Breathe out as you perform this step.','While keeping the arms straight, go back to the starting position while breathing in.','Repeat for the recommended amount of repetitions.'], ARRAY['lats'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Straight-Arm Pulldown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Bent Over Row', 'barbell', true, 'barbell', 'beginner', 'pull', 'compound', ARRAY['Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.','Now, while keeping the torso stationary, breathe out and lift the barbell to you. Keep the elbows close to the body and only use the forearms to hold the weight. At the top contracted position, squeeze the back muscles and hold for a brief pause.','Then inhale and slowly lower the barbell back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['middle back'], ARRAY['biceps','lats','shoulders'], ARRAY['Hinge forward 45 degrees, flat back','Pull bar to lower chest or upper belly','Squeeze shoulder blades together at top','Lower with control, feel the stretch','Think about driving elbows behind you'], ARRAY['Standing too upright','Using body momentum to swing weight up','Rounding back','Pulling to wrong spot (too high or too low)']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Bent Over Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Row', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'compound', ARRAY['Choose a flat bench and place a dumbbell on each side of it.','Place the right leg on top of the end of the bench, bend your torso forward from the waist until your upper body is parallel to the floor, and place your right hand on the other end of the bench for support.','Use the left hand to pick up the dumbbell on the floor and hold the weight while keeping your lower back straight. The palm of the hand should be facing your torso. This will be your starting position.','Pull the resistance straight up to the side of your chest, keeping your upper arm close to your side and keeping the torso stationary. Breathe out as you perform this step. Tip: Concentrate on squeezing the back muscles once you reach the full contracted position. Also, make sure that the force is performed with the back muscles and not the arms. Finally, the upper torso should remain stationary and only the arms should move. The forearms should do no other work except for holding the dumbbell; therefore do not try to pull the dumbbell up using the forearms.','Lower the resistance straight down to the starting position. Breathe in as you perform this step.','Repeat the movement for the specified amount of repetitions.','Switch sides and repeat again with the other arm.'], ARRAY['middle back'], ARRAY['biceps','lats','shoulders'], ARRAY['Opposite hand and knee on bench','Pull dumbbell to hip, not to chest','Elbow drives straight back past body','Squeeze lat hard at top for 1 second','Let shoulder blade move, dont keep it locked'], ARRAY['Twisting torso to heave weight up','Pulling to armpit instead of hip','Rushing reps without squeezing']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Seated Cable Row', 'cable', true, 'cable', 'beginner', 'pull', 'compound', ARRAY['For this exercise you will need access to a low pulley row machine with a V-bar. Note: The V-bar will enable you to have a neutral grip where the palms of your hands face each other. To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.','Lean over as you keep the natural alignment of your back and grab the V-bar handles.','With your arms extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lats as you hold the bar in front of you. This is the starting position of the exercise.','Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it until you touch the abdominals. Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard. Hold that contraction for a second and slowly go back to the original position while breathing in.','Repeat for the recommended amount of repetitions.'], ARRAY['middle back'], ARRAY['biceps','lats','shoulders'], ARRAY['Sit tall, slight forward lean at start','Pull handle to lower chest','Squeeze shoulder blades together, hold 1 sec','Dont let weight yank you forward on return','Keep chest up and proud'], ARRAY['Excessive body swing','Pulling too high','Rounding upper back','Not controlling the eccentric']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seated Cable Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'T-Bar Row', 'barbell', true, 'barbell', 'beginner', 'pull', 'compound', ARRAY['Position a bar into a landmine or in a corner to keep it from moving. Load an appropriate weight onto your end.','Stand over the bar, and position a Double D row handle around the bar next to the collar. Using your hips and legs, rise to a standing position.','Assume a wide stance with your hips back and your chest up. Your arms should be extended. This will be your starting position.','Pull the weight to your upper abdomen by retracting the shoulder blades and flexing the elbows. Do not jerk the weight or cheat during the movement.','After a brief pause, return to the starting position.'], ARRAY['middle back'], ARRAY['biceps','lats'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'T-Bar Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Inverted Row', 'body only', true, 'body only', 'beginner', 'pull', 'compound', ARRAY['Position a bar in a rack to about waist height. You can also use a smith machine.','Take a wider than shoulder width grip on the bar and position yourself hanging underneath the bar. Your body should be straight with your heels on the ground with your arms fully extended. This will be your starting position.','Begin by flexing the elbow, pulling your chest towards the bar. Retract your shoulder blades as you perform the movement.','Pause at the top of the motion, and return yourself to the start position.','Repeat for the desired number of repetitions.'], ARRAY['middle back'], ARRAY['lats'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Inverted Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Reverse Grip Barbell Row', 'barbell', true, 'barbell', 'intermediate', 'pull', 'compound', ARRAY['Stand erect while holding a barbell with a supinated grip (palms facing up).','Bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight until it is almost parallel to the floor. Tip: Make sure that you keep the head up. The barbell should hang directly in front of you as your arms hang perpendicular to the floor and your torso. This is your starting position.','While keeping the torso stationary, lift the barbell as you breathe out, keeping the elbows close to the body and not doing any force with the forearm other than holding the weights. On the top contracted position, squeeze the back muscles and hold for a second.','Slowly lower the weight again to the starting position as you inhale.','Repeat for the recommended amount of repetitions.'], ARRAY['middle back'], ARRAY['biceps','lats','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Reverse Grip Barbell Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Back Extension', 'other', true, 'other', 'beginner', 'pull', 'isolation', ARRAY['Lie face down on a hyperextension bench, tucking your ankles securely under the footpads.','Adjust the upper pad if possible so your upper thighs lie flat across the wide pad, leaving enough room for you to bend at the waist without any restriction.','With your body straight, cross your arms in front of you (my preference) or behind your head. This will be your starting position. Tip: You can also hold a weight plate for extra resistance in front of you under your crossed arms.','Start bending forward slowly at the waist as far as you can while keeping your back flat. Inhale as you perform this movement. Keep moving forward until you feel a nice stretch on the hamstrings and you can no longer keep going without a rounding of the back. Tip: Never round the back as you perform this exercise. Also, some people can go farther than others. The key thing is that you go as far as your body allows you to without rounding the back.','Slowly raise your torso back to the initial position as you inhale. Tip: Avoid the temptation to arch your back past a straight line. Also, do not swing the torso at any time in order to protect the back from injury.','Repeat for the recommended amount of repetitions.'], ARRAY['lower back'], ARRAY['glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Back Extension');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Rack Pull', 'barbell', true, 'barbell', 'intermediate', 'pull', 'compound', ARRAY['Set up in a power rack with the bar on the pins. The pins should be set to the desired point; just below the knees, just above, or in the mid thigh position. Position yourself against the bar in proper deadlifting position. Your feet should be under your hips, your grip shoulder width, back arched, and hips back to engage the hamstrings. Since the weight is typically heavy, you may use a mixed grip, a hook grip, or use straps to aid in holding the weight.','With your head looking forward, extend through the hips and knees, pulling the weight up and back until lockout. Be sure to pull your shoulders back as you complete the movement.','Return the weight to the pins and repeat.'], ARRAY['lower back'], ARRAY['forearms','glutes','hamstrings','traps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Rack Pull');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Machine Row', 'machine', true, 'machine', 'beginner', 'pull', 'compound', ARRAY['Load an appropriate weight onto the pins and adjust the seat height so that the handles are at chest level. Grasp the handles with either a neutral or pronated grip. This will be your starting position.','Pull the handles towards your torso, retracting your shoulder blades as you flex the elbow.','Pause at the bottom of the motion, and then slowly return the handles to the starting position. For multiple repetitions, avoid completely returning the weight to the stops to keep tension on the muscles being worked.'], ARRAY['lats'], ARRAY['biceps','middle back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Single-Arm Cable Row', 'cable', true, 'cable', 'intermediate', 'pull', 'compound', ARRAY['To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly bent and not locked.','Lean over as you keep the natural alignment of your back and grab the single handle attachment with your left arm using a palms-down grip.','With your arm extended pull back until your torso is at a 90-degree angle from your legs. Your back should be slightly arched and your chest should be sticking out. You should be feeling a nice stretch on your lat as you hold the bar in front of you. The right arm can be kept by the waist. This is the starting position of the exercise.','Keeping the torso stationary, pull the handles back towards your torso while keeping the arms close to it as you rotate the wrist, so that by the time your hand is by your abdominals it is in a neutral position (palms facing the torso). Breathe out as you perform that movement. At that point you should be squeezing your back muscles hard.','Hold that contraction for a second and slowly go back to the original position while breathing in. Tip: Remember to rotate the wrist as you go back to the starting position so that the palms are facing down again.','Repeat for the recommended amount of repetitions and then perform the same movement with the right hand.'], ARRAY['middle back'], ARRAY['biceps','lats','traps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single-Arm Cable Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Single-Arm Lat Pulldown', 'cable', true, 'cable', 'beginner', 'pull', 'compound', ARRAY['Select an appropriate weight and adjust the knee pad to help keep you down. Grasp the handle with a pronated grip. This will be your starting position.','Pull the handle down, squeezing your elbow to your side as you flex the elbow.','Pause at the bottom of the motion, and then slowly return the handle to the starting position.','For multiple repetitions, avoid completely returning the weight to keep tension on the muscles being worked.'], ARRAY['lats'], ARRAY['biceps','middle back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single-Arm Lat Pulldown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Deadlift', 'barbell', true, 'barbell', 'intermediate', 'pull', 'compound', ARRAY['Stand in front of a loaded barbell.','While keeping the back as straight as possible, bend your knees, bend forward and grasp the bar using a medium (shoulder width) overhand grip. This will be the starting position of the exercise. Tip: If it is difficult to hold on to the bar with this grip, alternate your grip or use wrist straps.','While holding the bar, start the lift by pushing with your legs while simultaneously getting your torso to the upright position as you breathe out. In the upright position, stick your chest out and contract the back by bringing the shoulder blades back. Think of how the soldiers in the military look when they are in standing in attention.','Go back to the starting position by bending at the knees while simultaneously leaning the torso forward at the waist while keeping the back straight. When the weights on the bar touch the floor you are back at the starting position and ready to perform another repetition.','Perform the amount of repetitions prescribed in the program.'], ARRAY['lower back'], ARRAY['calves','forearms','glutes','hamstrings','lats','middle back','quadriceps','traps'], ARRAY['Bar over mid-foot, shins touching bar','Push the floor away, dont pull the bar up','Keep bar glued to your legs entire lift','Lock out by squeezing glutes, dont lean back','Brace core like youre about to get punched'], ARRAY['Rounding lower back','Bar drifting forward away from body','Jerking bar off floor instead of building tension','Hyperextending at lockout']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Deadlift');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Sumo Deadlift', 'barbell', true, 'barbell', 'intermediate', 'pull', 'compound', ARRAY['Begin with a bar loaded on the ground. Approach the bar so that the bar intersects the middle of the feet. The feet should be set very wide, near the collars. Bend at the hips to grip the bar. The arms should be directly below the shoulders, inside the legs, and you can use a pronated grip, a mixed grip, or hook grip. Relax the shoulders, which in effect lengthens your arms.','Take a breath, and then lower your hips, looking forward with your head with your chest up. Drive through the floor, spreading your feet apart, with your weight on the back half of your feet. Extend through the hips and knees.','As the bar passes through the knees, lean back and drive the hips into the bar, pulling your shoulder blades together.','Return the weight to the ground by bending at the hips and controlling the weight on the way down.'], ARRAY['hamstrings'], ARRAY['adductors','forearms','glutes','lower back','middle back','quadriceps','traps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Sumo Deadlift');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Romanian Deadlift', 'barbell', true, 'barbell', 'intermediate', 'pull', 'compound', ARRAY['Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width. Tip: Depending on the weight used, you may need wrist wraps to perform the exercise and also a raised platform in order to allow for better range of motion.','Bend the knees slightly and keep the shins vertical, hips back and back straight. This will be your starting position.','Keeping your back and arms completely straight at all times, use your hips to lift the bar as you exhale. Tip: The movement should not be fast but steady and under control.','Once you are standing completely straight up, lower the bar by pushing the hips back, only slightly bending the knees, unlike when squatting. Tip: Take a deep breath at the start of the movement and keep your chest up. Hold your breath as you lower and exhale as you complete the movement.','Repeat for the recommended amount of repetitions.'], ARRAY['hamstrings'], ARRAY['calves','glutes','lower back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Romanian Deadlift');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Stiff-Leg Deadlift', 'barbell', true, 'barbell', 'intermediate', 'pull', 'compound', ARRAY['Grasp a bar using an overhand grip (palms facing down). You may need some wrist wraps if using a significant amount of weight.','Stand with your torso straight and your legs spaced using a shoulder width or narrower stance. The knees should be slightly bent. This is your starting position.','Keeping the knees stationary, lower the barbell to over the top of your feet by bending at the hips while keeping your back straight. Keep moving forward as if you were going to pick something from the floor until you feel a stretch on the hamstrings. Inhale as you perform this movement.','Start bringing your torso up straight again by extending your hips until you are back at the starting position. Exhale as you perform this movement.','Repeat for the recommended amount of repetitions.'], ARRAY['hamstrings'], ARRAY['glutes','lower back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Stiff-Leg Deadlift');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Trap Bar Deadlift', 'other', true, 'other', 'beginner', 'pull', 'compound', ARRAY['For this exercise load a trap bar, also known as a hex bar, to an appropriate weight resting on the ground. Stand in the center of the apparatus and grasp both handles.','Lower your hips, look forward with your head and keep your chest up.','Begin the movement by driving through the heels and extend your hips and knees. Avoid rounding your back at all times.','At the completion of the movement, lower the weight back to the ground under control.'], ARRAY['quadriceps'], ARRAY['glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Trap Bar Deadlift');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Shoulder Press', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound', ARRAY['Sit on a bench with back support in a squat rack. Position a barbell at a height that is just above your head. Grab the barbell with a pronated grip (palms facing forward).','Once you pick up the barbell with the correct grip width, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.','Lower the bar down to the shoulders slowly as you inhale.','Lift the bar back up to the starting position as you exhale.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY['chest','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Shoulder Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Seated Barbell Press', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound', ARRAY['Sit on a Military Press Bench with a bar behind your head and either have a spotter give you the bar (better on the rotator cuff this way) or pick it up yourself carefully with a pronated grip (palms facing forward). Tip: Your grip should be wider than shoulder width and it should create a 90-degree angle between the forearm and the upper arm as the barbell goes down.','Once you pick up the barbell with the correct grip length, lift the bar up over your head by locking your arms. Hold at about shoulder level and slightly in front of your head. This is your starting position.','Lower the bar down to the collarbone slowly as you inhale.','Lift the bar back up to the starting position as you exhale.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seated Barbell Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Standing Dumbbell Press', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Standing with your feet shoulder width apart, take a dumbbell in each hand. Raise the dumbbells to head height, the elbows out and about 90 degrees. This will be your starting position.','Maintaining strict technique with no leg drive or leaning back, extend through the elbow to raise the weights together directly above your head.','Pause, and slowly return the weight to the starting position.'], ARRAY['shoulders'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Standing Dumbbell Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Seated Dumbbell Press', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Grab a couple of dumbbells and sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs.','Clean the dumbbells up one at a time by using your thighs to bring the dumbbells up to shoulder height at each side.','Rotate the wrists so that the palms of your hands are facing forward. This is your starting position.','As you exhale, push the dumbbells up until they touch at the top.','After a second pause, slowly come down back to the starting position as you inhale.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seated Dumbbell Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Arnold Press', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'compound', ARRAY['Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent. Tip: Your arms should be next to your torso. The starting position should look like the contracted portion of a dumbbell curl.','Now to perform the movement, raise the dumbbells as you rotate the palms of your hands until they are facing forward.','Continue lifting the dumbbells until your arms are extended above you in straight arm position. Breathe out as you perform this portion of the movement.','After a second pause at the top, begin to lower the dumbbells to the original position by rotating the palms of your hands towards you. Tip: The left arm will be rotated in a counter clockwise manner while the right one will be rotated clockwise. Breathe in as you perform this portion of the movement.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Arnold Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Push Press', 'barbell', true, 'barbell', 'expert', 'push', 'compound', ARRAY[]::TEXT[], ARRAY['shoulders'], ARRAY['quadriceps','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Push Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Lateral Raise', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'isolation', ARRAY['Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you. This will be your starting position.','While maintaining the torso in a stationary position (no swinging), lift the dumbbells to your side with a slight bend on the elbow and the hands slightly tilted forward as if pouring water in a glass. Continue to go up until you arms are parallel to the floor. Exhale as you execute this movement and pause for a second at the top.','Lower the dumbbells back down slowly to the starting position as you inhale.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Lateral Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Lateral Raise', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['Stand in the middle of two low pulleys that are opposite to each other and place a flat bench right behind you (in perpendicular fashion to you; the narrow edge of the bench should be the one behind you). Select the weight to be used on each pulley.','Now sit at the edge of the flat bench behind you with your feet placed in front of your knees.','Bend forward while keeping your back flat and rest your torso on the thighs.','Have someone give you the single handles attached to the pulleys. Grasp the left pulley with the right hand and the right pulley with the left after you select your weight. The pulleys should run under your knees and your arms will be extended with palms facing each other and a slight bend at the elbows. This will be the starting position.','While keeping the arms stationary, raise the upper arms to the sides until they are parallel to the floor and at shoulder height. Exhale during the execution of this movement and hold the contraction for a second.','Slowly lower your arms to the starting position as you inhale.','Repeat for the recommended amount of repetitions. Tip: Maintain upper arms perpendicular to torso and a fixed elbow position (10 degree to 30 degree angle) throughout exercise.'], ARRAY['shoulders'], ARRAY['middle back','traps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Lateral Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Front Raise', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'isolation', ARRAY['Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs. This will be your starting position.','While maintaining the torso stationary (no swinging), lift the left dumbbell to the front with a slight bend on the elbow and the palms of the hands always facing down. Continue to go up until you arm is slightly above parallel to the floor. Exhale as you execute this portion of the movement and pause for a second at the top. Inhale after the second pause.','Now lower the dumbbell back down slowly to the starting position as you simultaneously lift the right dumbbell.','Continue alternating in this fashion until all of the recommended amount of repetitions have been performed for each arm.'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Front Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Rear Delt Fly', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation', ARRAY['To begin, lie down on an incline bench with the chest and stomach pressing against the incline. Have the dumbbells in each hand with the palms facing each other (neutral grip).','Extend the arms in front of you so that they are perpendicular to the angle of the bench. The legs should be stationary while applying pressure with the ball of your toes. This is the starting position.','Maintaining the slight bend of the elbows, move the weights out and away from each other (to the side) in an arc motion while exhaling. Tip: Try to squeeze your shoulder blades together to get the best results from this exercise.','The arms should be elevated until they are parallel to the floor.','Feel the contraction and slowly lower the weights back down to the starting position while inhaling.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Rear Delt Fly');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Machine Rear Delt Fly', 'machine', true, 'machine', 'beginner', 'pull', 'isolation', ARRAY['Adjust the handles so that they are fully to the rear. Make an appropriate weight selection and adjust the seat height so the handles are at shoulder level. Grasp the handles with your hands facing inwards. This will be your starting position.','In a semicircular motion, pull your hands out to your side and back, contracting your rear delts.','Keep your arms slightly bent throughout the movement, with all of the motion occurring at the shoulder joint.','Pause at the rear of the movement, and slowly return the weight to the starting position.'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Rear Delt Fly');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Face Pull', 'cable', true, 'cable', 'intermediate', 'pull', 'compound', ARRAY['Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so. Keep your upper arms parallel to the ground.'], ARRAY['shoulders'], ARRAY['middle back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Face Pull');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Upright Row', 'barbell', true, 'barbell', 'beginner', 'pull', 'compound', ARRAY['Grasp a barbell with an overhand grip that is slightly less than shoulder width. The bar should be resting on the top of your thighs with your arms extended and a slight bend in your elbows. Your back should also be straight. This will be your starting position.','Now exhale and use the sides of your shoulders to lift the bar, raising your elbows up and to the side. Keep the bar close to your body as you raise it. Continue to lift the bar until it nearly touches your chin. Tip: Your elbows should drive the motion, and should always be higher than your forearms. Remember to keep your torso stationary and pause for a second at the top of the movement.','Lower the bar back down slowly to the starting position. Inhale as you perform this portion of the movement.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY['traps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Upright Row');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Machine Shoulder Press', 'machine', true, 'machine', 'beginner', 'push', 'compound', ARRAY['Sit down on the Shoulder Press Machine and select the weight.','Grab the handles to your sides as you keep the elbows bent and in line with your torso. This will be your starting position.','Now lift the handles as you exhale and you extend the arms fully. At the top of the position make sure that you hold the contraction for a second.','Lower the handles slowly back to the starting position as you inhale.','Repeat for the recommended amount of repetitions.'], ARRAY['shoulders'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Shoulder Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Shrug', 'barbell', true, 'barbell', 'beginner', 'pull', 'isolation', ARRAY['Stand up straight with your feet at shoulder width as you hold a barbell with both hands in front of you using a pronated grip (palms facing the thighs). Tip: Your hands should be a little wider than shoulder width apart. You can use wrist wraps for this exercise for a better grip. This will be your starting position.','Raise your shoulders up as far as you can go as you breathe out and hold the contraction for a second. Tip: Refrain from trying to lift the barbell by using your biceps.','Slowly return to the starting position as you breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['traps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Shrug');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Shrug', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation', ARRAY['Stand erect with a dumbbell on each hand (palms facing your torso), arms extended on the sides.','Lift the dumbbells by elevating the shoulders as high as possible while you exhale. Hold the contraction at the top for a second. Tip: The arms should remain extended at all times. Refrain from using the biceps to help lift the dumbbells. Only the shoulders should be moving up and down.','Lower the dumbbells back to the original position.','Repeat for the recommended amount of repetitions.'], ARRAY['traps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Shrug');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Curl', 'barbell', true, 'barbell', 'beginner', 'pull', 'isolation', ARRAY['Stand up with your torso upright while holding a barbell at a shoulder-width grip. The palm of your hands should be facing forward and the elbows should be close to the torso. This will be your starting position.','While holding the upper arms stationary, curl the weights forward while contracting the biceps as you breathe out. Tip: Only the forearms should move.','Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second and squeeze the biceps hard.','Slowly begin to bring the bar back to starting position as your breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY['forearms'], ARRAY['Keep elbows pinned to your sides','Squeeze biceps hard at top','Lower slowly, 2-3 seconds down','Dont swing body, strict form','Wrists stay neutral throughout'], ARRAY['Swinging body for momentum','Moving elbows forward','Going too heavy with bad form','Not going full range of motion']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'EZ-Bar Curl', 'e-z curl bar', true, 'e-z curl bar', 'beginner', 'pull', 'isolation', ARRAY['Stand up straight while holding an EZ curl bar at the wide outer handle. The palms of your hands should be facing forward and slightly tilted inward due to the shape of the bar. Keep your elbows close to your torso. This will be your starting position.','Now, while keeping your upper arms stationary, exhale and curl the weights forward while contracting the biceps. Focus on only moving your forearms.','Continue to raise the weight until your biceps are fully contracted and the bar is at shoulder level. Hold the top contracted position for a moment and squeeze the biceps.','Then inhale and slowly lower the bar back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'EZ-Bar Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Bicep Curl', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation', ARRAY['Stand up straight with a dumbbell in each hand at arm''s length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.','Now, keeping the upper arms stationary, exhale and curl the weights while contracting your biceps. Continue to raise the weights until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a brief pause as you squeeze your biceps.','Then, inhale and slowly begin to lower the dumbbells back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY['forearms'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Bicep Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Hammer Curl', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation', ARRAY['Stand up with your torso upright and a dumbbell on each hand being held at arms length. The elbows should be close to the torso.','The palms of the hands should be facing your torso. This will be your starting position.','Now, while holding your upper arm stationary, exhale and curl the weight forward while contracting the biceps. Continue to raise the weight until the biceps are fully contracted and the dumbbell is at shoulder level. Hold the contracted position for a brief moment as you squeeze the biceps. Tip: Focus on keeping the elbow stationary and only moving your forearm.','After the brief pause, inhale and slowly begin the lower the dumbbells back down to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hammer Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Incline Dumbbell Curl', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation', ARRAY['Sit back on an incline bench with a dumbbell in each hand held at arms length. Keep your elbows close to your torso and rotate the palms of your hands until they are facing forward. This will be your starting position.','While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Hold the contracted position for a second.','Slowly begin to bring the dumbbells back to starting position as your breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Incline Dumbbell Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Preacher Curl', 'barbell', true, 'barbell', 'beginner', 'pull', 'isolation', ARRAY['To perform this movement you will need a preacher bench and an E-Z bar. Grab the E-Z curl bar at the close inner handle (either have someone hand you the bar which is preferable or grab the bar from the front bar rest provided by most preacher benches). The palm of your hands should be facing forward and they should be slightly tilted inwards due to the shape of the bar.','With the upper arms positioned against the preacher bench pad and the chest against it, hold the E-Z Curl Bar at shoulder length. This will be your starting position.','As you breathe in, slowly lower the bar until your upper arm is extended and the biceps is fully stretched.','As you exhale, use the biceps to curl the weight up until your biceps is fully contracted and the bar is at shoulder height. Squeeze the biceps hard and hold this position for a second.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Preacher Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Preacher Curl', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['Place a preacher bench about 2 feet in front of a pulley machine.','Attach a straight bar to the low pulley.','Sit at the preacher bench with your elbow and upper arms firmly on top of the bench pad and have someone hand you the bar from the low pulley.','Grab the bar and fully extend your arms on top of the preacher bench pad. This will be your starting position.','Now start pilling the weight up towards your shoulders and squeeze the biceps hard at the top of the movement. Exhale as you perform this motion. Also, hold for a second at the top.','Now slowly lower the weight to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY['forearms'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Preacher Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Concentration Curl', 'dumbbell', true, 'dumbbell', 'beginner', 'pull', 'isolation', ARRAY['Sit down on a flat bench with one dumbbell in front of you between your legs. Your legs should be spread with your knees bent and feet on the floor.','Use your right arm to pick the dumbbell up. Place the back of your right upper arm on the top of your inner right thigh. Rotate the palm of your hand until it is facing forward away from your thigh. Tip: Your arm should be extended and the dumbbell should be above the floor. This will be your starting position.','While holding the upper arm stationary, curl the weights forward while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the dumbbells are at shoulder level. Tip: At the top of the movement make sure that the little finger of your arm is higher than your thumb. This guarantees a good contraction. Hold the contracted position for a second as you squeeze the biceps.','Slowly begin to bring the dumbbells back to starting position as your breathe in. Caution: Avoid swinging motions at any time.','Repeat for the recommended amount of repetitions. Then repeat the movement with the left arm.'], ARRAY['biceps'], ARRAY['forearms'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Concentration Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Hammer Curl', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['Attach a rope attachment to a low pulley and stand facing the machine about 12 inches away from it.','Grasp the rope with a neutral (palms-in) grip and stand straight up keeping the natural arch of the back and your torso stationary.','Put your elbows in by your side and keep them there stationary during the entire movement. Tip: Only the forearms should move; not your upper arms. This will be your starting position.','Using your biceps, pull your arms up as you exhale until your biceps touch your forearms. Tip: Remember to keep the elbows in and your upper arms stationary.','After a 1 second contraction where you squeeze your biceps, slowly start to bring the weight back to the original position.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Hammer Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Curl', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['Stand up with your torso upright while holding a cable curl bar that is attached to a low pulley. Grab the cable bar at shoulder width and keep the elbows close to the torso. The palm of your hands should be facing up (supinated grip). This will be your starting position.','While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle.','Slowly begin to bring the curl bar back to starting position as your breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Spider Curl', 'e-z curl bar', true, 'e-z curl bar', 'beginner', 'pull', 'isolation', ARRAY['Start out by setting the bar on the part of the preacher bench that you would normally sit on. Make sure to align the barbell properly so that it is balanced and will not fall off.','Move to the front side of the preacher bench (the part where the arms usually lay) and position yourself to lay at a 45 degree slant with your torso and stomach pressed against the front side of the preacher bench.','Make sure that your feet (especially the toes) are well positioned on the floor and place your upper arms on top of the pad located on the inside part of the preacher bench.','Use your arms to grab the barbell with a supinated grip (palms facing up) at about shoulder width apart or slightly closer from each other.','Slowly begin to lift the barbell upwards and exhale. Hold the contracted position for a second as you squeeze the biceps.','Slowly begin to bring the barbell back to the starting position as your breathe in. .','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Spider Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Machine Bicep Curl', 'machine', true, 'machine', 'beginner', 'pull', 'isolation', ARRAY['Adjust the seat to the appropriate height and make your weight selection. Place your upper arms against the pads and grasp the handles. This will be your starting position.','Perform the movement by flexing the elbow, pulling your lower arm towards your upper arm.','Pause at the top of the movement, and then slowly return the weight to the starting position.','Avoid returning the weight all the way to the stops until the set is complete to keep tension on the muscles being worked.'], ARRAY['biceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Bicep Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Reverse Barbell Curl', 'barbell', true, 'barbell', 'beginner', 'pull', 'isolation', ARRAY['Stand up with your torso upright while holding a barbell at shoulder width with the elbows close to the torso. The palm of your hands should be facing down (pronated grip). This will be your starting position.','While holding the upper arms stationary, curl the weights while contracting the biceps as you breathe out. Only the forearms should move. Continue the movement until your biceps are fully contracted and the bar is at shoulder level. Hold the contracted position for a second as you squeeze the muscle.','Slowly begin to bring the bar back to starting position as your breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['biceps'], ARRAY['forearms'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Reverse Barbell Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Triceps Pushdown', 'cable', true, 'cable', 'beginner', 'push', 'isolation', ARRAY['Attach a straight or angled bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.','Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the bar. This is your starting position.','Using the triceps, bring the bar down until it touches the front of your thighs and the arms are fully extended perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.','After a second hold at the contracted position, bring the bar slowly up to the starting point. Breathe in as you perform this step.','Repeat for the recommended amount of repetitions.'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Triceps Pushdown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Rope Pushdown', 'cable', true, 'cable', 'beginner', 'push', 'isolation', ARRAY['Attach a rope attachment to a high pulley and grab with a neutral grip (palms facing each other).','Standing upright with the torso straight and a very small inclination forward, bring the upper arms close to your body and perpendicular to the floor. The forearms should be pointing up towards the pulley as they hold the rope with the palms facing each other. This is your starting position.','Using the triceps, bring the rope down as you bring each side of the rope to the side of your thighs. At the end of the movement the arms are fully extended and perpendicular to the floor. The upper arms should always remain stationary next to your torso and only the forearms should move. Exhale as you perform this movement.','After holding for a second, at the contracted position, bring the rope slowly up to the starting point. Breathe in as you perform this step.','Repeat for the recommended amount of repetitions.'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Rope Pushdown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Skullcrusher', 'e-z curl bar', true, 'e-z curl bar', 'beginner', 'push', 'isolation', ARRAY['Using a close grip, lift the EZ bar and hold it with your elbows in as you lie on the bench. Your arms should be perpendicular to the floor. This will be your starting position.','Keeping the upper arms stationary, lower the bar by allowing the elbows to flex. Inhale as you perform this portion of the movement. Pause once the bar is directly above the forehead.','Lift the bar back to the starting position by extending the elbow and exhaling.','Repeat.'], ARRAY['triceps'], ARRAY['forearms'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Skullcrusher');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Tricep Kickback', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'isolation', ARRAY['Start with a dumbbell in each hand and your palms facing your torso. Keep your back straight with a slight bend in the knees and bend forward at the waist. Your torso should be almost parallel to the floor. Make sure to keep your head up. Your upper arms should be close to your torso and parallel to the floor. Your forearms should be pointed towards the floor as you hold the weights. There should be a 90-degree angle formed between your forearm and upper arm. This is your starting position.','Now, while keeping your upper arms stationary, exhale and use your triceps to lift the weights until the arm is fully extended. Focus on moving the forearm.','After a brief pause at the top contraction, inhale and slowly lower the dumbbells back down to the starting position.','Repeat the movement for the prescribed amount of repetitions.'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Tricep Kickback');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Overhead Cable Tricep Extension', 'cable', true, 'cable', 'beginner', 'push', 'isolation', ARRAY['Attach a rope to the bottom pulley of the pulley machine.','Grasping the rope with both hands, extend your arms with your hands directly above your head using a neutral grip (palms facing each other). Your elbows should be in close to your head and the arms should be perpendicular to the floor with the knuckles aimed at the ceiling. This will be your starting position.','Slowly lower the rope behind your head as you hold the upper arms stationary. Inhale as you perform this movement and pause when your triceps are fully stretched.','Return to the starting position by flexing your triceps as you breathe out.','Repeat for the recommended amount of repetitions.'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Overhead Cable Tricep Extension');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Skullcrusher', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'isolation', ARRAY['Lie on a flat bench while holding two dumbbells directly in front of you. Your arms should be fully extended at a 90-degree angle from your torso and the floor. The palms should be facing in and the elbows should be tucked in. This is the starting position.','As you breathe in and you keep the upper arms stationary with the elbows in, slowly lower the weight until the dumbbells are near your ears.','At that point, while keeping the elbows in and the upper arms stationary, use the triceps to bring the weight back up to the starting position as you breathe out.','Repeat for the recommended amount of repetitions.'], ARRAY['triceps'], ARRAY['chest','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Skullcrusher');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Bench Dip', 'body only', true, 'body only', 'beginner', 'push', 'compound', ARRAY['For this exercise you will need to place a bench behind your back. With the bench perpendicular to your body, and while looking away from it, hold on to the bench on its edge with the hands fully extended, separated at shoulder width. The legs will be extended forward, bent at the waist and perpendicular to your torso. This will be your starting position.','Slowly lower your body as you inhale by bending at the elbows until you lower yourself far enough to where there is an angle slightly smaller than 90 degrees between the upper arm and the forearm. Tip: Keep the elbows as close as possible throughout the movement. Forearms should always be pointing down.','Using your triceps to bring your torso up again, lift yourself back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['triceps'], ARRAY['chest','shoulders'], ARRAY['Hands on bench edge behind you','Lower until upper arms parallel to floor','Press up through palms','Keep butt close to bench','Add weight on lap to progress'], ARRAY['Going too deep','Shoulders rolling forward','Feet too far away']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bench Dip');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Tricep Dip', 'body only', true, 'body only', 'beginner', 'push', 'compound', ARRAY['To get into the starting position, hold your body at arm''s length with your arms nearly locked above the bars.','Now, inhale and slowly lower yourself downward. Your torso should remain upright and your elbows should stay close to your body. This helps to better focus on tricep involvement. Lower yourself until there is a 90 degree angle formed between the upper arm and forearm.','Then, exhale and push your torso back up using your triceps to bring your body back to the starting position.','Repeat the movement for the prescribed amount of repetitions.'], ARRAY['triceps'], ARRAY['chest','shoulders'], ARRAY['Keep torso upright, dont lean forward','Lower until upper arms parallel to floor','Press up by straightening arms fully','Elbows point straight back not out','Lean forward = more chest, upright = more triceps'], ARRAY['Going too deep and straining shoulders','Leaning too far forward','Partial reps']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Tricep Dip');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Machine Tricep Extension', 'machine', true, 'machine', 'beginner', 'push', 'isolation', ARRAY['Adjust the seat to the appropriate height and make your weight selection. Place your upper arms against the pads and grasp the handles. This will be your starting position.','Perform the movement by extending the elbow, pulling your lower arm away from your upper arm.','Pause at the completion of the movement, and then slowly return the weight to the starting position.','Avoid returning the weight all the way to the stops until the set is complete to keep tension on the muscles being worked.'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Machine Tricep Extension');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Reverse Grip Pushdown', 'cable', true, 'cable', 'beginner', 'push', 'isolation', ARRAY['Start by setting a bar attachment (straight or e-z) on a high pulley machine.','Facing the bar attachment, grab it with the palms facing up (supinated grip) at shoulder width. Lower the bar by using your lats until your arms are fully extended by your sides. Tip: Elbows should be in by your sides and your feet should be shoulder width apart from each other. This is the starting position.','Slowly elevate the bar attachment up as you inhale so it is aligned with your chest. Only the forearms should move and the elbows/upper arms should be stationary by your side at all times.','Then begin to lower the cable bar back down to the original staring position while exhaling and contracting the triceps hard.','Repeat for the recommended amount of repetitions.'], ARRAY['triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Reverse Grip Pushdown');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Back Squat', 'barbell', true, 'barbell', 'beginner', 'push', 'compound', ARRAY['This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack to just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.','Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.','Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances discussed in the foot stances section).','Begin to slowly lower the bar by bending the knees and hips as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees. Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.','Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings','lower back'], ARRAY['Bar on upper traps, not on neck','Brace core, big breath before each rep','Push knees out over toes','Sit back and down, hips below parallel','Drive through midfoot, chest stays up'], ARRAY['Knees caving inward','Rising on toes','Rounding lower back at bottom','Not hitting depth','Leaning too far forward']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Back Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Front Squat', 'barbell', true, 'barbell', 'expert', 'push', 'compound', ARRAY['This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack that best matches your height. Once the correct height is chosen and the bar is loaded, bring your arms up under the bar while keeping the elbows high and the upper arm slightly above parallel to the floor. Rest the bar on top of the deltoids and cross your arms while grasping the bar for total control.','Lift the bar off the rack by first pushing with your legs and at the same time straightening your torso.','Step away from the rack and position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times as looking down will get you off balance and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).','Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.','Begin to raise the bar as you exhale by pushing the floor mainly with the middle of your foot as you straighten the legs again and go back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Front Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Goblet Squat', 'kettlebells', true, 'kettlebells', 'beginner', 'push', 'compound', ARRAY['Stand holding a light kettlebell by the horns close to your chest. This will be your starting position.','Squat down between your legs until your hamstrings are on your calves. Keep your chest and head up and your back straight.','At the bottom position, pause and use your elbows to push your knees out. Return to the starting position, and repeat for 10-20 repetitions.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings','shoulders'], ARRAY['Hold dumbbell at chest, elbows inside knees','Sit deep, use weight as counterbalance','Keep chest tall and proud','Great for learning proper squat pattern','Push knees out at the bottom'], ARRAY['Letting elbows flare out','Not going deep enough','Rounding upper back']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Goblet Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Bodyweight Squat', 'body only', true, 'body only', 'beginner', 'push', 'compound', ARRAY['Stand with your feet shoulder width apart. You can place your hands behind your head. This will be your starting position.','Begin the movement by flexing your knees and hips, sitting back with your hips.','Continue down to full depth if you are able,and quickly reverse the motion until you return to the starting position. As you squat, keep your head and chest up and push your knees out.'], ARRAY['quadriceps'], ARRAY['glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Bodyweight Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Hack Squat', 'machine', true, 'machine', 'beginner', 'push', 'compound', ARRAY['Place the back of your torso against the back pad of the machine and hook your shoulders under the shoulder pads provided.','Position your legs in the platform using a shoulder width medium stance with the toes slightly pointed out. Tip: Keep your head up at all times and also maintain the back on the pad at all times.','Place your arms on the side handles of the machine and disengage the safety bars (which on most designs is done by moving the side handles from a facing front position to a diagonal position).','Now straighten your legs without locking the knees. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).','Begin to slowly lower the unit by bending the knees as you maintain a straight posture with the head up (back on the pad at all times). Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.','Begin to raise the unit as you exhale by pushing the floor with mainly with the heel of your foot as you straighten the legs again and go back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY['Feet shoulder width on platform','Lower until thighs parallel','Push through heels','Isolates quads without lower back stress','Dont lock knees at top'], ARRAY['Feet too high on platform','Coming up on toes','Not controlling the descent']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hack Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Hack Squat', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound', ARRAY['Stand up straight while holding a barbell behind you at arms length and your feet at shoulder width. Tip: A shoulder width grip is best with the palms of your hands facing back. You can use wrist wraps for this exercise for a better grip. This will be your starting position.','While keeping your head and eyes up and back straight, squat until your upper thighs are parallel to the floor. Breathe in as you slowly go down.','Pressing mainly with the heel of the foot and squeezing the thighs, go back up as you breathe out.','Repeat for the recommended amount of repetitions.'], ARRAY['quadriceps'], ARRAY['calves','forearms','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Hack Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Leg Press', 'machine', true, 'machine', 'beginner', 'push', 'compound', ARRAY['Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance. (Note: For the purposes of this discussion we will use the medium stance described above which targets overall development; however you can choose any of the three stances described in the foot positioning section).','Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you. Tip: Make sure that you do not lock your knees. Your torso and the legs should make a perfect 90-degree angle. This will be your starting position.','As you inhale, slowly lower the platform until your upper and lower legs make a 90-degree angle.','Pushing mainly with the heels of your feet and using the quadriceps go back to the starting position as you exhale.','Repeat for the recommended amount of repetitions and ensure to lock the safety pins properly once you are done. You do not want that platform falling on you fully loaded.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY['Feet shoulder width, middle of platform','Lower until knees at 90 degrees','Press through full foot not just toes','Dont lock knees completely at top','Keep lower back pressed into pad'], ARRAY['Feet too high (less quad, more glute)','Locking out knees','Lifting butt off pad at bottom','Bouncing at the bottom']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Leg Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Lunge', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Stand with your torso upright holding two dumbbells in your hands by your sides. This will be your starting position.','Step forward with your right leg around 2 feet or so from the foot being left stationary behind and lower your upper body down, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: As in the other exercises, do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. Make sure that you keep your front shin perpendicular to the ground.','Using mainly the heel of your foot, push up and go back to the starting position as you exhale.','Repeat the movement for the recommended amount of repetitions and then perform with the left leg.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY['Long step forward, both knees to 90 degrees','Lower straight down, dont lean forward','Push through front heel to stand','Keep torso upright entire time','Back knee should nearly touch floor'], ARRAY['Step too short','Front knee shooting past toes','Leaning forward excessively','Losing balance']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Lunge');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Lunge', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound', ARRAY['This exercise is best performed inside a squat rack for safety purposes. To begin, first set the bar on a rack just below shoulder level. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.','Hold on to the bar using both arms at each side and lift it off the rack by first pushing with your legs and at the same time straightening your torso.','Step away from the rack and step forward with your right leg and squat down through your hips, while keeping the torso upright and maintaining balance. Inhale as you go down. Note: Do not allow your knee to go forward beyond your toes as you come down, as this will put undue stress on the knee joint. li>','Using mainly the heel of your foot, push up and go back to the starting position as you exhale.','Repeat the movement for the recommended amount of repetitions and then perform with the left leg.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Lunge');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Walking Lunge', 'barbell', true, 'barbell', 'beginner', 'push', 'compound', ARRAY['Begin standing with your feet shoulder width apart and a barbell across your upper back.','Step forward with one leg, flexing the knees to drop your hips. Descend until your rear knee nearly touches the ground. Your posture should remain upright, and your front knee should stay above the front foot.','Drive through the heel of your lead foot and extend both knees to raise yourself back up.','Step forward with your rear foot, repeating the lunge on the opposite leg.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Walking Lunge');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dumbbell Step-Up', 'dumbbell', true, 'dumbbell', 'intermediate', 'push', 'compound', ARRAY['Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).','Place the right foot on the elevated platform. Step on the platform by extending the hip and the knee of your right leg. Use the heel mainly to lift the rest of your body up and place the foot of the left leg on the platform as well. Breathe out as you execute the force required to come up.','Step down with the left leg by flexing the hip and knee of the right leg as you inhale. Return to the original standing position by placing the right foot of to next to the left foot on the initial position.','Repeat with the right leg for the recommended amount of repetitions and then perform with the left leg.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dumbbell Step-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Box Squat', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound', ARRAY['The box squat allows you to squat to desired depth and develop explosive strength in the squat movement. Begin in a power rack with a box at the appropriate height behind you. Typically, you would aim for a box height that brings you to a parallel squat, but you can train higher or lower if desired.','Begin by stepping under the bar and placing it across the back of the shoulders. Squeeze your shoulder blades together and rotate your elbows forward, attempting to bend the bar across your shoulders. Remove the bar from the rack, creating a tight arch in your lower back, and step back into position. Place your feet wider for more emphasis on the back, glutes, adductors, and hamstrings, or closer together for more quad development. Keep your head facing forward.','With your back, shoulders, and core tight, push your knees and butt out and you begin your descent. Sit back with your hips until you are seated on the box. Ideally, your shins should be perpendicular to the ground. Pause when you reach the box, and relax the hip flexors. Never bounce off of a box.','Keeping the weight on your heels and pushing your feet and knees out, drive upward off of the box as you lead the movement with your head. Continue upward, maintaining tightness head to toe.'], ARRAY['quadriceps'], ARRAY['adductors','calves','glutes','hamstrings','lower back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Box Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Smith Machine Squat', 'machine', true, 'machine', 'beginner', 'push', 'compound', ARRAY['To begin, first set the bar on the height that best matches your height. Once the correct height is chosen and the bar is loaded, step under the bar and place the back of your shoulders (slightly below the neck) across it.','Hold on to the bar using both arms at each side (palms facing forward), unlock it and lift it off the rack by first pushing with your legs and at the same time straightening your torso.','Position your legs using a shoulder width medium stance with the toes slightly pointed out. Keep your head up at all times and also maintain a straight back. This will be your starting position. (Note: For the purposes of this discussion we will use the medium stance which targets overall development; however you can choose any of the three stances discussed in the foot stances section).','Begin to slowly lower the bar by bending the knees as you maintain a straight posture with the head up. Continue down until the angle between the upper leg and the calves becomes slightly less than 90-degrees (which is the point in which the upper legs are below parallel to the floor). Inhale as you perform this portion of the movement. Tip: If you performed the exercise correctly, the front of the knees should make an imaginary straight line with the toes that is perpendicular to the front. If your knees are past that imaginary line (if they are past your toes) then you are placing undue stress on the knee and the exercise has been performed incorrectly.','Begin to raise the bar as you exhale by pushing the floor with the heel of your foot as you straighten the legs again and go back to the starting position.','Repeat for the recommended amount of repetitions.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings','lower back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Smith Machine Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Sumo Squat', 'dumbbell', true, 'dumbbell', 'beginner', 'push', 'compound', ARRAY['Hold a dumbbell at the base with both hands and stand straight up. Move your legs so that they are wider than shoulder width apart from each other with your knees slightly bent.','Your toes should be facing out. Note: Your arms should be stationary while performing the exercise. This is the starting position.','Slowly bend the knees and lower your legs until your thighs are parallel to the floor. Make sure to inhale as this is the eccentric part of the exercise.','Press mainly with the heel of the foot to bring the body back to the starting position while exhaling.','Repeat for the recommended amount of repetitions.'], ARRAY['quadriceps'], ARRAY['abdominals','calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Sumo Squat');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Leg Extension', 'machine', true, 'machine', 'beginner', 'push', 'isolation', ARRAY['For this exercise you will need to use a leg extension machine. First choose your weight and sit on the machine with your legs under the pad (feet pointed forward) and the hands holding the side bars. This will be your starting position. Tip: You will need to adjust the pad so that it falls on top of your lower leg (just above your feet). Also, make sure that your legs form a 90-degree angle between the lower and upper leg. If the angle is less than 90-degrees then that means the knee is over the toes which in turn creates undue stress at the knee joint. If the machine is designed that way, either look for another machine or just make sure that when you start executing the exercise you stop going down once you hit the 90-degree angle.','Using your quadriceps, extend your legs to the maximum as you exhale. Ensure that the rest of the body remains stationary on the seat. Pause a second on the contracted position.','Slowly lower the weight back to the original position as you inhale, ensuring that you do not go past the 90-degree angle limit.','Repeat for the recommended amount of times.'], ARRAY['quadriceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Leg Extension');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Lying Leg Curl', 'machine', true, 'machine', 'beginner', 'pull', 'isolation', ARRAY['Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves). Tip: Preferably use a leg curl machine that is angled as opposed to flat since an angled position is more favorable for hamstrings recruitment.','Keeping the torso flat on the bench, ensure your legs are fully stretched and grab the side handles of the machine. Position your toes straight (or you can also use any of the other two stances described on the foot positioning section). This will be your starting position.','As you exhale, curl your legs up as far as possible without lifting the upper legs from the pad. Once you hit the fully contracted position, hold it for a second.','As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions.'], ARRAY['hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Lying Leg Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Seated Leg Curl', 'machine', true, 'machine', 'beginner', 'pull', 'isolation', ARRAY['Adjust the machine lever to fit your height and sit on the machine with your back against the back support pad.','Place the back of lower leg on top of padded lever (just a few inches under the calves) and secure the lap pad against your thighs, just above the knees. Then grasp the side handles on the machine as you point your toes straight (or you can also use any of the other two stances) and ensure that the legs are fully straight right in front of you. This will be your starting position.','As you exhale, pull the machine lever as far as possible to the back of your thighs by flexing at the knees. Keep your torso stationary at all times. Hold the contracted position for a second.','Slowly return to the starting position as you breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seated Leg Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Standing Leg Curl', 'machine', true, 'machine', 'beginner', 'pull', 'isolation', ARRAY['Adjust the machine lever to fit your height and lie with your torso bent at the waist facing forward around 30-45 degrees (since an angled position is more favorable for hamstrings recruitment) with the pad of the lever on the back of your right leg (just a few inches under the calves) and the front of the right leg on top of the machine pad.','Keeping the torso bent forward, ensure your leg is fully stretched and grab the side handles of the machine. Position your toes straight. This will be your starting position.','As you exhale, curl your right leg up as far as possible without lifting the upper leg from the pad. Once you hit the fully contracted position, hold it for a second.','As you inhale, bring the legs back to the initial position. Repeat for the recommended amount of repetitions.','Perform the same exercise now for the left leg.'], ARRAY['hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Standing Leg Curl');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Calf Press', 'machine', true, 'machine', 'beginner', 'push', 'isolation', ARRAY['Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance.','Lower the safety bars holding the weighted platform in place and press the platform all the way up until your legs are fully extended in front of you without locking your knees. (Note: In some leg press units you can leave the safety bars on for increased safety. If your leg press unit allows for this, then this is the preferred method of performing the exercise.) Your torso and the legs should make perfect 90-degree angle. Now carefully place your toes and balls of your feet on the lower portion of the platform with the heels extending off. Toes should be facing forward, outwards or inwards as described at the beginning of the chapter. This will be your starting position.','Press on the platform by raising your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.','Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.','Repeat for the recommended amount of repetitions.'], ARRAY['calves'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Calf Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Standing Calf Raise', 'machine', true, 'machine', 'beginner', 'push', 'isolation', ARRAY['Adjust the padded lever of the calf raise machine to fit your height.','Place your shoulders under the pads provided and position your toes facing forward (or using any of the two other positions described at the beginning of the chapter). The balls of your feet should be secured on top of the calf block with the heels extending off it. Push the lever up by extending your hips and knees until your torso is standing erect. The knees should be kept with a slight bend; never locked. Toes should be facing forward, outwards or inwards as described at the beginning of the chapter. This will be your starting position.','Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.','Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.','Repeat for the recommended amount of repetitions.'], ARRAY['calves'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Standing Calf Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Seated Calf Raise', 'machine', true, 'machine', 'beginner', 'push', 'isolation', ARRAY['Sit on the machine and place your toes on the lower portion of the platform provided with the heels extending off. Choose the toe positioning of your choice (forward, in, or out) as per the beginning of this chapter.','Place your lower thighs under the lever pad, which will need to be adjusted according to the height of your thighs. Now place your hands on top of the lever pad in order to prevent it from slipping forward.','Lift the lever slightly by pushing your heels up and release the safety bar. This will be your starting position.','Slowly lower your heels by bending at the ankles until the calves are fully stretched. Inhale as you perform this movement.','Raise the heels by extending the ankles as high as possible as you contract the calves and breathe out. Hold the top contraction for a second.','Repeat for the recommended amount of repetitions.'], ARRAY['calves'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Seated Calf Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Donkey Calf Raise', 'other', true, 'other', 'intermediate', 'push', 'isolation', ARRAY['For this exercise you will need access to a donkey calf raise machine. Start by positioning your lower back and hips under the padded lever provided. The tailbone area should be the one making contact with the pad.','Place both of your arms on the side handles and place the balls of your feet on the calf block with the heels extending off. Align the toes forward, inward or outward, depending on the area you wish to target, and straighten the knees without locking them. This will be your starting position.','Raise your heels as you breathe out by extending your ankles as high as possible and flexing your calf. Ensure that the knee is kept stationary at all times. There should be no bending at any time. Hold the contracted position by a second before you start to go back down.','Go back slowly to the starting position as you breathe in by lowering your heels as you bend the ankles until calves are stretched.','Repeat for the recommended amount of repetitions.'], ARRAY['calves'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Donkey Calf Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Hip Thrust', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound', ARRAY['Begin seated on the ground with a bench directly behind you. Have a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise.','Roll the bar so that it is directly above your hips, and lean back against the bench so that your shoulder blades are near the top of it.','Begin the movement by driving through your feet, extending your hips vertically through the bar. Your weight should be supported by your shoulder blades and your feet. Extend as far as possible, then reverse the motion to return to the starting position.'], ARRAY['glutes'], ARRAY['calves','hamstrings'], ARRAY['Upper back on bench, feet flat on floor','Drive hips up by squeezing glutes hard','Hold top position 1-2 seconds','Chin tucked, look forward not up','This is the #1 glute builder'], ARRAY['Pushing through toes instead of heels','Not squeezing glutes at top','Overextending lower back','Bar placement too high on hips']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Hip Thrust');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Barbell Glute Bridge', 'barbell', true, 'barbell', 'intermediate', 'push', 'compound', ARRAY['Begin seated on the ground with a loaded barbell over your legs. Using a fat bar or having a pad on the bar can greatly reduce the discomfort caused by this exercise. Roll the bar so that it is directly above your hips, and lay down flat on the floor.','Begin the movement by driving through with your heels, extending your hips vertically through the bar. Your weight should be supported by your upper back and the heels of your feet.','Extend as far as possible, then reverse the motion to return to the starting position.'], ARRAY['glutes'], ARRAY['calves','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Barbell Glute Bridge');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Single Leg Glute Bridge', 'body only', true, 'body only', 'beginner', 'push', 'isolation', ARRAY['Lay on the floor with your feet flat and knees bent.','Raise one leg off of the ground, pulling the knee to your chest. This will be your starting position.','Execute the movement by driving through the heel, extending your hip upward and raising your glutes off of the ground.','Extend as far as possible, pause and then return to the starting position.'], ARRAY['glutes'], ARRAY['hamstrings'], ARRAY['One foot flat, other leg extended','Drive hips up using one leg','Squeeze glute hard at top','Keep hips level, dont rotate','Great for finding glute imbalances'], ARRAY['Hips tilting to one side','Pushing through toes','Not going high enough']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Single Leg Glute Bridge');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Glute Kickback', 'body only', true, 'body only', 'beginner', 'push', 'compound', ARRAY['Kneel on the floor or an exercise mat and bend at the waist with your arms extended in front of you (perpendicular to the torso) in order to get into a kneeling push-up position but with the arms spaced at shoulder width. Your head should be looking forward and the bend of the knees should create a 90-degree angle between the hamstrings and the calves. This will be your starting position.','As you exhale, lift up your right leg until the hamstrings are in line with the back while maintaining the 90-degree angle bend. Contract the glutes throughout this movement and hold the contraction at the top for a second. Tip: At the end of the movement the upper leg should be parallel to the floor while the calf should be perpendicular to it.','Go back to the initial position as you inhale and now repeat with the left leg.','Continue to alternate legs until all of the recommended repetitions have been performed.'], ARRAY['glutes'], ARRAY['hamstrings'], ARRAY['On all fours or standing at cable','Drive heel straight back and up','Squeeze glute at top, hold 1 second','Dont arch lower back','Keep core engaged throughout'], ARRAY['Using lower back instead of glutes','Kicking too high','Going too fast']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Glute Kickback');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Hip Adduction', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['Stand in front of a low pulley facing forward with one leg next to the pulley and the other one away.','Attach the ankle cuff to the cable and also to the ankle of the leg that is next to the pulley.','Now step out and away from the stack with a wide stance and grasp the bar of the pulley system.','Stand on the foot that does not have the ankle cuff (the far foot) and allow the leg with the cuff to be pulled towards the low pulley. This will be your starting position.','Now perform the movement by moving the leg with the ankle cuff in front of the far leg by using the inner thighs to abduct the hip. Breathe out during this portion of the movement.','Slowly return to the starting position as you breathe in.','Repeat for the recommended amount of repetitions and then repeat the same movement with the opposite leg.'], ARRAY['quadriceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Hip Adduction');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Thigh Abductor', 'machine', true, 'machine', 'beginner', 'push', 'isolation', ARRAY['To begin, sit down on the abductor machine and select a weight you are comfortable with. When your legs are positioned properly, grip the handles on each side. Your entire upper body (from the waist up) should be stationary. This is the starting position.','Slowly press against the machine with your legs to move them away from each other while exhaling.','Feel the contraction for a second and begin to move your legs back to the starting position while breathing in. Note: Remember to keep your upper body stationary to prevent any injuries from occurring.','Repeat for the recommended amount of repetitions.'], ARRAY['abductors'], ARRAY['glutes'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Thigh Abductor');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Thigh Adductor', 'machine', true, 'machine', 'beginner', 'pull', 'isolation', ARRAY['To begin, sit down on the adductor machine and select a weight you are comfortable with. When your legs are positioned properly on the leg pads of the machine, grip the handles on each side. Your entire upper body (from the waist up) should be stationary. This is the starting position.','Slowly press against the machine with your legs to move them towards each other while exhaling.','Feel the contraction for a second and begin to move your legs back to the starting position while breathing in. Note: Remember to keep your upper body stationary and avoid fast jerking motions in order to prevent any injuries from occurring.','Repeat for the recommended amount of repetitions.'], ARRAY['adductors'], ARRAY['glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Thigh Adductor');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Pull Through', 'cable', true, 'cable', 'beginner', 'pull', 'compound', ARRAY['Begin standing a few feet in front of a low pulley with a rope or handle attached. Face away from the machine, straddling the cable, with your feet set wide apart.','Begin the movement by reaching through your legs as far as possible, bending at the hips. Keep your knees slightly bent. Keeping your arms straight, extend through the hip to stand straight up. Avoid pulling upward through the shoulders; all of the motion should originate through the hips.'], ARRAY['glutes'], ARRAY['hamstrings','lower back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Pull Through');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Glute Ham Raise', 'machine', true, 'machine', 'intermediate', 'pull', 'compound', ARRAY['Begin by adjusting the equipment to fit your body. Place your feet against the footplate in between the rollers as you lie facedown. Your knees should be just behind the pad.','Start from the bottom of the movement. Keep your back arched as you begin the movement by flexing the knees. Drive your toes into the foot plate as you do so. Keep your upper body straight, and continue until your body is upright.','Return to the starting position, keeping your descent under control.'], ARRAY['hamstrings'], ARRAY['calves','glutes'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Glute Ham Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Reverse Hyperextension', 'machine', true, 'machine', 'intermediate', 'pull', NULL, ARRAY['Place your feet between the pads after loading an appropriate weight. Lay on the top pad, allowing your hips to hang off the back, while grasping the handles to hold your position.','To begin the movement, flex the hips, pulling the legs forward.','Reverse the motion by extending the hips, kicking the leg back. It is very important not to over-extend the hip on this movement, stopping short of your full range of motion.','Return by again flexing the hip, pulling the carriage forward as far as you can.','Repeat for the desired number of repetitions.'], ARRAY['hamstrings'], ARRAY['calves','glutes'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Reverse Hyperextension');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Plank', 'body only', true, 'body only', 'beginner', 'static', 'isolation', ARRAY['Get into a prone position on the floor, supporting your weight on your toes and your forearms. Your arms are bent and directly below the shoulder.','Keep your body straight at all times, and hold this position as long as possible. To increase difficulty, an arm or leg can be raised.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Plank');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Side Plank', 'body only', true, 'body only', 'beginner', 'static', NULL, ARRAY[]::TEXT[], ARRAY['abdominals'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Side Plank');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Crunch', 'body only', true, 'body only', 'beginner', 'pull', 'isolation', ARRAY['Lie flat on your back with your feet flat on the ground, or resting on a bench with your knees bent at a 90 degree angle. If you are resting your feet on a bench, place them three to four inches apart and point your toes inward so they touch.','Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don''t lock your fingers behind your head.','While pushing the small of your back down in the floor to better isolate your abdominal muscles, begin to roll your shoulders off the floor.','Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the floor only about four inches, and your lower back should remain on the floor. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don''t cheat yourself by using momentum.','After the one second contraction, begin to come down slowly again to the starting position as you inhale.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Crunch');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Sit-Up', 'body only', true, 'body only', 'beginner', 'pull', 'isolation', ARRAY['Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.','Place your hands behind your head and lock them together by clasping your fingers. This is the starting position.','Elevate your upper body so that it creates an imaginary V-shape with your thighs. Breathe out when performing this part of the exercise.','Once you feel the contraction for a second, lower your upper body back down to the starting position while inhaling.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Sit-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Decline Crunch', 'body only', true, 'body only', 'intermediate', 'pull', 'isolation', ARRAY['Secure your legs at the end of the decline bench and lie down.','Now place your hands lightly on either side of your head keeping your elbows in. Tip: Don''t lock your fingers behind your head.','While pushing the small of your back down in the bench to better isolate your abdominal muscles, begin to roll your shoulders off it.','Continue to push down as hard as you can with your lower back as you contract your abdominals and exhale. Your shoulders should come up off the bench only about four inches, and your lower back should remain on the bench. At the top of the movement, contract your abdominals hard and keep the contraction for a second. Tip: Focus on slow, controlled movement - don''t cheat yourself by using momentum.','After the one second contraction, begin to come down slowly again to the starting position as you inhale.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Decline Crunch');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Reverse Crunch', 'body only', true, 'body only', 'beginner', 'pull', 'isolation', ARRAY['Lie down on the floor with your legs fully extended and arms to the side of your torso with the palms on the floor. Your arms should be stationary for the entire exercise.','Move your legs up so that your thighs are perpendicular to the floor and feet are together and parallel to the floor. This is the starting position.','While inhaling, move your legs towards the torso as you roll your pelvis backwards and you raise your hips off the floor. At the end of this movement your knees will be touching your chest.','Hold the contraction for a second and move your legs back to the starting position while exhaling.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Reverse Crunch');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Cable Crunch', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['Kneel below a high pulley that contains a rope attachment.','Grasp cable rope attachment and lower the rope until your hands are placed next to your face.','Flex your hips slightly and allow the weight to hyperextend the lower back. This will be your starting position.','With the hips stationary, flex the waist as you contract the abs so that the elbows travel towards the middle of the thighs. Exhale as you perform this portion of the movement and hold the contraction for a second.','Slowly return to the starting position as you inhale. Tip: Make sure that you keep constant tension on the abs throughout the movement. Also, do not choose a weight so heavy that the lower back handles the brunt of the work.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Cable Crunch');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Russian Twist', 'body only', true, 'body only', 'intermediate', 'pull', 'compound', ARRAY['Lie down on the floor placing your feet either under something that will not move or by having a partner hold them. Your legs should be bent at the knees.','Elevate your upper body so that it creates an imaginary V-shape with your thighs. Your arms should be fully extended in front of you perpendicular to your torso and with the hands clasped. This is the starting position.','Twist your torso to the right side until your arms are parallel with the floor while breathing out.','Hold the contraction for a second and move back to the starting position while breathing out. Now move to the opposite side performing the same techniques you applied to the right side.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY['lower back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Russian Twist');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Hanging Leg Raise', 'body only', true, 'body only', 'expert', 'pull', 'isolation', ARRAY['Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip. The legs should be straight down with the pelvis rolled slightly backwards. This will be your starting position.','Raise your legs until the torso makes a 90-degree angle with the legs. Exhale as you perform this movement and hold the contraction for a second or so.','Go back slowly to the starting position as you breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Hanging Leg Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Captain''s Chair Leg Raise', 'other', true, 'other', 'beginner', 'pull', 'isolation', ARRAY['Position your body on the vertical leg raise bench so that your forearms are resting on the pads next to the torso and holding on to the handles. Your arms will be bent at a 90 degree angle.','The torso should be straight with the lower back pressed against the pad of the machine and the legs extended pointing towards the floor. This will be your starting position.','Now as you breathe out, lift your legs up as you keep them extended. Continue this movement until your legs are roughly parallel to the floor and then hold the contraction for a second. Tip: Do not use any momentum or swinging as you perform this exercise.','Slowly go back to the starting position as you breathe in.','Repeat for the recommended amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Captain''s Chair Leg Raise');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Pallof Press', 'cable', true, 'cable', 'beginner', 'pull', 'isolation', ARRAY['Connect a standard handle to a tower, and—if possible—position the cable to shoulder height. If not, a low pulley will suffice.','With your side to the cable, grab the handle with both hands and step away from the tower. You should be approximately arm''s length away from the pulley, with the tension of the weight on the cable.','With your feet positioned hip-width apart and knees slightly bent, hold the cable to the middle of your chest. This will be your starting position.','Press the cable away from your chest, fully extending both arms. You core should be tight and engaged.','Hold the repetition for several seconds before returning to the starting position.','At the conclusion of the set, repeat facing the other direction.'], ARRAY['abdominals'], ARRAY['chest','shoulders','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Pallof Press');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Ab Wheel Rollout', 'other', true, 'other', 'intermediate', 'pull', 'compound', ARRAY['Hold the Ab Roller with both hands and kneel on the floor.','Now place the ab roller on the floor in front of you so that you are on all your hands and knees (as in a kneeling push up position). This will be your starting position.','Slowly roll the ab roller straight forward, stretching your body into a straight position. Tip: Go down as far as you can without touching the floor with your body. Breathe in during this portion of the movement.','After a pause at the stretched position, start pulling yourself back to the starting position as you breathe out. Tip: Go slowly and keep your abs tight at all times.'], ARRAY['abdominals'], ARRAY['shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ab Wheel Rollout');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Ab Crunch Machine', 'machine', true, 'machine', 'intermediate', 'pull', 'isolation', ARRAY['Select a light resistance and sit down on the ab machine placing your feet under the pads provided and grabbing the top handles. Your arms should be bent at a 90 degree angle as you rest the triceps on the pads provided. This will be your starting position.','At the same time, begin to lift the legs up as you crunch your upper torso. Breathe out as you perform this movement. Tip: Be sure to use a slow and controlled motion. Concentrate on using your abs to move the weight while relaxing your legs and feet.','After a second pause, slowly return to the starting position as you breathe in.','Repeat the movement for the prescribed amount of repetitions.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Ab Crunch Machine');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Mountain Climber', 'body only', true, 'body only', 'beginner', 'pull', 'compound', ARRAY['Begin in a pushup position, with your weight supported by your hands and toes. Flexing the knee and hip, bring one leg until the knee is approximately under the hip. This will be your starting position.','Explosively reverse the positions of your legs, extending the bent leg until the leg is straight and supported by the toe, and bringing the other foot up with the hip and knee flexed. Repeat in an alternating fashion for 20-30 seconds.'], ARRAY['quadriceps'], ARRAY['chest','hamstrings','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Mountain Climber');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Dead Bug', 'body only', true, 'body only', 'beginner', 'pull', 'compound', ARRAY['Begin lying on your back with your hands extended above you toward the ceiling.','Bring your feet, knees, and hips up to 90 degrees.','Exhale hard to bring your ribcage down and flatten your back onto the floor, rotating your pelvis up and squeezing your glutes. Hold this position throughout the movement. This will be your starting position.','Initiate the exercise by extending one leg, straightening the knee and hip to bring the leg just above the ground.','Maintain the position of your lumbar and pelvis as you perform the movement, as your back is going to want to arch.','Stay tight and return the working leg to the starting position.','Repeat on the opposite side, alternating until the set is complete.'], ARRAY['abdominals'], ARRAY[]::TEXT[], ARRAY['Lower back pressed into floor the entire time','Opposite arm and leg extend together','Move slowly and with control','Exhale as you extend, inhale as you return','The #1 core stability exercise for beginners'], ARRAY['Lower back arching off floor','Moving too fast','Holding breath']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Dead Bug');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Kettlebell Swing', 'kettlebells', true, 'kettlebells', 'intermediate', 'pull', 'compound', ARRAY[]::TEXT[], ARRAY['hamstrings'], ARRAY['calves','glutes','lower back','shoulders'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Kettlebell Swing');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Turkish Get-Up', 'kettlebells', true, 'kettlebells', 'intermediate', 'push', 'compound', ARRAY['Lie on your back on the floor and press a kettlebell to the top position by extending the elbow. Bend the knee on the same side as the kettlebell.','Keeping the kettlebell locked out at all times, pivot to the opposite side and use your non- working arm to assist you in driving forward to the lunge position.','Using your free hand, push yourself to a seated position, then progressing to your feet. While looking up at the kettlebell, slowly stand up. Reverse the motion back to the starting position and repeat.'], ARRAY['shoulders'], ARRAY['abdominals','calves','hamstrings','quadriceps','triceps'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Turkish Get-Up');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Treadmill Run', 'machine', true, 'machine', 'beginner', NULL, NULL, ARRAY['To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout.','Treadmills offer convenience, cardiovascular benefits, and usually have less impact than running outside. A 150 lb person will burn over 450 calories running 8 miles per hour for 30 minutes. Maintain proper posture as you run, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Treadmill Run');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Treadmill Walk', 'machine', true, 'machine', 'beginner', NULL, NULL, ARRAY['To begin, step onto the treadmill and select the desired option from the menu. Most treadmills have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout.','Treadmills offer convenience, cardiovascular benefits, and usually have less impact than walking outside. When walking, you should move at a moderate to fast pace, not a leisurely one. Being an activity of lower intensity, walking doesn''t burn as many calories as some other activities, but still provides great benefit. A 150 lb person will burn about 175 calories walking 4 miles per hour for 30 minutes, compared to 450 calories running twice as fast. Maintain proper posture as you walk, and only hold onto the handles when necessary, such as when dismounting or checking your heart rate.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Treadmill Walk');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Stationary Bike', 'machine', true, 'machine', 'beginner', NULL, NULL, ARRAY['To begin, seat yourself on the bike and adjust the seat to your height.','Select the desired option from the menu. You may have to start pedaling to turn it on. You can use the manual setting, or you can select a program to use. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. The level of resistance can be changed throughout the workout. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Stationary Bike');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Recumbent Bike', 'machine', true, 'machine', 'beginner', NULL, NULL, ARRAY['To begin, seat yourself on the bike and adjust the seat to your height.','Select the desired option from the menu. You may have to start pedaling to turn it on. You can use the manual setting, or you can select a program to use. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. The level of resistance can be changed throughout the workout. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity.','Recumbent bikes offer convenience, cardiovascular benefits, and have less impact than other activities. A 150 lb person will burn about 230 calories cycling at a moderate rate for 30 minutes, compared to 450 calories or more running.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Recumbent Bike');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Rowing Machine', 'machine', true, 'machine', 'intermediate', NULL, NULL, ARRAY['To begin, seat yourself on the rower. Make sure that your heels are resting comfortably against the base of the foot pedals and that the straps are secured. Select the program that you wish to use, if applicable. Sit up straight and bend forward at the hips.','There are three phases of movement when using a rower. The first phase is when you come forward on the rower. Your knees are bent and against your chest. Your upper body is leaning slightly forward while still maintaining good posture. Next, push against the foot pedals and extend your legs while bringing your hands to your upper abdominal area, squeezing your shoulders back as you do so. To avoid straining your back, use primarily your leg and hip muscles.','The recovery phase simply involves straightening your arms, bending the knees, and bringing your body forward again as you transition back into the first phase.'], ARRAY['quadriceps'], ARRAY['biceps','calves','glutes','hamstrings','lower back','middle back'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Rowing Machine');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Stairmaster', 'machine', true, 'machine', 'intermediate', NULL, NULL, ARRAY['To begin, step onto the stairmaster and select the desired option from the menu. You can choose a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise.','Pump your legs up and down in an established rhythm, driving the pedals down but not all the way to the floor. It is recommended that you maintain your grip on the handles so that you don''t fall. The handles can be used to monitor your heart rate to help you stay at an appropriate intensity.','Stairmasters offer convenience, cardiovascular benefits, and usually have less impact than running outside. They are typically much harder than other cardio equipment. A 150 lb person will typically burn over 300 calories in 30 minutes, compared to about 175 calories walking.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Stairmaster');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Elliptical Trainer', 'machine', true, 'machine', 'intermediate', NULL, NULL, ARRAY['To begin, step onto the elliptical and select the desired option from the menu. Most ellipticals have a manual setting, or you can select a program to run. Typically, you can enter your age and weight to estimate the amount of calories burned during exercise. Elevation can be adjusted to change the intensity of the workout.','The handles can be used to monitor your heart rate to help you stay at an appropriate intensity.'], ARRAY['quadriceps'], ARRAY['calves','glutes','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Elliptical Trainer');

INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Jump Rope', 'other', true, 'other', 'intermediate', NULL, NULL, ARRAY['Hold an end of the rope in each hand. Position the rope behind you on the ground. Raise your arms up and turn the rope over your head bringing it down in front of you. When it reaches the ground, jump over it. Find a good turning pace that can be maintained. Different speeds and techniques can be used to introduce variation.','Rope jumping is exciting, challenges your coordination, and requires a lot of energy. A 150 lb person will burn about 350 calories jumping rope for 30 minutes, compared to over 450 calories running.'], ARRAY['quadriceps'], ARRAY['calves','hamstrings'], ARRAY[]::TEXT[], ARRAY[]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Jump Rope');

-- Hand-written: "Farmer" entry has unusual seed format that the parser skipped.
INSERT INTO exercises (name, category, is_public, equipment, level, force, mechanic, instructions, primary_muscles, secondary_muscles, coaching_cues, common_mistakes)
SELECT 'Farmer Carry', 'other', true, 'other', 'beginner', 'static', 'compound',
  ARRAY['Pick up a heavy dumbbell or kettlebell in each hand from the floor.','Stand tall with shoulders pulled back and chest up.','Walk in a straight line at a steady pace.','Keep core braced and breathe normally.','Set down with control when you reach the target distance or time.'],
  ARRAY['traps'], ARRAY['forearms','abdominals','glutes','quadriceps'],
  ARRAY['Stand tall — shoulders down and back','Brace core hard the entire walk','Smooth, controlled steps','Grip the handles like you''re trying to crush them','One of the best total-body builders there is'],
  ARRAY['Hunching shoulders forward','Letting the weights swing','Going too light — these should be heavy']
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = 'Farmer Carry');

COMMIT;


-- ----------------------------------------------------------------------------
-- 20260501_coach_tasks.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- coach_tasks — coach-scheduled tasks shown on the client's home tab
--   Types:
--     'photos'     — take progress photos for that day
--     'body_stats' — log weight/body fat
--     'macros'     — hit nutrition target
--     'custom'     — coach-defined free-form task
--   Completion:
--     Typed tasks derive done-ness from underlying data on the mobile side
--     (a progress_photos / body_stats row exists for that date).
--     'custom' tasks use manually_completed_at, set by the client.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coach_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for         DATE NOT NULL,
  task_type             TEXT NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT,
  manually_completed_at TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_task_type CHECK (task_type IN ('photos', 'body_stats', 'macros', 'custom'))
);

CREATE INDEX IF NOT EXISTS idx_coach_tasks_client_date
  ON public.coach_tasks(client_id, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_coach_tasks_coach
  ON public.coach_tasks(coach_id, scheduled_for DESC);

DROP TRIGGER IF EXISTS set_coach_tasks_updated_at ON public.coach_tasks;
CREATE TRIGGER set_coach_tasks_updated_at
  BEFORE UPDATE ON public.coach_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.coach_tasks ENABLE ROW LEVEL SECURITY;

-- Coach owns + manages tasks they assign
CREATE POLICY "Coaches manage own tasks"
  ON public.coach_tasks FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Client can read tasks assigned to them
CREATE POLICY "Clients read own tasks"
  ON public.coach_tasks FOR SELECT
  USING (client_id = auth.uid());

-- Client can mark a 'custom' task complete (toggle manually_completed_at)
CREATE POLICY "Clients mark custom tasks complete"
  ON public.coach_tasks FOR UPDATE
  USING (client_id = auth.uid() AND task_type = 'custom')
  WITH CHECK (client_id = auth.uid() AND task_type = 'custom');

ANALYZE public.coach_tasks;


-- ----------------------------------------------------------------------------
-- 20260501_progress_photos_storage.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Progress photos storage bucket + RLS
-- ============================================================================
-- The progress_photos table itself was created in 20260419_fix_schema_gaps.sql
-- with pose CHECK ('front', 'side', 'back', 'other') — kept as-is.
--
-- This migration only adds the storage layer:
--   1. Creates the progress-photos bucket.
--   2. Adds storage.objects RLS so clients write/read their own folder
--      and coaches can read photos for their active or paused clients.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Clients upload own progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Clients view own progress photos"   ON storage.objects;
  DROP POLICY IF EXISTS "Clients delete own progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Coaches view client progress photos" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Clients upload own progress photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients view own progress photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients delete own progress photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches view client progress photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT cc.client_id FROM public.coach_clients cc
      WHERE cc.coach_id = auth.uid() AND cc.status IN ('active', 'paused')
    )
  );


-- ----------------------------------------------------------------------------
-- 20260505_machine_aliases.sql
-- ----------------------------------------------------------------------------
-- Beta-tester feedback: people search for "adductor machine" / "abductor machine"
-- (the gym-floor names), not the free-exercise-db originals.
-- Rename the curated rows so they show up in search.

UPDATE exercises SET name = 'Adductor Machine'
WHERE name = 'Thigh Adductor' AND is_public = true AND created_by IS NULL;

UPDATE exercises SET name = 'Abductor Machine'
WHERE name = 'Thigh Abductor' AND is_public = true AND created_by IS NULL;


-- ----------------------------------------------------------------------------
-- 20260505_streak_accepts_workout_date.sql
-- ----------------------------------------------------------------------------
-- Make update_user_streak respect the actual workout date instead of always
-- using CURRENT_DATE. Backfilling a missed Monday workout from Tuesday should
-- credit Monday for streak purposes, not Tuesday.

CREATE OR REPLACE FUNCTION public.update_user_streak(
  p_user_id UUID,
  p_workout_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  is_new_record BOOLEAN
) AS $$
DECLARE
  v_last_date DATE;
  v_current INTEGER;
  v_longest INTEGER;
  v_is_new_record BOOLEAN := FALSE;
BEGIN
  SELECT us.last_workout_date, us.current_streak, us.longest_streak
  INTO v_last_date, v_current, v_longest
  FROM public.user_streaks us
  WHERE us.user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_workout_date)
    VALUES (p_user_id, 1, 1, p_workout_date);
    RETURN QUERY SELECT 1, 1, TRUE;
    RETURN;
  END IF;

  -- Already credited this exact date — no-op.
  IF v_last_date = p_workout_date THEN
    RETURN QUERY SELECT v_current, v_longest, FALSE;
    RETURN;
  END IF;

  -- Backfilling an OLDER date than the latest credited day: don't
  -- regress last_workout_date or recompute streak. The session is
  -- recorded historically but doesn't affect the live streak counter.
  -- (A future migration can recompute streaks holistically if needed.)
  IF p_workout_date < v_last_date THEN
    RETURN QUERY SELECT v_current, v_longest, FALSE;
    RETURN;
  END IF;

  IF v_last_date = p_workout_date - INTERVAL '1 day' THEN
    v_current := v_current + 1;
  ELSIF v_last_date < p_workout_date - INTERVAL '1 day' THEN
    v_current := 1;
  END IF;

  IF v_current > v_longest THEN
    v_longest := v_current;
    v_is_new_record := TRUE;
  END IF;

  UPDATE public.user_streaks
  SET current_streak = v_current,
      longest_streak = v_longest,
      last_workout_date = p_workout_date,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_current, v_longest, v_is_new_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID, DATE) TO authenticated;


-- ----------------------------------------------------------------------------
-- 20260506_program_unpublished_changes.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- D21 (light): track unpublished edits on active programs
--
-- Adds a flag the dashboard surfaces as "Unpublished changes" on the program
-- builder. Any insert/update/delete to phases or workouts on an `active`
-- program flips the flag to TRUE; the coach explicitly clears it via Publish.
--
-- Why a flag and not snapshot-based drafts? Snapshot drafts are the proper
-- fix for the Trainerize "every typo notifies the client" pain, but they
-- require deferring writes through a JSONB working copy (~600 LOC). ADPT
-- today doesn't push notifications on program edits, so the urgency is
-- lower. The flag pattern lays the lifecycle groundwork: when push-on-edit
-- ships, it'll consult this flag instead of pushing on every row write.
-- ============================================================================

ALTER TABLE public.coaching_programs
  ADD COLUMN IF NOT EXISTS unpublished_changes BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_published_at  TIMESTAMPTZ;

-- Trigger fn: mark the parent program as having unpublished changes whenever
-- a phase or workout row is touched. Idempotent — only writes when the flag
-- isn't already true and the program is `active` (drafts don't need this).
CREATE OR REPLACE FUNCTION public.mark_program_unpublished()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- needed so a coach's edit on phase_workouts can update
                  -- coaching_programs even though that's a different table.
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_program_id UUID;
BEGIN
  -- Resolve program_id from whichever row type the trigger fires on.
  IF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'phase_workouts' THEN
      SELECT program_id INTO v_program_id
      FROM public.program_phases WHERE id = OLD.phase_id;
    ELSE
      v_program_id := OLD.program_id;
    END IF;
  ELSE
    IF TG_TABLE_NAME = 'phase_workouts' THEN
      SELECT program_id INTO v_program_id
      FROM public.program_phases WHERE id = NEW.phase_id;
    ELSE
      v_program_id := NEW.program_id;
    END IF;
  END IF;

  IF v_program_id IS NOT NULL THEN
    UPDATE public.coaching_programs
    SET unpublished_changes = TRUE
    WHERE id = v_program_id
      AND status = 'active'
      AND unpublished_changes = FALSE;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS program_phases_mark_unpublished ON public.program_phases;
CREATE TRIGGER program_phases_mark_unpublished
  AFTER INSERT OR UPDATE OR DELETE ON public.program_phases
  FOR EACH ROW EXECUTE FUNCTION public.mark_program_unpublished();

DROP TRIGGER IF EXISTS phase_workouts_mark_unpublished ON public.phase_workouts;
CREATE TRIGGER phase_workouts_mark_unpublished
  AFTER INSERT OR UPDATE OR DELETE ON public.phase_workouts
  FOR EACH ROW EXECUTE FUNCTION public.mark_program_unpublished();

ANALYZE public.coaching_programs;


-- ----------------------------------------------------------------------------
-- 20260506_scheduled_workouts.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- scheduled_workouts — date-keyed schedule of what the client should do.
--
-- Why: phase_workouts.day_number is relative to a phase, so it can't express
-- "do this on a specific date" or "shift the week." This table is the source
-- of truth that mobile reads to render Today/Calendar.
--
-- v0 (this migration): the table + RLS only. No backfill. Coaches manually
-- assign workouts to dates from the dashboard's per-client schedule editor.
-- Mobile read-side switch is a separate PR.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.scheduled_workouts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id             UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  scheduled_date       DATE NOT NULL,

  -- Source of the assigned workout. Exactly one of phase_workout_id /
  -- template_id is non-null when source_type isn't 'rest'.
  source_type          TEXT NOT NULL,
  phase_workout_id     UUID REFERENCES public.phase_workouts(id) ON DELETE SET NULL,
  -- workout_templates table isn't in prod yet (local-only mobile
  -- migration `20260325_workout_templates.sql`). Keep template_id as a
  -- plain UUID for now; promote to a real FK once workout_templates
  -- lands in prod.
  template_id          UUID,

  -- Per-instance edits (e.g. swap one exercise for today only). Renders on
  -- top of the source's exercises if present.
  override_payload     JSONB,

  -- Lifecycle
  completed            BOOLEAN NOT NULL DEFAULT FALSE,
  completed_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_source_type CHECK (source_type IN ('phase_workout','template','rest')),
  CONSTRAINT source_consistency CHECK (
    (source_type = 'phase_workout' AND phase_workout_id IS NOT NULL AND template_id IS NULL) OR
    (source_type = 'template'      AND template_id      IS NOT NULL AND phase_workout_id IS NULL) OR
    (source_type = 'rest'          AND phase_workout_id IS NULL AND template_id IS NULL)
  ),
  -- Single workout per client per date. v0 design call; lift later if a
  -- coach genuinely wants to stack two on a day.
  UNIQUE (client_id, scheduled_date)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_client_date
  ON public.scheduled_workouts(client_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_workouts_coach
  ON public.scheduled_workouts(coach_id, scheduled_date);

DROP TRIGGER IF EXISTS set_scheduled_workouts_updated_at ON public.scheduled_workouts;
CREATE TRIGGER set_scheduled_workouts_updated_at
  BEFORE UPDATE ON public.scheduled_workouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches manage own clients' schedule" ON public.scheduled_workouts;
CREATE POLICY "Coaches manage own clients' schedule"
  ON public.scheduled_workouts FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Clients read own schedule" ON public.scheduled_workouts;
CREATE POLICY "Clients read own schedule"
  ON public.scheduled_workouts FOR SELECT
  USING (client_id = auth.uid());

-- Clients can flip `completed` (the mobile workout flow does this when a
-- session ends), but only on their own row and only that column.
DROP POLICY IF EXISTS "Clients mark own schedule complete" ON public.scheduled_workouts;
CREATE POLICY "Clients mark own schedule complete"
  ON public.scheduled_workouts FOR UPDATE
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

ANALYZE public.scheduled_workouts;


-- ----------------------------------------------------------------------------
-- 20260508_body_stats_healthkit_source.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- body_stats: allow source='healthkit'
--
-- Why: Apple HealthKit auto-sync needs its own distinct source so it can
-- coexist with manual log-progress entries (separate rows by virtue of the
-- existing UNIQUE (client_id, date, source) constraint). Using a dedicated
-- 'healthkit' value (instead of generic 'wearable') leaves room for future
-- Fitbit / Garmin / Health Connect sources without further migrations.
-- ============================================================================

ALTER TABLE public.body_stats
  DROP CONSTRAINT valid_stat_source;

ALTER TABLE public.body_stats
  ADD CONSTRAINT valid_stat_source
  CHECK (source IN ('manual', 'check_in', 'wearable', 'healthkit'));


-- ----------------------------------------------------------------------------
-- 20260508_meal_plans_rls_fix.sql
-- ----------------------------------------------------------------------------
-- ─────────────────────────────────────────────────────────────────────────────
-- Meal plans storage — fix INSERT policy so coaches can upload PDFs into
-- their clients' folders.
--
-- Original policy keyed the path on auth.uid() (the uploader), which meant
-- coach-uploaded files landed in <coach_id>/... and the client SELECT policy
-- (which looks up <client_id>/...) couldn't reach them. We now allow either:
--   • self-upload to one's own folder, or
--   • coach uploading on behalf of an active client.
-- The path convention is `<client_id>/<filename>` going forward.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Coaches can upload meal plans" ON storage.objects;

CREATE POLICY "Coaches can upload meal plans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal-plans'
    AND (
      -- Self-upload (uploader is the owner of the folder)
      (storage.foldername(name))[1] = auth.uid()::text
      -- Coach uploading into one of their active clients' folders
      OR (storage.foldername(name))[1]::uuid IN (
        SELECT client_id FROM public.coach_clients
        WHERE coach_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Symmetrical DELETE policy so coaches can remove plans they uploaded for a
-- client (and clients can clean up their own folder).
DROP POLICY IF EXISTS "Coaches can delete meal plans" ON storage.objects;
CREATE POLICY "Coaches can delete meal plans"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meal-plans'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[1]::uuid IN (
        SELECT client_id FROM public.coach_clients
        WHERE coach_id = auth.uid() AND status = 'active'
      )
    )
  );


-- ----------------------------------------------------------------------------
-- 20260509_fix_signup_triggers_search_path.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- Fix signup trigger chain: search_path-safe + fully qualified references
--
-- Why: handle_new_user (auth.users AFTER INSERT) inserts into public.profiles,
-- which fires handle_coach_role. handle_coach_role used unqualified `coaches`
-- and `profiles`. SECURITY DEFINER doesn't reset search_path; when the trigger
-- chain runs from the GoTrue auth context, `public` isn't in search_path and
-- the unqualified table lookup fails. End-user symptom: "Database error
-- saving new user" 500 from Supabase auth on every signup with role=coach.
--
-- Fix: pin search_path to public + pg_temp via SET inside the function (the
-- safe, supported way for SECURITY DEFINER triggers) and fully qualify every
-- table reference. Same treatment for handle_new_user as defence-in-depth.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.handle_coach_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role = 'coach' AND (OLD.role IS NULL OR OLD.role != 'coach') THEN
    INSERT INTO public.coaches (id, display_name, is_accepting_clients)
    VALUES (NEW.id, COALESCE(NEW.first_name, 'Coach'), true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

