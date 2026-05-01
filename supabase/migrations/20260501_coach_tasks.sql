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
