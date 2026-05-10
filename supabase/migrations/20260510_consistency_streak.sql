-- ============================================================================
-- 20260510_consistency_streak.sql
--
-- Replace workout-only streak with a consistency streak: a day counts only if
-- the client completed every required habit AND every scheduled workout.
-- Rest days waive the workout requirement; habits still apply. Days with no
-- scheduled_workout row are treated as "habits-only" days.
--
-- Source of truth is fn_compute_streak(user_id), which walks backward from
-- today (in the user's local timezone) and stops at the first unmet day.
-- Today is "pending" until its requirements complete — pending neither
-- extends nor breaks the visible streak. The cached current_streak in
-- user_streaks is refreshed by triggers on the underlying tables.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Schema additions
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- Soft-deactivation marker so historic days aren't penalised when a coach
-- archives a habit. `active` stays for backward-compat reads; new logic
-- prefers (deactivated_at IS NULL OR deactivated_at > date).
ALTER TABLE public.habit_assignments
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Backfill: we don't actually know when an inactive habit was archived, so
-- we treat it as if it had never been active — set deactivated_at to its
-- created_at. This avoids retroactively breaking historic streaks for
-- habits the client had no opportunity to log against.
UPDATE public.habit_assignments
   SET deactivated_at = created_at
 WHERE active = FALSE AND deactivated_at IS NULL;

ALTER TABLE public.user_streaks
  ADD COLUMN IF NOT EXISTS today_status TEXT
    CHECK (today_status IN ('pending','complete','unmet','rest','none')),
  ADD COLUMN IF NOT EXISTS last_computed_at TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 2. Helpers
-- ----------------------------------------------------------------------------

-- "Today" in the user's local timezone, falling back to UTC if missing/invalid.
CREATE OR REPLACE FUNCTION public.fn_user_today(p_user_id UUID)
RETURNS DATE
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_tz TEXT;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO v_tz
    FROM public.profiles WHERE id = p_user_id;
  IF v_tz IS NULL THEN v_tz := 'UTC'; END IF;
  -- Defensive: bad tz strings throw; coerce to UTC.
  BEGIN
    RETURN (now() AT TIME ZONE v_tz)::date;
  EXCEPTION WHEN OTHERS THEN
    RETURN (now() AT TIME ZONE 'UTC')::date;
  END;
END;
$$;

-- Day classification.
--   'rest'     → scheduled_workouts row with source_type='rest'
--   'workout'  → scheduled_workouts row with non-rest source
--   'free'     → no scheduled_workouts row
CREATE OR REPLACE FUNCTION public.fn_day_status(p_user_id UUID, p_date DATE)
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_source TEXT;
BEGIN
  SELECT source_type INTO v_source
    FROM public.scheduled_workouts
   WHERE client_id = p_user_id AND scheduled_date = p_date
   LIMIT 1;
  IF NOT FOUND THEN RETURN 'free'; END IF;
  IF v_source = 'rest' THEN RETURN 'rest'; END IF;
  RETURN 'workout';
END;
$$;

-- Set of habit assignments required on a given date.
-- Daily habits: required iff created_at::date <= p_date AND
--               (deactivated_at IS NULL OR deactivated_at::date > p_date).
-- Weekly habits: required at the END of the rolling 7-day window only —
--               i.e., the *day* the streak engine evaluates them. We model
--               this by requiring at least one completion in [p_date - 6, p_date].
-- This function returns daily-required assignment ids; weekly handling lives
-- inside fn_day_complete because the satisfaction rule is different.
CREATE OR REPLACE FUNCTION public.fn_day_required_daily_habits(
  p_user_id UUID, p_date DATE
)
RETURNS TABLE(assignment_id UUID)
LANGUAGE sql STABLE AS $$
  SELECT id FROM public.habit_assignments
   WHERE client_id = p_user_id
     AND frequency = 'daily'
     AND created_at::date <= p_date
     AND (deactivated_at IS NULL OR deactivated_at::date > p_date);
$$;

CREATE OR REPLACE FUNCTION public.fn_day_required_weekly_habits(
  p_user_id UUID, p_date DATE
)
RETURNS TABLE(assignment_id UUID)
LANGUAGE sql STABLE AS $$
  SELECT id FROM public.habit_assignments
   WHERE client_id = p_user_id
     AND frequency = 'weekly'
     AND created_at::date <= p_date
     AND (deactivated_at IS NULL OR deactivated_at::date > p_date);
$$;

-- Whether a single calendar day "counts" for the consistency streak.
-- Returns one of: 'complete' | 'unmet' | 'rest' (informational; rest still
-- requires habits — if its habits are unmet, it returns 'unmet').
CREATE OR REPLACE FUNCTION public.fn_day_complete(p_user_id UUID, p_date DATE)
RETURNS TEXT
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_status TEXT;
  v_workout_ok BOOLEAN;
  v_daily_required INT;
  v_daily_done INT;
  v_weekly_required INT;
  v_weekly_satisfied INT;
BEGIN
  v_status := public.fn_day_status(p_user_id, p_date);

  -- Workout requirement
  IF v_status = 'workout' THEN
    SELECT completed INTO v_workout_ok
      FROM public.scheduled_workouts
     WHERE client_id = p_user_id AND scheduled_date = p_date
     LIMIT 1;
    IF NOT COALESCE(v_workout_ok, FALSE) THEN
      RETURN 'unmet';
    END IF;
  END IF;
  -- 'rest' and 'free' have no workout requirement.

  -- Daily habits: every required must have completed=true on this exact date.
  SELECT COUNT(*) INTO v_daily_required
    FROM public.fn_day_required_daily_habits(p_user_id, p_date);

  IF v_daily_required > 0 THEN
    SELECT COUNT(*) INTO v_daily_done
      FROM public.habit_logs hl
      JOIN public.fn_day_required_daily_habits(p_user_id, p_date) r
        ON r.assignment_id = hl.assignment_id
     WHERE hl.date = p_date AND hl.completed = TRUE;
    IF v_daily_done < v_daily_required THEN
      RETURN 'unmet';
    END IF;
  END IF;

  -- Weekly habits: each required must have at least one completion in the
  -- trailing 7 days ending p_date.
  SELECT COUNT(*) INTO v_weekly_required
    FROM public.fn_day_required_weekly_habits(p_user_id, p_date);

  IF v_weekly_required > 0 THEN
    SELECT COUNT(*) INTO v_weekly_satisfied
      FROM public.fn_day_required_weekly_habits(p_user_id, p_date) r
     WHERE EXISTS (
       SELECT 1 FROM public.habit_logs hl
        WHERE hl.assignment_id = r.assignment_id
          AND hl.completed = TRUE
          AND hl.date BETWEEN (p_date - INTERVAL '6 days')::date AND p_date
     );
    IF v_weekly_satisfied < v_weekly_required THEN
      RETURN 'unmet';
    END IF;
  END IF;

  IF v_status = 'rest' THEN RETURN 'rest'; END IF;
  RETURN 'complete';
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Streak computation
-- ----------------------------------------------------------------------------

-- Walks backward from today (user-local). Today's status is informational
-- only — pending today neither extends nor breaks. Historic days that are
-- unmet break immediately.
--
-- Returns one row with the cached fields. Side effect: updates user_streaks.
CREATE OR REPLACE FUNCTION public.fn_compute_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INT,
  longest_streak INT,
  today_status TEXT,
  last_completed_date DATE
)
LANGUAGE plpgsql AS $$
DECLARE
  v_today DATE;
  v_cursor DATE;
  v_streak INT := 0;
  v_today_status TEXT;
  v_day_status TEXT;
  v_last_completed DATE;
  v_existing_longest INT;
  v_new_longest INT;
  v_has_any_requirement BOOLEAN;
