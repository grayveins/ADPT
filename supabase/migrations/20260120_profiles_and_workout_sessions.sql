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
