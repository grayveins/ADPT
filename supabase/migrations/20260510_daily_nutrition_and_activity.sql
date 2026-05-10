-- ============================================================================
-- Daily intake + activity rollups (HealthKit-fed, MFP-bridge-friendly)
--
-- Read-only sync from Apple HealthKit on iOS. We don't try to integrate
-- directly with MyFitnessPal — there's no public API. Instead, users enable
-- MFP → Apple Health on their device, and we read the resulting samples.
-- The same applies to Cronometer / Lose It / Carbon / manual Health-app
-- entries — they all feed HealthKit, we read the daily totals, the source
-- app is irrelevant to our schema.
--
-- `source` column carries 'healthkit' for now. Future sources we may add:
--   • 'manual'       — in-app food logging (deferred)
--   • 'mfp_direct'   — if/when MFP ever opens an API to us
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- daily_nutrition — what the user ate today (calories + macros)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_nutrition (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  calories        INTEGER,
  protein_g       DECIMAL(6,1),
  carbs_g         DECIMAL(6,1),
  fat_g           DECIMAL(6,1),
  source          TEXT NOT NULL DEFAULT 'healthkit',
  last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_daily_nutrition UNIQUE (client_id, date, source)
);

CREATE INDEX IF NOT EXISTS idx_daily_nutrition_client_date
  ON public.daily_nutrition (client_id, date DESC);

ALTER TABLE public.daily_nutrition ENABLE ROW LEVEL SECURITY;

-- Client owns their rows.
CREATE POLICY "client manages own nutrition"
  ON public.daily_nutrition FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Coach can read intake for clients in active coaching relationships.
CREATE POLICY "coach reads client nutrition"
  ON public.daily_nutrition FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Service role bypass for any future server-side ingest.
CREATE POLICY "service role full access to daily_nutrition"
  ON public.daily_nutrition FOR ALL
  USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────────────────────
-- daily_activity — steps + active energy per day
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_activity (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date               DATE NOT NULL,
  steps              INTEGER,
  active_energy_kcal INTEGER,
  source             TEXT NOT NULL DEFAULT 'healthkit',
  last_synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_daily_activity UNIQUE (client_id, date, source)
);

CREATE INDEX IF NOT EXISTS idx_daily_activity_client_date
  ON public.daily_activity (client_id, date DESC);

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client manages own activity"
  ON public.daily_activity FOR ALL
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "coach reads client activity"
  ON public.daily_activity FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM public.coach_clients
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "service role full access to daily_activity"
  ON public.daily_activity FOR ALL
  USING (auth.role() = 'service_role');

ANALYZE public.daily_nutrition;
ANALYZE public.daily_activity;
