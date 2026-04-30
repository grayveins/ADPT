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