BEGIN
  v_today := public.fn_user_today(p_user_id);

  -- Classify today first.
  v_today_status := public.fn_day_complete(p_user_id, v_today);

  -- "Pending" = today not yet complete but the day isn't over. We translate
  -- 'unmet' on TODAY to 'pending' (the user can still hit it).
  -- 'rest' and 'complete' both mean today is satisfied.
  IF v_today_status = 'unmet' THEN
    v_today_status := 'pending';
  END IF;

  -- Determine where the walk starts:
  --   if today is satisfied (complete/rest) → include it
  --   if pending → start at yesterday (today doesn't extend yet)
  IF v_today_status IN ('complete', 'rest') THEN
    v_cursor := v_today;
  ELSE
    v_cursor := v_today - INTERVAL '1 day';
  END IF;

  -- Bounded walk backward. 3650 ≈ 10 years; no real user beats that.
  FOR i IN 1..3650 LOOP
    v_day_status := public.fn_day_complete(p_user_id, v_cursor);
    -- Skip days that have *zero* requirements at all (no habits existed yet
    -- AND no schedule row). Without this, a brand-new user would have
    -- "complete" days going back forever. We treat zero-requirement days
    -- as a hard stop instead.
    SELECT EXISTS (
      SELECT 1 FROM public.habit_assignments
       WHERE client_id = p_user_id AND created_at::date <= v_cursor
         AND (deactivated_at IS NULL OR deactivated_at::date > v_cursor)
    ) OR EXISTS (
      SELECT 1 FROM public.scheduled_workouts
       WHERE client_id = p_user_id AND scheduled_date = v_cursor
    ) INTO v_has_any_requirement;

    IF NOT v_has_any_requirement THEN
      EXIT;
    END IF;

    IF v_day_status IN ('complete', 'rest') THEN
      v_streak := v_streak + 1;
      IF v_last_completed IS NULL THEN v_last_completed := v_cursor; END IF;
      v_cursor := v_cursor - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  -- Persist cache. Insert on first call.
  SELECT us.longest_streak INTO v_existing_longest
    FROM public.user_streaks us WHERE us.user_id = p_user_id;
  v_new_longest := GREATEST(COALESCE(v_existing_longest, 0), v_streak);

  INSERT INTO public.user_streaks AS us (
    user_id, current_streak, longest_streak, last_workout_date,
    today_status, last_computed_at, updated_at
  ) VALUES (
    p_user_id, v_streak, v_new_longest, v_last_completed,
    v_today_status, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak     = EXCLUDED.current_streak,
    longest_streak     = GREATEST(us.longest_streak, EXCLUDED.current_streak),
    last_workout_date  = EXCLUDED.last_workout_date,
    today_status       = EXCLUDED.today_status,
    last_computed_at   = EXCLUDED.last_computed_at,
    updated_at         = NOW();

  RETURN QUERY
    SELECT v_streak, v_new_longest, v_today_status, v_last_completed;
END;
$$;

-- SECURITY DEFINER wrapper for client-side invocation. Locks the user_id to
-- auth.uid() so a client can't compute someone else's streak.
CREATE OR REPLACE FUNCTION public.refresh_my_streak()
RETURNS TABLE(
  current_streak INT,
  longest_streak INT,
  today_status TEXT,
  last_completed_date DATE
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'auth required';
  END IF;
  RETURN QUERY SELECT * FROM public.fn_compute_streak(auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_my_streak() TO authenticated;

-- The legacy update_user_streak(user_id, date) RPC is still called from
-- mobile (ActiveWorkoutContext). Replace its body to delegate to the new
-- engine so workout completion immediately recomputes consistency. Signature
-- preserved for backward-compat.
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
  v_prev_longest INT;
  v_new_streak INT;
  v_new_longest INT;
BEGIN
  SELECT longest_streak INTO v_prev_longest
    FROM public.user_streaks WHERE user_id = p_user_id;
  v_prev_longest := COALESCE(v_prev_longest, 0);

  SELECT cs.current_streak, cs.longest_streak
    INTO v_new_streak, v_new_longest
    FROM public.fn_compute_streak(p_user_id) cs;

  RETURN QUERY SELECT
    v_new_streak,
    v_new_longest,
    (v_new_longest > v_prev_longest);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_user_streak(UUID, DATE) TO authenticated;

-- ----------------------------------------------------------------------------
-- 4. Triggers — recompute on relevant writes
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.trg_recompute_streak_for_client()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_uid UUID;
BEGIN
  v_uid := COALESCE(
    (CASE WHEN TG_OP = 'DELETE' THEN OLD.client_id ELSE NEW.client_id END),
    NULL
  );
  IF v_uid IS NOT NULL THEN
    PERFORM public.fn_compute_streak(v_uid);
  END IF;
  RETURN NULL; -- AFTER trigger; return value ignored
END;
$$;

DROP TRIGGER IF EXISTS trg_habit_logs_recompute_streak ON public.habit_logs;
CREATE TRIGGER trg_habit_logs_recompute_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.habit_logs
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_streak_for_client();

DROP TRIGGER IF EXISTS trg_scheduled_workouts_recompute_streak ON public.scheduled_workouts;
CREATE TRIGGER trg_scheduled_workouts_recompute_streak
  AFTER INSERT OR UPDATE OF completed, source_type, scheduled_date OR DELETE
  ON public.scheduled_workouts
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_streak_for_client();

DROP TRIGGER IF EXISTS trg_habit_assignments_recompute_streak ON public.habit_assignments;
CREATE TRIGGER trg_habit_assignments_recompute_streak
  AFTER INSERT OR UPDATE OF active, deactivated_at, frequency, created_at OR DELETE
  ON public.habit_assignments
  FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_streak_for_client();

-- ----------------------------------------------------------------------------
-- 5. Reset legacy streaks
-- The old current_streak measured "consecutive workout-session days" which is
-- a strictly different metric. Reset to 0 so users start fresh under the new
-- definition; longest_streak is preserved as a historic celebration number.
-- ----------------------------------------------------------------------------
UPDATE public.user_streaks
   SET current_streak = 0,
       today_status   = NULL,
       last_computed_at = NULL,
       updated_at     = NOW();

ANALYZE public.user_streaks;
ANALYZE public.habit_assignments;
