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
