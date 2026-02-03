-- Coach Features Migration
-- Adds support for post-workout feelings, coach events, push notifications,
-- and improved streak logic that respects rest days

--------------------------------------------------------------------------------
-- ADD POST-WORKOUT FEELING TO WORKOUT SESSIONS
--------------------------------------------------------------------------------
ALTER TABLE public.workout_sessions 
ADD COLUMN IF NOT EXISTS post_workout_feeling TEXT 
CHECK (post_workout_feeling IN ('easy', 'good', 'hard', 'pain'));

ALTER TABLE public.workout_sessions 
ADD COLUMN IF NOT EXISTS pain_location TEXT 
CHECK (pain_location IN ('shoulder', 'back', 'knee', 'elbow', 'other'));

--------------------------------------------------------------------------------
-- ADD PUSH TOKEN TO PROFILES
--------------------------------------------------------------------------------
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

--------------------------------------------------------------------------------
-- COACH EVENTS TABLE
-- Stores notable events for coach context (PRs, pain reports, fatigue, etc.)
-- Limited to 10 most recent events per user via trigger
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('pr', 'pain', 'missed', 'fatigue', 'hard_session', 'program_change')),
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_coach_events_user 
  ON public.coach_events(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.coach_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own coach events" 
  ON public.coach_events FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own coach events" 
  ON public.coach_events FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own coach events" 
  ON public.coach_events FOR DELETE 
  USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- TRIGGER: Limit coach_events to 10 per user (auto-cleanup old events)
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_coach_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest events if user has more than 10
  DELETE FROM public.coach_events
  WHERE id IN (
    SELECT id FROM public.coach_events
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS cleanup_coach_events_trigger ON public.coach_events;
CREATE TRIGGER cleanup_coach_events_trigger
  AFTER INSERT ON public.coach_events
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_coach_events();

--------------------------------------------------------------------------------
-- IMPROVED STREAK FUNCTION: Respects preferred workout days (rest days don't break)
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
  v_preferred_days JSONB;
  v_check_date DATE;
  v_day_name TEXT;
  v_missed_workout_day BOOLEAN := FALSE;
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

  -- Get user's preferred workout days from profile
  SELECT (onboarding_data->'preferredDays')::jsonb
  INTO v_preferred_days
  FROM public.profiles
  WHERE id = p_user_id;

  -- If no preferred days set, fall back to simple consecutive day logic
  IF v_preferred_days IS NULL OR jsonb_array_length(v_preferred_days) = 0 THEN
    -- Simple logic: consecutive days
    IF v_last_date = v_today - INTERVAL '1 day' THEN
      v_current := v_current + 1;
    ELSIF v_last_date < v_today - INTERVAL '1 day' THEN
      v_current := 1;
    END IF;
  ELSE
    -- Check each day between last workout and today (exclusive of both)
    v_check_date := v_last_date + INTERVAL '1 day';
    
    WHILE v_check_date < v_today AND NOT v_missed_workout_day LOOP
      -- Get day name (lowercase) for this date
      v_day_name := lower(to_char(v_check_date, 'day'));
      v_day_name := trim(v_day_name); -- Remove trailing spaces
      
      -- Check if this day was a scheduled workout day
      IF v_preferred_days ? v_day_name THEN
        -- This was a scheduled workout day that was missed
        v_missed_workout_day := TRUE;
      END IF;
      
      v_check_date := v_check_date + INTERVAL '1 day';
    END LOOP;
    
    -- Update streak based on whether workout days were missed
    IF v_missed_workout_day THEN
      -- Missed a scheduled workout day - reset streak
      v_current := 1;
    ELSE
      -- Only rest days were missed - increment streak
      v_current := v_current + 1;
    END IF;
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

--------------------------------------------------------------------------------
-- HELPER FUNCTION: Check if a date is a rest day for a user
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_rest_day(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
DECLARE
  v_preferred_days JSONB;
  v_day_name TEXT;
BEGIN
  -- Get user's preferred workout days
  SELECT (onboarding_data->'preferredDays')::jsonb
  INTO v_preferred_days
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- If no preferred days, assume every day could be a workout day
  IF v_preferred_days IS NULL OR jsonb_array_length(v_preferred_days) = 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Get day name for the date
  v_day_name := lower(trim(to_char(p_date, 'day')));
  
  -- It's a rest day if the day is NOT in preferred days
  RETURN NOT (v_preferred_days ? v_day_name);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_rest_day(UUID, DATE) TO authenticated;

--------------------------------------------------------------------------------
-- HELPER FUNCTION: Get coach context data for a user
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_coach_context(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_last_workout RECORD;
  v_streak RECORD;
  v_recent_prs JSONB;
  v_recent_events JSONB;
  v_profile RECORD;
BEGIN
  -- Get profile data
  SELECT first_name, goal, onboarding_data
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Get last workout
  SELECT 
    ws.id,
    ws.title,
    ws.started_at,
    ws.post_workout_feeling,
    ws.pain_location
  INTO v_last_workout
  FROM public.workout_sessions ws
  WHERE ws.user_id = p_user_id
  ORDER BY ws.started_at DESC
  LIMIT 1;
  
  -- Get streak data
  SELECT current_streak, longest_streak, last_workout_date
  INTO v_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;
  
  -- Get recent PRs (last 7 days)
  SELECT COALESCE(jsonb_agg(pr_data), '[]'::jsonb)
  INTO v_recent_prs
  FROM (
    SELECT jsonb_build_object(
      'exercise', upr.exercise_name,
      'weight', upr.max_weight_lbs,
      'reps', upr.reps_at_max_weight,
      'date', upr.last_pr_date
    ) as pr_data
    FROM public.user_personal_records upr
    WHERE upr.user_id = p_user_id
    AND upr.last_pr_date > NOW() - INTERVAL '7 days'
    ORDER BY upr.last_pr_date DESC
    LIMIT 5
  ) prs;
  
  -- Get recent coach events
  SELECT COALESCE(jsonb_agg(event_data), '[]'::jsonb)
  INTO v_recent_events
  FROM (
    SELECT jsonb_build_object(
      'type', ce.event_type,
      'data', ce.event_data,
      'date', ce.created_at
    ) as event_data
    FROM public.coach_events ce
    WHERE ce.user_id = p_user_id
    ORDER BY ce.created_at DESC
    LIMIT 5
  ) events;
  
  -- Build result
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_coach_context(UUID) TO authenticated;
