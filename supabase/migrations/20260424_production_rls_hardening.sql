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
